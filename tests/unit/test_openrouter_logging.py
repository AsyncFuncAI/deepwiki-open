"""Regression: OpenRouterClient must not log full request/response payloads.

Before this fix, api/clients/openrouter.py logged the entire api_kwargs
(including repository source embedded in the prompt) and the entire
provider response at INFO, which the application's default logging
config persists to a rotating file on disk by default.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest
from adalflow.core.types import ModelType

from api.clients.openrouter import OpenRouterClient

SECRET_PROMPT = "FAKE-POC-REPO-SECRET: aws_key=AKIA1234567890"
SECRET_RESPONSE = "FAKE-POC-MODEL-OUTPUT: do not log me either"


class _FakeResponse:
    status = 200

    async def json(self):
        return {
            "choices": [{"message": {"content": SECRET_RESPONSE}}],
            "usage": {"prompt_tokens": 42, "completion_tokens": 7},
        }

    async def text(self):
        return ""


class _FakePostCtx:
    async def __aenter__(self):
        return _FakeResponse()

    async def __aexit__(self, *exc):
        return False


class _FakeSession:
    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    def post(self, *args, **kwargs):
        return _FakePostCtx()


@pytest.mark.asyncio
async def test_acall_does_not_log_prompt_or_response_content(monkeypatch, caplog):
    client = OpenRouterClient()
    client.async_client = {"api_key": "test-key", "base_url": "https://openrouter.ai/api/v1"}

    monkeypatch.setattr(
        "api.clients.openrouter.aiohttp.ClientSession", lambda: _FakeSession()
    )

    api_kwargs = {
        "model": "openai/gpt-4o",
        "messages": [{"role": "user", "content": SECRET_PROMPT}],
    }

    with caplog.at_level("INFO"):
        await client.acall(api_kwargs=api_kwargs, model_type=ModelType.LLM)

    logged_text = "\n".join(r.getMessage() for r in caplog.records)
    assert SECRET_PROMPT not in logged_text
    assert SECRET_RESPONSE not in logged_text
    # The metadata-only replacement lines must still carry useful sizing info.
    assert "messages=1" in logged_text
    assert "prompt_tokens=42" in logged_text
