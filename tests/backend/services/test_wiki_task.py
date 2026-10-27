import asyncio

import pytest

import api.services.wiki.tasks as wt
from api.schemas import WikiPage, WikiStructureModel, WikiTaskRequest
from api.services.wiki.tasks import (
    TaskRegistry,
    TaskStatus,
    WikiTask,
    generate_repo_wiki,
)

pytestmark = pytest.mark.asyncio


def _req(**kw) -> WikiTask:
    d = dict(
        owner="o",
        repo="r",
        type="github",
        repo_url="https://github.com/o/r",
    )
    d.update(kw)
    return WikiTask.from_wiki_request(WikiTaskRequest(**d))


def _structure(n: int = 2) -> WikiStructureModel:
    pages = [
        WikiPage(
            id=f"page-{i}",
            title=f"P{i}",
            content="",
            filePaths=[],
            importance="high",
            relatedPages=[],
        )
        for i in range(1, n + 1)
    ]
    return WikiStructureModel(id="wiki", title="T", description="D", pages=pages)


async def _wait_active(reg: TaskRegistry, task_id: str) -> None:
    for _ in range(50):
        t = reg.get(task_id)
        if t and t.status != TaskStatus.PENDING:
            return
        await asyncio.sleep(0)


# --------------------------------------------------------------------------- #
# submit() branches
# --------------------------------------------------------------------------- #
async def test_submit_creates_and_completes(monkeypatch):
    reg = TaskRegistry()
    monkeypatch.setattr(wt, "WIKI_TASK_TTL_SECONDS", 0)
    monkeypatch.setattr(wt, "wiki_cache_exists", lambda **p: False)
    monkeypatch.setattr(wt, "repo_index_exist", lambda repo: True)  # skip indexing

    structure = _structure(2)
    saved: dict = {}

    async def fake_determine(task):
        return structure

    async def fake_generate(task, page):
        return page.model_copy(update={"content": f"ok:{page.id}"})

    async def fake_save(task, pages):
        saved["pages"] = pages

    monkeypatch.setattr(wt, "_determine_structure", fake_determine)
    monkeypatch.setattr(wt, "_generate_page", fake_generate)
    monkeypatch.setattr(wt, "_save", fake_save)

    res = await reg.submit(_req(), async_func=generate_repo_wiki)
    assert res.created and res.status == TaskStatus.PENDING

    task = reg.get(res.task_id)
    await task.task  # wait for the worker to finish

    assert task.status == TaskStatus.COMPLETED
    assert task.pages_total == 2 and task.pages_done == 2
    assert saved["pages"]["page-1"].content == "ok:page-1"


async def test_submit_joins_active_task(monkeypatch):
    reg = TaskRegistry(max_concurrent=2)
    monkeypatch.setattr(wt, "WIKI_TASK_TTL_SECONDS", 0)
    monkeypatch.setattr(wt, "wiki_cache_exists", lambda **p: False)

    gate = asyncio.Event()

    async def blocking_run(task: WikiTask) -> None:
        task.status = TaskStatus.GENERATING
        await gate.wait()
        task.status = TaskStatus.COMPLETED


    r1 = await reg.submit(_req(), blocking_run)
    assert r1.created
    await _wait_active(reg, r1.task_id)

    r2 = await reg.submit(_req(language="ja"), blocking_run)  # different settings, same repo
    assert r2.joined and not r2.created
    assert r2.task_id == r1.task_id

    gate.set()
    await reg.get(r1.task_id).task


async def test_submit_serves_cache(monkeypatch):
    reg = TaskRegistry()
    monkeypatch.setattr(wt, "wiki_cache_exists", lambda **p: True)

    res = await reg.submit(_req(), generate_repo_wiki)
    assert res.from_cache and not res.created
    assert res.status == TaskStatus.COMPLETED
    assert reg.get(res.task_id) is None  # no task was created


