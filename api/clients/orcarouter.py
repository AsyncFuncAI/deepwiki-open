"""OrcaRouter OpenAI-compatible client."""

import os
from typing import Literal, Optional

from adalflow.components.model_client.openai_client import OpenAIClient
from openai import AsyncOpenAI, OpenAI


class OrcaRouterClient(OpenAIClient):
    """
    OrcaRouter OpenAI-compatible client.

    OrcaRouter is an OpenAI-compatible routing gateway that fronts multiple
    upstream providers behind namespaced model ids (e.g. ``openai/gpt-5.5``).
    It exposes an OpenAI-compatible API surface, so we can reuse almost all
    OpenAIClient behavior while overriding only the client initialization.

    Expected environment variables:

    ORCAROUTER_API_KEY=sk-orca-...

    Example model names:
        openai/gpt-5.5
        openai/gpt-4o
        anthropic/claude-sonnet-4.5
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        input_type: Literal["text", "messages"] = "text",
        base_url: Optional[str] = None,
        env_api_key_name: str = "ORCAROUTER_API_KEY",
    ):
        resolved_base_url = base_url or os.getenv(
            "ORCAROUTER_BASE_URL", "https://api.orcarouter.ai/v1"
        )
        if not resolved_base_url.endswith("/v1"):
            resolved_base_url = f"{resolved_base_url.rstrip('/')}/v1"
        super().__init__(
            api_key=api_key,
            input_type=input_type,
            base_url=resolved_base_url,
            env_api_key_name=env_api_key_name,
        )

    def init_sync_client(self):
        """Initialize synchronous OrcaRouter OpenAI-compatible client."""
        api_key = self._api_key or os.getenv(self._env_api_key_name, "dummy")
        return OpenAI(
            api_key=api_key,
            base_url=self.base_url,
        )

    def init_async_client(self):
        """Initialize asynchronous OrcaRouter OpenAI-compatible client."""
        api_key = self._api_key or os.getenv(self._env_api_key_name, "dummy")
        return AsyncOpenAI(
            api_key=api_key,
            base_url=self.base_url,
        )
