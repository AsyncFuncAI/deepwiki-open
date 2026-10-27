import json
import time

import pytest
from fastapi.testclient import TestClient

import api.routers.wiki as wiki_router
import api.services.wiki.tasks as wt
from api.schemas import WikiPage, WikiStructureModel, WikiTaskRequest
from api.services.wiki.tasks import TaskStatus, WikiTask


@pytest.fixture(autouse=True)
def _clear_registry():
    wt.registry._tasks.clear()
    yield
    wt.registry._tasks.clear()


def _structure() -> WikiStructureModel:
    return WikiStructureModel(
        id="wiki",
        title="T",
        description="D",
        pages=[
            WikiPage(
                id="page-1",
                title="P1",
                content="",
                filePaths=[],
                importance="high",
                relatedPages=[],
            )
        ],
    )


def _patch_stubs(monkeypatch):
    monkeypatch.setattr(wt, "wiki_cache_exists", lambda *p, **kwargs: False)
    monkeypatch.setattr(wt, "repo_index_exist", lambda repo: True)  # skip indexing
    monkeypatch.setattr(wt, "WIKI_TASK_TTL_SECONDS", 5)

    async def fake_determine(task):
        return _structure()

    async def fake_generate(task, page):
        return page.model_copy(update={"content": "ok"})

    async def fake_save(task, pages):
        pass

    monkeypatch.setattr(wt, "_determine_structure", fake_determine)
    monkeypatch.setattr(wt, "_generate_page", fake_generate)
    monkeypatch.setattr(wt, "_save", fake_save)


def test_submit_then_progress_to_completed(monkeypatch):
    _patch_stubs(monkeypatch)
    from api.main import app

    with TestClient(app) as client:
        body = {
            "owner": "o",
            "repo": "r",
            "type": "github",
            "repo_url": "https://github.com/o/r",
            "language": "en",
        }
        r = client.post("/wiki/tasks", json=body)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["created"] is True and data["status"] == "pending"
        task_id = data["task_id"]
        assert task_id == "github_o_r"

        for _ in range(50):
            g = client.get(f"/wiki/tasks/{task_id}")
            if g.status_code == 200 and g.json()["status"] == "completed":
                break
            time.sleep(0.1)
        else:
            pytest.fail("task did not reach completed")

        done = client.get(f"/wiki/tasks/{task_id}").json()
        assert done["pages_total"] == 1 and done["pages_done"] == 1
        assert "token" not in done


def test_submit_twice_joins(monkeypatch):
    _patch_stubs(monkeypatch)
    # make generation block so the first task stays active for the second submit
    started = {"go": False}

    async def slow_generate(task, page):
        while not started["go"]:
            import asyncio

            await asyncio.sleep(0.02)
        return page.model_copy(update={"content": "ok"})

    monkeypatch.setattr(wt, "_generate_page", slow_generate)
    from api.main import app

    with TestClient(app) as client:
        body = {"owner": "o", "repo": "r", "type": "github", "repo_url": "https://github.com/o/r"}
        r1 = client.post("/wiki/tasks", json=body).json()
        # second submit (different language) must JOIN the active task
        r2 = client.post("/wiki/tasks", json={**body, "language": "ja"}).json()
        assert r2["joined"] is True and r2["created"] is False
        assert r2["task_id"] == r1["task_id"]
        started["go"] = True


def test_list_and_unknown(monkeypatch):
    from api.main import app

    with TestClient(app) as client:
        assert client.get("/wiki/tasks").status_code == 200
        assert isinstance(client.get("/wiki/tasks").json(), list)
        assert client.get("/wiki/tasks?status=active").json() == []
        assert client.get("/wiki/tasks/nope_nope_nope").status_code == 404


def test_list_summary_omits_wiki_structure(monkeypatch):
    _patch_stubs(monkeypatch)
    gate = {"go": False}

    async def slow_generate(task, page):
        import asyncio

        while not gate["go"]:
            await asyncio.sleep(0.02)
        return page.model_copy(update={"content": "ok"})

    monkeypatch.setattr(wt, "_generate_page", slow_generate)
    from api.main import app

    with TestClient(app) as client:
        body = {"owner": "o", "repo": "r", "type": "github", "repo_url": "https://github.com/o/r"}
        tid = client.post("/wiki/tasks", json=body).json()["task_id"]

        entry = None
        for _ in range(50):
            lst = client.get("/wiki/tasks?status=active").json()
            if lst:
                entry = lst[0]
                break
            time.sleep(0.05)
        assert entry is not None, "task never appeared in the active list"

        # list uses WikiTaskSummary -> no wiki_structure field at all
        assert "wiki_structure" not in entry
        assert {"id", "status", "pages_done", "pages_total", "submitted_at"} <= set(entry)

        # single endpoint uses WikiTaskStatus -> wiki_structure field present
        single = client.get(f"/wiki/tasks/{tid}").json()
        assert "wiki_structure" in single

        gate["go"] = True


