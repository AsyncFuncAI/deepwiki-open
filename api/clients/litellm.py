import os
from typing import Callable, Optional

from adalflow.components.model_client.openai_client import OpenAIClient
from openai import AsyncOpenAI, OpenAI


class LiteLLMClient(OpenAIClient):
    """
    LiteLLM OpenAI-compatible client.

    LiteLLM exposes an OpenAI-compatible API surface, so we can
    reuse almost all OpenAIClient behavior while overriding only
    the client initialization.

    Expected environment variables:

    LITELLM_BASE_URL=http://litellm:4000
    LITELLM_API_KEY=sk-1234

    Example model names:
        openai/gpt-4o
        anthropic/claude-3-5-sonnet
        gemini/gemini-2.5-pro
        ollama/llama3
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        chat_completion_parser: Optional[Callable] = None,
        input_type: str = "text",
        base_url: Optional[str] = None,
        env_base_url_name: str = "LITELLM_BASE_URL",
        env_api_key_name: str = "LITELLM_API_KEY",
    ):
        resolved_base_url = base_url or os.getenv(
            env_base_url_name, "http://localhost:4000"
        )
        if not resolved_base_url.endswith("/v1"):
            resolved_base_url = f"{resolved_base_url.rstrip('/')}/v1"
        super().__init__(
            api_key=api_key,
            chat_completion_parser=chat_completion_parser,
            input_type=input_type,
            base_url=resolved_base_url,
            env_base_url_name=env_base_url_name,
            env_api_key_name=env_api_key_name,
        )

    def init_sync_client(self):
        """
        Initialize synchronous LiteLLM OpenAI-compatible client.
        """
        api_key = self._api_key or os.getenv(self._env_api_key_name, "dummy")
        return OpenAI(
            api_key=api_key,
            base_url=self.base_url,
        )

    def init_async_client(self):
        """
        Initialize asynchronous LiteLLM OpenAI-compatible client.
        """
        api_key = self._api_key or os.getenv(self._env_api_key_name, "dummy")
        return AsyncOpenAI(
            api_key=api_key,
            base_url=self.base_url,
        )
