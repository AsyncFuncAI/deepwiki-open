"""Exercise research resolution, real MCP HTTP requests and prompt/stream consumption."""

import asyncio
import json
import os
from contextlib import asynccontextmanager
from pathlib import Path
from types import SimpleNamespace

import aiohttp
from aiohttp import web
import httpx
import pytest
from fastapi import FastAPI

from api.routers.chat import router
from api.schemas import ChatCompletionRequest
from api.services import research, web_search

URL = "https://docs.python.org/3/library/asyncio-task.html"
QUERY = "How does asyncio cancellation affect this repository?"


def request(**overrides):
    return ChatCompletionRequest(
        **{
            "repo_url": "https://github.com/example/project",
            "provider": "ollama",
            "model": "local-model",
            "messages": [{"role": "user", "content": QUERY, "mode": "deep_research"}],
            **overrides,
        }
    )


@pytest.fixture
def runtime(monkeypatch):
    for name in (
        "PARALLEL_API_KEY", "DEEPWIKI_SEARCH_PROVIDER", "DEEPWIKI_WEB_SEARCH_ALLOWED",
        "OPENAI_API_KEY", "GOOGLE_API_KEY", "OPENROUTER_API_KEY",
    ):
        monkeypatch.delenv(name, raising=False)
    prompts = []
    rag = SimpleNamespace(memory=lambda: {})
    async def prepare(**kwargs):
        return rag
    async def retrieve(*args, **kwargs):
        doc = SimpleNamespace(text="REPOSITORY_CODE", meta_data={"file_path": "worker.py"})
        return [SimpleNamespace(documents=[doc])]
    rag.acall = retrieve
    class ScriptedStreamer:
        async def respond_stream(self, prompt):
            prompts.append(prompt)
            yield "SCRIPTED ANSWER: "
            yield URL if URL in prompt else "repository only"
    monkeypatch.setattr(research, "prepare_repo_index", prepare)
    monkeypatch.setattr(research, "count_tokens", lambda *a, **kw: 10)
    monkeypatch.setattr(research, "repo_index_exist", lambda **kw: True)
    monkeypatch.setattr(research, "Repo", lambda **kw: SimpleNamespace(name="project"))
    monkeypatch.setattr(research, "get_model_config", lambda *a: {"model_kwargs": {}})
    monkeypatch.setattr(research.ChatStreamer, "create", lambda **kw: ScriptedStreamer())
    return prompts


