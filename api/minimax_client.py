"""MiniMax ModelClient integration.

MiniMax provides OpenAI-compatible API endpoints for chat completions.
This client extends OpenAIClient with MiniMax-specific defaults.

API Documentation:
    - OpenAI Compatible: https://platform.minimax.io/docs/api-reference/text-openai-api

Supported models:
    - MiniMax-M2.7: Latest flagship model with enhanced reasoning (204K context)
    - MiniMax-M2.5: Peak Performance. Ultimate Value. Master the Complex (204K context)
    - MiniMax-M2.5-highspeed: Same performance, faster and more agile (204K context)
"""

import os
import logging
from typing import Dict, Optional, Any, Callable, Literal

from openai.types import Completion
from adalflow.core.types import ModelType

from api.openai_client import OpenAIClient

log = logging.getLogger(__name__)


class MiniMaxClient(OpenAIClient):
    """A component wrapper for the MiniMax API client.

    MiniMax provides an OpenAI-compatible API, so this client extends OpenAIClient
    with MiniMax-specific defaults for base URL and API key environment variable.

    Key constraints:
        - temperature: must be in (0.0, 1.0], cannot be 0. Default is 1.0.
        - response_format: not supported, use prompt engineering instead.

    Args:
        api_key (Optional[str]): MiniMax API key. Defaults to None (reads from env).
        base_url (Optional[str]): API base URL. Defaults to "https://api.minimax.io/v1".
        env_api_key_name (str): Env var name for API key. Defaults to "MINIMAX_API_KEY".
        env_base_url_name (str): Env var name for base URL. Defaults to "MINIMAX_BASE_URL".

    References:
        - MiniMax Platform: https://platform.minimax.io
        - API Reference: https://platform.minimax.io/docs/api-reference/text-openai-api
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        chat_completion_parser: Callable[[Completion], Any] = None,
        input_type: Literal["text", "messages"] = "text",
        base_url: Optional[str] = None,
        env_base_url_name: str = "MINIMAX_BASE_URL",
        env_api_key_name: str = "MINIMAX_API_KEY",
    ):
        super().__init__(
            api_key=api_key,
            chat_completion_parser=chat_completion_parser,
            input_type=input_type,
            base_url=base_url or os.getenv(env_base_url_name, "https://api.minimax.io/v1"),
            env_base_url_name=env_base_url_name,
            env_api_key_name=env_api_key_name,
        )

    def convert_inputs_to_api_kwargs(
        self,
        input: Optional[Any] = None,
        model_kwargs: Dict = {},
        model_type: ModelType = ModelType.UNDEFINED,
    ) -> Dict:
        """Convert inputs to API kwargs with MiniMax-specific adjustments.

        Clamps temperature to (0.0, 1.0] range and removes unsupported
        response_format parameter.
        """
        final_kwargs = super().convert_inputs_to_api_kwargs(input, model_kwargs, model_type)

        if model_type == ModelType.LLM:
            # Clamp temperature: MiniMax requires (0.0, 1.0], cannot be 0
            temp = final_kwargs.get("temperature")
            if temp is not None:
                if temp <= 0:
                    final_kwargs["temperature"] = 0.01
                    log.debug("Clamped temperature from %s to 0.01 (MiniMax minimum)", temp)
                elif temp > 1.0:
                    final_kwargs["temperature"] = 1.0
                    log.debug("Clamped temperature from %s to 1.0 (MiniMax maximum)", temp)

            # Remove response_format if present (not supported by MiniMax)
            if "response_format" in final_kwargs:
                final_kwargs.pop("response_format")
                log.debug("Removed unsupported response_format parameter for MiniMax")

        return final_kwargs
