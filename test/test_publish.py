"""
Unit tests for the opt-in publish path used to register graphs with the
looptech-ai/understand-quickly registry.

These tests are deliberately self-contained: they import only ``api.publish``
(stdlib-only dependencies) and never reach for the heavier ``data_pipeline``
imports, so they run without ``adalflow`` or any AI provider keys.
"""

from __future__ import annotations

import json
import os
import re
import sys
from unittest.mock import patch
from urllib import error as urllib_error

# Make ``api.publish`` importable when this file is run directly.
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from api.publish import (  # noqa: E402  (path tweak above is intentional)
    DISPATCH_URL,
    TOOL_NAME,
    build_graph_payload,
    derive_owner_repo,
    dispatch_sync,
    publish,
)


SAMPLE_PAGES = [
    {
        "id": "page-overview",
        "title": "Overview",
        "content": "Top-level intro.",
        "filePaths": ["README.md"],
        "importance": "high",
        "relatedPages": ["page-architecture"],
    },
    {
        "id": "page-architecture",
        "title": "Architecture",
        "content": "Architecture details.",
        "filePaths": ["api/api.py", "api/data_pipeline.py"],
        "importance": "medium",
        "relatedPages": ["page-overview", "page-missing"],  # 1 dangling
    },
]


class TestDeriveOwnerRepo:
    def test_https_url(self):
        assert (
            derive_owner_repo("https://github.com/AsyncFuncAI/deepwiki-open")
            == "AsyncFuncAI/deepwiki-open"
        )

    def test_https_url_with_git_suffix(self):
        assert (
            derive_owner_repo(
                "https://github.com/AsyncFuncAI/deepwiki-open.git"
            )
            == "AsyncFuncAI/deepwiki-open"
        )

    def test_https_url_with_trailing_slash(self):
        assert (
            derive_owner_repo("https://github.com/AsyncFuncAI/deepwiki-open/")
            == "AsyncFuncAI/deepwiki-open"
        )

    def test_ssh_url(self):
        assert (
            derive_owner_repo("git@github.com:AsyncFuncAI/deepwiki-open.git")
            == "AsyncFuncAI/deepwiki-open"
        )

    def test_returns_none_for_unrecognised(self):
        assert derive_owner_repo(None) is None
        assert derive_owner_repo("") is None
        assert derive_owner_repo("https://gitlab.com/owner/repo") is None
        assert derive_owner_repo("not a url") is None


class TestBuildGraphPayload:
    def test_basic_shape_is_generic_v1_compatible(self):
        payload = build_graph_payload(SAMPLE_PAGES, repo_url="https://example/x")
        assert set(payload.keys()) >= {"nodes", "edges", "metadata"}
        assert isinstance(payload["nodes"], list)
        assert isinstance(payload["edges"], list)
        assert len(payload["nodes"]) == 2

    def test_metadata_fields(self):
        payload = build_graph_payload(
            SAMPLE_PAGES,
            repo_url="https://github.com/AsyncFuncAI/deepwiki-open",
            tool_version="1.2.3",
            commit="a" * 40,
        )
        meta = payload["metadata"]
        assert meta["tool"] == TOOL_NAME == "deepwiki-open"
        assert meta["tool_version"] == "1.2.3"
        # ISO-8601 UTC, ending in Z
        assert re.match(
            r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$", meta["generated_at"]
        )
        assert meta["commit"] == "a" * 40
        assert meta["repo_url"] == "https://github.com/AsyncFuncAI/deepwiki-open"

    def test_metadata_omits_commit_when_unknown(self):
        payload = build_graph_payload(SAMPLE_PAGES)
        assert "commit" not in payload["metadata"]

    def test_nodes_carry_label_and_filepaths(self):
        payload = build_graph_payload(SAMPLE_PAGES)
        nodes = {n["id"]: n for n in payload["nodes"]}
        assert nodes["page-overview"]["kind"] == "wiki-page"
        assert nodes["page-overview"]["label"] == "Overview"
        assert nodes["page-overview"]["data"]["filePaths"] == ["README.md"]
        assert nodes["page-overview"]["data"]["importance"] == "high"

    def test_dangling_related_refs_are_dropped(self):
        payload = build_graph_payload(SAMPLE_PAGES)
        edge_pairs = {(e["source"], e["target"]) for e in payload["edges"]}
        assert ("page-overview", "page-architecture") in edge_pairs
        assert ("page-architecture", "page-overview") in edge_pairs
        # The dangling "page-missing" reference must NOT produce an edge.
        assert all(t != "page-missing" for _, t in edge_pairs)
        assert all(e["kind"] == "related" for e in payload["edges"])