@asynccontextmanager
async def mcp_fixture(monkeypatch, *, mode="json", failure=None, empty_excerpts=False):
    records = []
    original_post = aiohttp.ClientSession.post
    entered = asyncio.Event()
    release = asyncio.Event()
    async def handler(req):
        body = await req.json()
        records.append({
            "body": body, "userAgent": req.headers.get("User-Agent"),
            "authorization": req.headers.get("Authorization"),
            "transportSession": req.headers.get("Mcp-Session-Id"),
            "destination": web_search.PARALLEL_MCP_URL,
        })
        method = body["method"]
        if method == "notifications/initialized":
            return web.Response(status=202)
        if method == "initialize":
            value = {"protocolVersion": "2025-03-26", "capabilities": {}, "serverInfo": {}}
        elif method == "tools/list":
            value = {"tools": [{"name": "web_search"}, {"name": "web_fetch"}]}
        else:
            entered.set()
            if failure == "wait":
                await release.wait()
            if failure == "quota":
                return web.json_response({"error": "anonymous quota exceeded"}, status=429)
            if failure == "malformed":
                return web.Response(text="not JSON", content_type="application/json")
            if failure == "oversize":
                return web.Response(text="x" * (web_search.MAX_RESPONSE_BYTES + 1))
            if failure == "rpc":
                return web.json_response({"jsonrpc": "2.0", "id": body["id"], "error": {"code": -1}})
            if failure == "tool":
                value = {"isError": True, "content": [{"type": "text", "text": "unavailable"}]}
            else:
                is_fetch = body["params"]["name"] == "web_fetch"
                excerpt = "FETCHED DOCUMENTATION" if is_fetch else "CURRENT DOCUMENTATION"
                payload = {"results": [{
                    "url": URL, "title": "Asyncio <reference>",
                    "excerpts": [] if empty_excerpts and not is_fetch else [excerpt],
                }]}
                if failure == "large_context":
                    payload = {"results": [
                        {"url": URL + "?first=1&second=2", "title": "Documentation",
                         "excerpts": ["x" * 10000]} for _ in range(10)
                    ]}
                if failure == "unsafe":
                    payload = {"results": [
                        {"url": u, "excerpts": ["UNSAFE"]} for u in [
                            "file:///etc/passwd", "javascript:alert(1)", "http://127.0.0.1/a",
                            "https://user:pass@example.com/a", "http://localhost/a",
                            "http://192.168.0.1/a", "https://example.com:bad/a",
                        ]
                    ]}
                if mode == "text":
                    value = {"content": [{"type": "text", "text": json.dumps(payload)}]}
                else:
                    value = {"structuredContent": payload, "content": []}
        message = {"jsonrpc": "2.0", "id": body["id"], "result": value}
        if failure == "wrong_id" and method == "tools/call":
            message["id"] = 900
        headers = {"Mcp-Session-Id": "fixture-transport"} if method == "initialize" else {}
        if mode == "sse":
            data = 'data: {"jsonrpc":"2.0","method":"notifications/ping"}\n\n'
            data += "event: message\ndata: " + json.dumps(message) + "\n\n"
            return web.Response(text=data, content_type="text/event-stream", headers=headers)
        return web.json_response(message, headers=headers)

    app = web.Application()
    app.router.add_post("/mcp", handler)
    runner = web.AppRunner(app, shutdown_timeout=0.1)
    await runner.setup()
    site = web.TCPSite(runner, "127.0.0.1", 0)
    await site.start()
    local_url = f"http://127.0.0.1:{site._server.sockets[0].getsockname()[1]}/mcp"
    def route(self, url, **kwargs):
        assert url == "https://search.parallel.ai/mcp"
        assert kwargs["allow_redirects"] is False
        return original_post(self, local_url, **kwargs)
    monkeypatch.setattr(aiohttp.ClientSession, "post", route)
    try:
        yield SimpleNamespace(records=records, entered=entered, release=release)
    finally:
        monkeypatch.setattr(aiohttp.ClientSession, "post", original_post)
        release.set()
        await runner.cleanup()


async def stream(req):
    return "".join([chunk async for chunk in await research.research_chat(req)])


@pytest.mark.parametrize("mode", ["json", "sse", "text"])
def test_real_http_request_to_prompt_and_stream(monkeypatch, runtime, mode):
    async def run():
        async with mcp_fixture(monkeypatch, mode=mode, empty_excerpts=True) as fixture:
            req = request(token="PAT-NOT-FOR-SEARCH")
            app = FastAPI()
            app.include_router(router)
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app), base_url="http://deepwiki.test"
            ) as client:
                response = await client.post(
                    "/chat/completions/stream", json=req.model_dump(mode="json")
                )
            assert response.status_code == 200
            assert URL in response.text
            assert "REPOSITORY_CODE" in runtime[-1]
            assert "FETCHED DOCUMENTATION" in runtime[-1]
            assert "Asyncio &lt;reference&gt;" in runtime[-1]
            assert "<external_documentation>" in runtime[-1]
            assert "Untrusted supporting documentation" in runtime[-1]
            calls = [r for r in fixture.records if r["body"]["method"] == "tools/call"]
            assert [r["body"]["params"]["name"] for r in calls] == ["web_search", "web_fetch"]
            assert {r["body"]["params"]["arguments"]["session_id"] for r in calls} == {
                str(req.search_session_id)
            }
            for row in fixture.records:
                assert row["userAgent"] == "deepwiki-open/1.0.0"
                assert row["authorization"] is None
                assert row["destination"] == "https://search.parallel.ai/mcp"
            assert "PAT-NOT-FOR-SEARCH" not in json.dumps(fixture.records)
            assert "REPOSITORY_CODE" not in json.dumps(fixture.records)
            assert calls[0]["transportSession"] == "fixture-transport"
            if path := os.environ.get("DEEPWIKI_CALLER_RECORDS"):
                Path(path).write_text(json.dumps({
                    "requestObserved": True, "records": fixture.records,
                    "contextConsumed": "FETCHED DOCUMENTATION" in runtime[-1],
                    "streamConsumed": URL in response.text,
                    "model": "scripted fixture, not live model inference",
                }, indent=2) + "\n")
    asyncio.run(run())