# --------------------------------------------------------------------------- #
# run_task() state machine
# --------------------------------------------------------------------------- #
async def test_page_failure_yields_placeholder_but_completes(monkeypatch):
    monkeypatch.setattr(wt, "repo_index_exist", lambda repo: True)
    monkeypatch.setattr(wt, "WIKI_PAGE_RETRIES", 1)

    saved: dict = {}

    async def fake_determine(task):
        return _structure(1)

    async def failing_generate(task, page):
        raise RuntimeError("boom")

    async def fake_save(task, pages):
        saved.update(pages)

    monkeypatch.setattr(wt, "_determine_structure", fake_determine)
    monkeypatch.setattr(wt, "_generate_page", failing_generate)
    monkeypatch.setattr(wt, "_save", fake_save)

    task = _req()
    await generate_repo_wiki(task)

    assert task.status == TaskStatus.COMPLETED  # one bad page must not fail the task
    assert "Error generating content: boom" in saved["page-1"].content


async def test_determine_structure_failure_fails_task(monkeypatch):
    monkeypatch.setattr(wt, "repo_index_exist", lambda repo: True)

    async def boom(task):
        raise RuntimeError("no structure")

    monkeypatch.setattr(wt, "_determine_structure", boom)

    task = _req()
    await generate_repo_wiki(task)

    assert task.status == TaskStatus.FAILED
    assert "no structure" in (task.error or "")


# --------------------------------------------------------------------------- #
# generate_page (real implementation)
# --------------------------------------------------------------------------- #
async def test_generate_page_strips_fences_and_resolves_citations(monkeypatch):
    async def fake_research_chat(request):
        async def gen():
            yield "```markdown\n"
            yield "# P1\n\nExplained here [README.md:1-2]().\n"
            yield "```"

        return gen()

    monkeypatch.setattr(wt, "research_chat", fake_research_chat)

    page = WikiPage(
        id="page-1",
        title="P1",
        content="",
        filePaths=["README.md"],
        importance="high",
        relatedPages=[],
    )
    out = await wt._generate_page(_req(), page)

    # leading ```markdown fence stripped
    assert "```markdown" not in out.content
    # <details> block rebuilt from filePaths
    assert out.content.startswith("<details>")
    # empty citation resolved to a real GitHub URL with line anchor
    assert (
        "[README.md:1-2](https://github.com/o/r/blob/main/README.md#L1-L2)"
        in out.content
    )


# --------------------------------------------------------------------------- #
# determine_structure + full run_task (real content steps, patched boundaries)
# --------------------------------------------------------------------------- #
class _FakeRepo:
    def __init__(self, *a, **k):
        self.is_local = True
        self.downloaded = True
        self.save_path = "."


_STRUCT_XML = (
    "<wiki_structure><title>T</title><description>d</description><pages>"
    '<page id="page-1"><title>P1</title><importance>high</importance>'
    "<relevant_files><file_path>README.md</file_path></relevant_files></page>"
    "</pages></wiki_structure>"
)


async def test_run_task_end_to_end(monkeypatch):
    monkeypatch.setattr(wt, "WIKI_TASK_TTL_SECONDS", 0)
    monkeypatch.setattr(wt, "repo_index_exist", lambda repo: True)
    monkeypatch.setattr(wt, "Repo", _FakeRepo)
    monkeypatch.setattr(wt, "detect_default_branch", lambda p: "main")
    monkeypatch.setattr(
        wt, "read_repo_file_tree", lambda p, *a, **k: ("README.md\nsrc/a.py", "readme")
    )

    async def fake_research(request):
        # structure prompt contains "<file_tree>"; page prompt does not.
        is_structure = "<file_tree>" in request.messages[-1].content
        body = _STRUCT_XML if is_structure else "# P1\n\nExplained [README.md:1]()."

        async def gen():
            yield body

        return gen()

    monkeypatch.setattr(wt, "research_chat", fake_research)

    saved: dict = {}

    async def fake_save(task, pages):
        saved["pages"] = pages

    monkeypatch.setattr(wt, "_save", fake_save)

    task = _req(comprehensive=False)
    await generate_repo_wiki(task)

    assert task.status == TaskStatus.COMPLETED
    assert task.default_branch == "main"
    assert task.pages_total == 1 and task.pages_done == 1
    content = saved["pages"]["page-1"].content
    assert content.startswith("<details>")
    assert "[README.md:1](https://github.com/o/r/blob/main/README.md#L1)" in content


# --------------------------------------------------------------------------- #
# serialization
# --------------------------------------------------------------------------- #
async def test_public_dict_hides_token():
    task = _req(token="SECRET")
    d = task.to_status().model_dump()
    assert "token" not in d
    assert "SECRET" not in str(d)
    assert d["name"] == "o/r" and d["status"] == "pending"
