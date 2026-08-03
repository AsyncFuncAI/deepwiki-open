import time

import pytest
from fastapi.testclient import TestClient

import api.services.wiki.tasks as wt
from api.schemas import WikiPage, WikiStructureModel


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
