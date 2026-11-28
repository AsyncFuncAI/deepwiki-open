from types import SimpleNamespace

import pytest

from api.schemas import ChatCompletionRequest, ChatMessage
from api.services import research

pytestmark = pytest.mark.asyncio


class _CapturingStreamer:
    provider = "stub"
    error_hint = None

    def __init__(self):
        self.prompts = []

    async def respond_stream(self, prompt):
        self.prompts.append(prompt)
        yield "ok"


@pytest.fixture
def streamer(monkeypatch):
    """Run the real RAG class and block only its network and disk boundaries."""

    async def _prepare_retriever(self, *args, **kwargs):
        return None

    async def _retrieve(self, *args, **kwargs):
        return []

    capturing = _CapturingStreamer()
    monkeypatch.setattr(research, "_RAG_CACHE", {})
    monkeypatch.setattr("api.config.get_embedder_type", lambda: "openai")
    monkeypatch.setattr("api.rag.rag.get_embedder", lambda **kwargs: object())
    monkeypatch.setattr(research.RAG, "aprepare_retriever", _prepare_retriever)
    monkeypatch.setattr(research.RAG, "acall", _retrieve)
    monkeypatch.setattr(research, "Repo", lambda **kwargs: SimpleNamespace(name="r"))
    monkeypatch.setattr(research, "repo_index_exist", lambda repo: True)
    monkeypatch.setattr(research, "count_tokens", lambda *args, **kwargs: 1)
    monkeypatch.setattr(
        research, "get_model_config", lambda *args: {"model_kwargs": {}}
    )
    monkeypatch.setattr(research.ChatStreamer, "create", lambda **kwargs: capturing)
    return capturing


async def _send(streamer, *contents):
    """Send alternating user and assistant messages; return the captured prompt."""
    request = ChatCompletionRequest(
        repo_url="https://github.com/o/r",
        messages=[
            ChatMessage(role="assistant" if i % 2 else "user", content=content)
            for i, content in enumerate(contents)
        ],
    )
    async for _ in await research.research_chat(request):
        pass
    return streamer.prompts[-1]


async def test_request_without_history_ignores_earlier_request(streamer):
    await _send(streamer, "question A", "answer A", "follow-up A")

    prompt = await _send(streamer, "question B")

    assert len(research._RAG_CACHE) == 1  # both requests shared one RAG object
    assert "question A" not in prompt
    assert "answer A" not in prompt
    assert "<conversation_history>" not in prompt


async def test_resending_a_conversation_does_not_duplicate_turns(streamer):
    await _send(streamer, "question A", "answer A", "follow-up A")

    prompt = await _send(streamer, "question A", "answer A", "follow-up A")

    assert prompt.count("<user>question A</user>") == 1
    assert prompt.count("<assistant>answer A</assistant>") == 1


async def test_prompt_keeps_own_turns_in_order_and_excludes_last_question(streamer):
    prompt = await _send(streamer, "Q1", "A1", "Q2", "A2", "Q3")

    assert (
        "<conversation_history>\n"
        "<turn>\n<user>Q1</user>\n<assistant>A1</assistant>\n</turn>\n"
        "<turn>\n<user>Q2</user>\n<assistant>A2</assistant>\n</turn>\n"
        "</conversation_history>"
    ) in prompt
    assert "<user>Q3</user>" not in prompt
    assert "<query>\nQ3\n</query>" in prompt


class _FailingStreamer:
    provider = "stub"
    error_hint = "Check the stub API key."

    async def respond_stream(self, prompt):
        raise RuntimeError("429 rate limit")
        yield  # pragma: no cover - makes this an async generator


def _request():
    return ChatCompletionRequest(
        repo_url="https://github.com/o/r",
        messages=[ChatMessage(role="user", content="question")],
    )


async def test_provider_error_is_streamed_as_text_for_chat(streamer, monkeypatch):
    monkeypatch.setattr(
        research.ChatStreamer, "create", lambda **kwargs: _FailingStreamer()
    )

    text = "".join([c async for c in await research.research_chat(_request())])

    assert "Error with stub API: 429 rate limit" in text
    assert "Check the stub API key." in text


async def test_provider_error_is_raised_when_asked(streamer, monkeypatch):
    monkeypatch.setattr(
        research.ChatStreamer, "create", lambda **kwargs: _FailingStreamer()
    )

    with pytest.raises(RuntimeError, match="429 rate limit"):
        async for _ in await research.research_chat(_request(), raise_errors=True):
            pass


class _OpenRouterLikeFailingStreamer:
    provider = "openrouter"
    error_hint = "check the key"

    async def respond_stream(self, prompt):
        raise RuntimeError("OpenRouter API error (429): rate limited")
        yield


async def test_chat_still_shows_an_openrouter_error_as_text(streamer, monkeypatch):
    monkeypatch.setattr(
        research.ChatStreamer,
        "create",
        lambda **kwargs: _OpenRouterLikeFailingStreamer(),
    )
    request = ChatCompletionRequest(
        repo_url="https://github.com/o/r",
        messages=[ChatMessage(role="user", content="q")],
    )

    text = "".join([c async for c in await research.research_chat(request)])

    assert "429" in text and "check the key" in text


class _FakeResponse:
    def __init__(self, status, text="", payload=None):
        self.status = status
        self._text = text
        self._payload = payload

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def text(self):
        return self._text

    async def json(self):
        return self._payload


class _FakeSession:
    def __init__(self, response=None, error=None):
        self._response = response
        self._error = error

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    def post(self, *args, **kwargs):
        if self._error:
            raise self._error
        return self._response


async def _openrouter_chunks(monkeypatch, session):
    import aiohttp
    from adalflow.core.types import ModelType

    from api.clients import OpenRouterClient

    monkeypatch.setattr(aiohttp, "ClientSession", lambda *a, **k: session)
    client = OpenRouterClient()
    client.async_client = {"api_key": "k", "base_url": "http://x"}
    return [c async for c in await client.acall({"model": "m"}, ModelType.LLM)]


async def test_openrouter_http_error_is_raised_not_yielded(monkeypatch):
    session = _FakeSession(_FakeResponse(429, "rate limited"))
    with pytest.raises(RuntimeError, match="429"):
        await _openrouter_chunks(monkeypatch, session)


async def test_openrouter_connection_error_is_raised_not_yielded(monkeypatch):
    import aiohttp

    session = _FakeSession(error=aiohttp.ClientError("boom"))
    with pytest.raises(ConnectionError, match="boom"):
        await _openrouter_chunks(monkeypatch, session)


async def test_openrouter_empty_choices_is_raised_not_yielded(monkeypatch):
    session = _FakeSession(_FakeResponse(200, payload={"choices": []}))
    with pytest.raises(ValueError, match="No response content"):
        await _openrouter_chunks(monkeypatch, session)


async def test_openrouter_missing_key_is_raised_not_yielded(monkeypatch):
    from adalflow.core.types import ModelType

    from api.clients import OpenRouterClient

    client = OpenRouterClient()
    client.async_client = {"api_key": "", "base_url": "http://x"}
    with pytest.raises(ValueError, match="OPENROUTER_API_KEY"):
        await client.acall({}, ModelType.LLM)
