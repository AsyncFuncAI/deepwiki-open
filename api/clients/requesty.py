"""Requesty ModelClient integration."""

import os
from typing import Any, Dict, Literal, Optional

from adalflow.components.model_client.openai_client import OpenAIClient
from adalflow.core.types import ModelType
from openai import AsyncOpenAI, OpenAI

REQUESTY_DEFAULT_HEADERS = {
    "HTTP-Referer": "https://github.com/AsyncFuncAI/deepwiki-open",
    "X-Title": "DeepWiki",
}


class RequestyClient(OpenAIClient):
    """
    Requesty OpenAI-compatible client.

    Requesty is an LLM gateway that gives access to hundreds of models from
    many providers through a single OpenAI-compatible endpoint, so we can
    reuse almost all OpenAIClient behavior while overriding only the client
    initialization.

    Visit https://docs.requesty.ai for more details.

    Expected environment variables:

    REQUESTY_API_KEY=your_requesty_api_key
    REQUESTY_BASE_URL=https://router.requesty.ai/v1  (optional, use https://router.eu.requesty.ai/v1 for EU)

    Example model names:
        openai/gpt-4o-mini
        anthropic/claude-sonnet-4-5
        google/gemini-2.5-flash
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        input_type: Literal["text", "messages"] = "text",
        base_url: Optional[str] = None,
        env_api_key_name: str = "REQUESTY_API_KEY",
    ):
        resolved_base_url = base_url or os.getenv(
            "REQUESTY_BASE_URL", "https://router.requesty.ai/v1"
        )
        super().__init__(
            api_key=api_key,
            input_type=input_type,
            base_url=resolved_base_url,
            env_api_key_name=env_api_key_name,
        )

    def _resolve_api_key(self) -> str:
        api_key = self._api_key or os.getenv(self._env_api_key_name)
        if not api_key:
            raise ValueError(
                f"Environment variable {self._env_api_key_name} must be set"
            )
        return api_key

    def init_sync_client(self):
        """Initialize synchronous Requesty client."""
        return OpenAI(
            api_key=self._resolve_api_key(),
            base_url=self.base_url,
            default_headers=REQUESTY_DEFAULT_HEADERS,
        )

    def init_async_client(self):
        """Initialize asynchronous Requesty client."""
        return AsyncOpenAI(
            api_key=self._resolve_api_key(),
            base_url=self.base_url,
            default_headers=REQUESTY_DEFAULT_HEADERS,
        )

    def convert_inputs_to_api_kwargs(
        self,
        input: Optional[Any] = None,
        model_kwargs: Optional[Dict] = None,
        model_type: ModelType = ModelType.UNDEFINED,
    ) -> Dict:
        """Send a plain text prompt as a user message, like the OpenRouter client.

        OpenAIClient sends a plain text prompt as a single system message, which
        Anthropic and Gemini models reject.
        """
        api_kwargs = super().convert_inputs_to_api_kwargs(
            input=input, model_kwargs=model_kwargs or {}, model_type=model_type
        )
        messages = api_kwargs.get("messages")
        if (
            model_type == ModelType.LLM
            and messages
            and len(messages) == 1
            and messages[0].get("role") == "system"
        ):
            messages[0] = {"role": "user", "content": messages[0]["content"]}
        return api_kwargs