@pytest.mark.parametrize("setting", ["normal", "request_disabled", "saved_disabled", "permission"])
def test_disabled_and_normal_requests_never_connect(monkeypatch, runtime, setting):
    async def run():
        req = request()
        if setting == "normal":
            req.messages[-1].mode = "normal"
        elif setting == "request_disabled":
            req.search_provider = "disabled"
        elif setting == "saved_disabled":
            monkeypatch.setenv("DEEPWIKI_SEARCH_PROVIDER", "disabled")
        else:
            req.search_provider = "parallel"
            monkeypatch.setenv("DEEPWIKI_WEB_SEARCH_ALLOWED", "false")
        async with mcp_fixture(monkeypatch) as fixture:
            result = await stream(req)
            assert result.endswith("repository only")
            assert fixture.records == []
            assert "REPOSITORY_CODE" in runtime[-1]
    asyncio.run(run())


def test_explicit_provider_and_configured_key_are_respected(monkeypatch, runtime):
    async def run():
        monkeypatch.setenv("DEEPWIKI_SEARCH_PROVIDER", "disabled")
        monkeypatch.setenv("PARALLEL_API_KEY", "fixture-key")
        async with mcp_fixture(monkeypatch) as fixture:
            assert URL in await stream(request(search_provider="parallel"))
            assert all(r["authorization"] == "Bearer fixture-key" for r in fixture.records)
            assert not any(r["body"].get("params", {}).get("name") == "web_fetch"
                           for r in fixture.records)
    asyncio.run(run())


@pytest.mark.parametrize("failure", ["quota", "malformed", "oversize", "rpc", "tool", "wrong_id"])
def test_failures_are_visible_and_do_not_change_provider(monkeypatch, runtime, failure):
    async def run():
        req = request(search_provider="parallel")
        async with mcp_fixture(monkeypatch, failure=failure) as fixture:
            text = await stream(req)
            assert text.startswith("Web documentation unavailable")
            assert text.endswith("repository only")
            assert len([r for r in fixture.records if r["body"]["method"] == "tools/call"]) == 1
    asyncio.run(run())


def test_timeout_and_cancellation_through_runtime(monkeypatch, runtime):
    async def run():
        monkeypatch.setattr(web_search, "SEARCH_TIMEOUT_SECONDS", 0.03)
        async with mcp_fixture(monkeypatch, failure="wait") as fixture:
            assert (await stream(request())).startswith("Web documentation timed out")
            fixture.release.set()
        monkeypatch.setattr(web_search, "SEARCH_TIMEOUT_SECONDS", 5)
        async with mcp_fixture(monkeypatch, failure="wait") as fixture:
            task = asyncio.create_task(stream(request()))
            await fixture.entered.wait()
            task.cancel()
            with pytest.raises(asyncio.CancelledError):
                await task
    asyncio.run(run())


