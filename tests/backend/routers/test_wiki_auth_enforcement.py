"""Regression coverage for WIKI_AUTH_MODE enforcement.

Before this fix, enabling WIKI_AUTH_MODE only protected DELETE
/api/wiki_cache. Every other costly or sensitive route (wiki generation,
repo indexing, chat, codemap, cache reads) performed no check at all, so
an operator who turned on the one documented protection mechanism got no
actual protection anywhere but that single endpoint.
"""

import pytest
from fastapi.testclient import TestClient

import api.routers.auth as auth_router
import api.services.wiki.tasks as wt


@pytest.fixture(autouse=True)
def _clear_registry():
    wt.registry._tasks.clear()
    yield
    wt.registry._tasks.clear()


@pytest.fixture
def auth_enabled(monkeypatch):
    monkeypatch.setattr(auth_router, "WIKI_AUTH_MODE", True)
    monkeypatch.setattr(auth_router, "WIKI_AUTH_CODE", "correct-code")
    yield


def _wiki_task_body(**overrides):
    body = {"owner": "o", "repo": "r", "type": "github", "repo_url": "https://github.com/o/r"}
    body.update(overrides)
    return body


def test_submit_wiki_task_rejects_missing_code(auth_enabled):
    from api.main import app

    with TestClient(app) as client:
        r = client.post("/wiki/tasks", json=_wiki_task_body())
        assert r.status_code == 401


def test_submit_wiki_task_rejects_wrong_code(auth_enabled):
    from api.main import app

    with TestClient(app) as client:
        r = client.post(
            "/wiki/tasks", json=_wiki_task_body(authorization_code="wrong")
        )
        assert r.status_code == 401


def test_submit_wiki_task_accepts_correct_code(auth_enabled, monkeypatch):
    monkeypatch.setattr(wt, "wiki_cache_exists", lambda *p, **kwargs: False)
    monkeypatch.setattr(wt, "repo_index_exist", lambda repo: True)

    async def fake_determine(task):
        from api.schemas import WikiStructureModel

        return WikiStructureModel(id="wiki", title="T", description="D", pages=[])

    monkeypatch.setattr(wt, "_determine_structure", fake_determine)

    from api.main import app

    with TestClient(app) as client:
        r = client.post(
            "/wiki/tasks",
            json=_wiki_task_body(authorization_code="correct-code"),
        )
        assert r.status_code == 200, r.text


def test_prepare_repo_rejects_missing_code(auth_enabled):
    from api.main import app

    with TestClient(app) as client:
        r = client.post(
            "/repo/prepare",
            json={"repo_url": "https://github.com/o/r", "type": "github"},
        )
        assert r.status_code == 401


def test_codemap_file_rejects_missing_code(auth_enabled):
    from api.main import app

    with TestClient(app) as client:
        r = client.get(
            "/codemap/file",
            params={"repo_url": "/", "file_path": "x", "type": "github"},
        )
        assert r.status_code == 401


def test_read_wiki_cache_rejects_missing_code(auth_enabled):
    from api.main import app

    with TestClient(app) as client:
        r = client.get(
            "/api/wiki_cache",
            params={
                "owner": "o",
                "repo": "r",
                "repo_type": "github",
                "language": "en",
            },
        )
        assert r.status_code == 401


def test_delete_wiki_cache_still_enforces_code(auth_enabled):
    """The one route that already checked this must keep working."""
    from api.main import app

    with TestClient(app) as client:
        r = client.delete(
            "/api/wiki_cache",
            params={
                "owner": "o",
                "repo": "r",
                "repo_type": "github",
                "language": "en",
            },
        )
        assert r.status_code == 401


def test_routes_are_unprotected_when_auth_mode_disabled(monkeypatch):
    """Default (WIKI_AUTH_MODE off): no regression for normal operators."""
    monkeypatch.setattr(auth_router, "WIKI_AUTH_MODE", False)

    from api.main import app

    with TestClient(app) as client:
        r = client.get(
            "/api/wiki_cache",
            params={
                "owner": "o",
                "repo": "r",
                "repo_type": "github",
                "language": "en",
            },
        )
        assert r.status_code == 200
