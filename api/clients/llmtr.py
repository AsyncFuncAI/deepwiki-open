import os
from typing import Literal, Optional

from adalflow.components.model_client.openai_client import OpenAIClient

DEFAULT_BASE_URL = "https://llmtr.com/v1"


class LLMTRClient(OpenAIClient):
    """
    LLMTR OpenAI-compatible client.

    LLMTR is a prepaid gateway at https://llmtr.com/v1. Model IDs use the
    vendor/model form. This client reuses OpenAIClient and only changes
    the default base URL and API key environment variable.

    Expected environment variables:

    LLMTR_API_KEY=...
    LLMTR_BASE_URL=https://llmtr.com/v1  # optional override
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        input_type: Literal["text", "messages"] = "text",
        base_url: Optional[str] = None,
        env_api_key_name: str = "LLMTR_API_KEY",
    ):
        resolved_base_url = base_url or os.getenv("LLMTR_BASE_URL", DEFAULT_BASE_URL)
        if not resolved_base_url.rstrip("/").endswith("/v1"):
            resolved_base_url = f"{resolved_base_url.rstrip('/')}/v1"
        super().__init__(
            api_key=api_key,
            input_type=input_type,
            base_url=resolved_base_url,
            env_api_key_name=env_api_key_name,
        )
