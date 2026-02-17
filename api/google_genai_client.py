"""Google GenAI ModelClient integration using the google-genai package."""

import os
import logging
import backoff
from typing import Dict, Any, Optional, TypeVar

from adalflow.core.model_client import ModelClient
from adalflow.core.types import ModelType, GeneratorOutput, CompletionUsage

try:
    from google import genai
    from google.genai import types
except ImportError:
    raise ImportError("google-genai is required. Install it with 'pip install google-genai'")

log = logging.getLogger(__name__)
T = TypeVar("T")

# Module-level client cache so genai.Client is never stored on the instance
# (avoids pickle errors from _thread.lock objects inside httpx)
_genai_clients: Dict[str, genai.Client] = {}


def _get_genai_client(api_key: str) -> genai.Client:
    """Get or create a cached genai.Client for the given API key."""
    if api_key not in _genai_clients:
        _genai_clients[api_key] = genai.Client(api_key=api_key)
    return _genai_clients[api_key]


class GoogleGenAIClient(ModelClient):
    """A ModelClient for Google's Generative AI using the google-genai package.

    This replaces adalflow's built-in GoogleGenAIClient which depends on the
    deprecated google-generativeai package.

    Used as the model_client for the 'google' provider in the RAG generator pipeline.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        env_api_key_name: str = "GOOGLE_API_KEY",
    ):
        super().__init__()
        self._env_api_key_name = env_api_key_name
        self._resolved_api_key = api_key or os.getenv(env_api_key_name)
        if not self._resolved_api_key:
            raise ValueError(
                f"Environment variable {env_api_key_name} must be set"
            )

    @property
    def _client(self) -> genai.Client:
        """Lazily get the genai.Client from the module-level cache."""
        return _get_genai_client(self._resolved_api_key)

    def parse_chat_completion(self, response) -> GeneratorOutput:
        """Parse a non-streaming GenerateContentResponse into GeneratorOutput."""
        try:
            text = response.text if hasattr(response, 'text') else str(response)
            usage = None
            if hasattr(response, 'usage_metadata'):
                um = response.usage_metadata
                usage = CompletionUsage(
                    prompt_tokens=getattr(um, 'prompt_token_count', None),
                    completion_tokens=getattr(um, 'candidates_token_count', None),
                    total_tokens=getattr(um, 'total_token_count', None),
                )
            return GeneratorOutput(
                data=None,
                error=None,
                raw_response=text,
                usage=usage,
            )
        except Exception as e:
            log.error(f"Error parsing Google GenAI response: {e}")
            return GeneratorOutput(data=None, error=str(e), raw_response=str(response))

    def convert_inputs_to_api_kwargs(
        self,
        input: Optional[Any] = None,
        model_kwargs: Dict = {},
        model_type: ModelType = ModelType.UNDEFINED,
    ) -> Dict:
        if model_type == ModelType.LLM:
            final_kwargs = model_kwargs.copy()
            final_kwargs["contents"] = input
            return final_kwargs
        else:
            raise ValueError(f"GoogleGenAIClient only supports LLM model type, got {model_type}")

    @backoff.on_exception(
        backoff.expo,
        (Exception,),
        max_time=5,
    )
    def call(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        if model_type != ModelType.LLM:
            raise ValueError(f"GoogleGenAIClient only supports LLM model type, got {model_type}")

        model = api_kwargs.get("model", "gemini-2.5-flash")
        contents = api_kwargs.get("contents", "")

        # Build config from remaining kwargs
        config_kwargs = {}
        for key in ["temperature", "top_p", "top_k", "max_output_tokens"]:
            if key in api_kwargs:
                config_kwargs[key] = api_kwargs[key]

        call_kwargs = {
            "model": model,
            "contents": contents,
        }
        if config_kwargs:
            call_kwargs["config"] = types.GenerateContentConfig(**config_kwargs)

        response = self._client.models.generate_content(**call_kwargs)
        return response

    async def acall(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        """Async call - falls back to synchronous since google-genai sync client is used."""
        return self.call(api_kwargs, model_type)
