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