# --------------------------------------------------------------------------- #
# GET /wiki/tasks/{task_id}/stream (SSE)
# --------------------------------------------------------------------------- #
def _sse_first_data(text: str) -> dict:
    """Return the first `data:` frame in an SSE body, parsed as JSON."""
    line = next(l for l in text.splitlines() if l.startswith("data:"))
    return json.loads(line[len("data:"):].strip())


def test_stream_unknown_task_returns_404():
    from api.main import app

    with TestClient(app) as client:
        assert client.get("/wiki/tasks/does_not_exist/stream").status_code == 404


def test_stream_completed_emits_done_event(monkeypatch):
    _patch_stubs(monkeypatch)
    from api.main import app

    with TestClient(app) as client:
        body = {"owner": "o", "repo": "r", "type": "github", "repo_url": "https://github.com/o/r"}
        tid = client.post("/wiki/tasks", json=body).json()["task_id"]

        # Let the task finish first; a terminal task makes the stream emit a
        # single `done` frame and return immediately (no hanging read).
        for _ in range(50):
            if client.get(f"/wiki/tasks/{tid}").json()["status"] == "completed":
                break
            time.sleep(0.1)
        else:
            pytest.fail("task did not complete")

        r = client.get(f"/wiki/tasks/{tid}/stream")
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("text/event-stream")
        assert "event: done" in r.text

        payload = _sse_first_data(r.text)
        assert payload["status"] == "completed"
        assert payload["pages_done"] == payload["pages_total"] == 1
        assert "token" not in payload  # token must never be streamed


def test_stream_failed_emits_error_event(monkeypatch):
    _patch_stubs(monkeypatch)

    async def boom(task):
        raise RuntimeError("structure boom")

    monkeypatch.setattr(wt, "_determine_structure", boom)
    from api.main import app

    with TestClient(app) as client:
        body = {"owner": "o", "repo": "r", "type": "github", "repo_url": "https://github.com/o/r"}
        tid = client.post("/wiki/tasks", json=body).json()["task_id"]

        for _ in range(50):
            if client.get(f"/wiki/tasks/{tid}").json()["status"] == "failed":
                break
            time.sleep(0.1)
        else:
            pytest.fail("task did not fail")

        r = client.get(f"/wiki/tasks/{tid}/stream")
        assert r.status_code == 200
        assert "event: error" in r.text

        payload = _sse_first_data(r.text)
        assert payload["status"] == "failed"
        assert "structure boom" in (payload["error"] or "")


@pytest.mark.asyncio
async def test_stream_emits_progress_then_done(monkeypatch):
    # Starlette's TestClient buffers a streaming response to completion before
    # returning, so it cannot observe an intermediate `progress` frame while a
    # task is still running. Drive the endpoint's SSE generator directly instead.

    # Collapse the 1s inter-frame delay so the test is fast + deterministic.
    async def _no_sleep(*_a, **_k):
        return

    monkeypatch.setattr(wiki_router.asyncio, "sleep", _no_sleep)

    task = WikiTask.from_wiki_request(
        WikiTaskRequest(
            owner="o", repo="r", type="github", repo_url="https://github.com/o/r"
        )
    )
    task.status = TaskStatus.GENERATING
    task.wiki_structure = _structure()  # 1 page -> pages_total == 1
    task.current_page_ids = ["page-1"]
    wt.registry._tasks[task.repo_key] = task

    resp = await wiki_router.stream_wiki_task(task.repo_key)
    frames = resp.body_iterator

    # 1st frame: a progress event carrying the in-flight page id.
    first = await frames.__anext__()
    assert "event: progress" in first
    progress = json.loads(first.split("data:", 1)[1].strip())
    assert progress["status"] == "generating"
    assert progress["current_page_ids"] == ["page-1"]
    assert "token" not in progress

    # Flip to terminal; the next frame must be the `done` event, then the
    # generator returns (StopAsyncIteration).
    task.status = TaskStatus.COMPLETED
    task.pages_done = 1
    second = await frames.__anext__()
    assert "event: done" in second
    done = json.loads(second.split("data:", 1)[1].strip())
    assert done["status"] == "completed"
    assert done["pages_done"] == done["pages_total"] == 1

    with pytest.raises(StopAsyncIteration):
        await frames.__anext__()