class TestPublishNoOpPaths:
    def test_no_token_no_op(self):
        env = {k: v for k, v in os.environ.items() if k != "UNDERSTAND_QUICKLY_TOKEN"}
        with patch.dict(os.environ, env, clear=True):
            with patch("api.publish.urllib_request.urlopen") as mocked:
                result = publish(
                    {"nodes": [], "edges": []},
                    owner_repo="looptech-ai/understand-quickly",
                )
        assert result["dispatched"] is False
        assert result["reason"] == "no-token"
        mocked.assert_not_called()

    def test_no_owner_repo_no_op(self):
        with patch.dict(os.environ, {"UNDERSTAND_QUICKLY_TOKEN": "x"}):
            with patch("api.publish.urllib_request.urlopen") as mocked:
                result = publish({"nodes": [], "edges": []}, owner_repo=None)
        assert result["dispatched"] is False
        assert result["reason"] == "no-owner-repo"
        mocked.assert_not_called()


class _FakeResponse:
    def __init__(self, status: int = 204):
        self.status = status

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def getcode(self):
        return self.status


class TestDispatchSync:
    def test_success_sends_correct_request(self):
        captured = {}

        def fake_urlopen(req, timeout=None):
            captured["url"] = req.full_url
            captured["method"] = req.get_method()
            captured["headers"] = {k.lower(): v for k, v in req.header_items()}
            captured["body"] = json.loads(req.data.decode("utf-8"))
            return _FakeResponse(204)

        with patch("api.publish.urllib_request.urlopen", side_effect=fake_urlopen):
            ok, err = dispatch_sync("looptech-ai/understand-quickly", "tok-abc")

        assert ok is True
        assert err is None
        assert captured["url"] == DISPATCH_URL
        assert captured["method"] == "POST"
        assert captured["headers"]["authorization"] == "Bearer tok-abc"
        assert captured["headers"]["accept"] == "application/vnd.github+json"
        assert captured["headers"]["x-github-api-version"] == "2022-11-28"
        assert captured["body"] == {
            "event_type": "sync-entry",
            "client_payload": {"id": "looptech-ai/understand-quickly"},
        }

    def test_http_error_is_soft_failure(self):
        def boom(req, timeout=None):
            raise urllib_error.HTTPError(
                req.full_url, 422, "Unprocessable Entity", {}, None
            )

        with patch("api.publish.urllib_request.urlopen", side_effect=boom):
            ok, err = dispatch_sync("owner/unknown", "tok")

        assert ok is False
        assert err is not None and "422" in err

    def test_publish_dispatch_failure_returns_dispatch_failed(self):
        def boom(req, timeout=None):
            raise urllib_error.HTTPError(
                req.full_url, 422, "Unprocessable Entity", {}, None
            )

        with patch.dict(os.environ, {"UNDERSTAND_QUICKLY_TOKEN": "tok"}):
            with patch("api.publish.urllib_request.urlopen", side_effect=boom):
                result = publish(
                    {"nodes": [], "edges": []},
                    owner_repo="owner/unknown",
                )

        assert result["dispatched"] is False
        assert result["reason"] == "dispatch-failed"
        assert "npx @understand-quickly/cli add" in result["message"]