def test_identity_followups_concurrency_reset_and_quota_retry(monkeypatch, runtime):
    async def run():
        first, second, reset = request(), request(), request()
        assert len({first.search_session_id, second.search_session_id, reset.search_session_id}) == 3
        async with mcp_fixture(monkeypatch, empty_excerpts=True) as fixture:
            await asyncio.gather(stream(first), stream(second))
            await stream(first.model_copy(update={"research_iteration": 2}))
            calls = [r["body"]["params"] for r in fixture.records if r["body"]["method"] == "tools/call"]
            by_id = {}
            for call in calls:
                by_id.setdefault(call["arguments"]["session_id"], []).append(call["name"])
            assert by_id[str(first.search_session_id)] == [
                "web_search", "web_fetch", "web_search", "web_fetch"
            ]
            assert by_id[str(second.search_session_id)] == ["web_search", "web_fetch"]
        async with mcp_fixture(monkeypatch, failure="quota") as fixture:
            await stream(first)
            await stream(first)
            assert {r["body"]["params"]["arguments"]["session_id"] for r in fixture.records
                    if r["body"]["method"] == "tools/call"} == {str(first.search_session_id)}
    asyncio.run(run())


def test_invalid_urls_are_not_fetched_or_included(monkeypatch, runtime):
    async def run():
        async with mcp_fixture(monkeypatch, failure="unsafe") as fixture:
            text = await stream(request())
            assert text.startswith("No supporting web documentation found.")
            assert "UNSAFE" not in runtime[-1]
            assert len([r for r in fixture.records if r["body"]["method"] == "tools/call"]) == 1
    asyncio.run(run())


def test_unknown_saved_provider_is_visible(monkeypatch, runtime):
    async def run():
        monkeypatch.setenv("DEEPWIKI_SEARCH_PROVIDER", "missing")
        async with mcp_fixture(monkeypatch) as fixture:
            assert (await stream(request())).startswith(
                "Web documentation unavailable: unsupported search provider."
            )
            assert fixture.records == []
    asyncio.run(run())


def test_websocket_entrypoint_consumes_documentation(monkeypatch, runtime):
    from fastapi.testclient import TestClient
    from starlette.websockets import WebSocketDisconnect
    async def run():
        app = FastAPI()
        app.include_router(router)
        async with mcp_fixture(monkeypatch):
            def connect():
                chunks = []
                with TestClient(app) as client:
                    with client.websocket_connect("/ws/chat") as websocket:
                        websocket.send_json(request(token="PAT-NOT-FOR-SEARCH").model_dump(mode="json"))
                        try:
                            while True:
                                chunks.append(websocket.receive_text())
                        except WebSocketDisconnect:
                            pass
                return "".join(chunks)
            result = await asyncio.to_thread(connect)
            assert URL in result
            assert "CURRENT DOCUMENTATION" in runtime[-1]
    asyncio.run(run())


def test_schema_rejects_invalid_choices_and_identity(monkeypatch, runtime):
    async def run():
        app = FastAPI()
        app.include_router(router)
        async with mcp_fixture(monkeypatch) as fixture:
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app), base_url="http://deepwiki.test"
            ) as client:
                for field, value in [("search_provider", "other"), ("search_session_id", "personal-name")]:
                    body = request().model_dump(mode="json")
                    body[field] = value
                    assert (await client.post("/chat/completions/stream", json=body)).status_code == 422
            assert fixture.records == []
    asyncio.run(run())


def test_query_and_external_context_are_bounded(monkeypatch, runtime):
    async def run():
        async with mcp_fixture(monkeypatch, failure="large_context") as fixture:
            await stream(request(messages=[
                {"role": "user", "content": "dependency " * 100, "mode": "deep_research"}
            ]))
            call = next(r["body"]["params"] for r in fixture.records
                        if r["body"]["method"] == "tools/call")
            assert len(call["arguments"]["search_queries"][0]) <= 523
            external = runtime[-1].split("<external_documentation>")[1].split("</external_documentation>")[0]
            assert len(external) <= web_search.MAX_CONTEXT_CHARS + 350
            assert "?first=1&second=2" in external
    asyncio.run(run())
