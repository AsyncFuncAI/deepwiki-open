"""Vertex AI ModelClient integration for LLM and Embeddings using the google-genai package."""

import os
import logging
import backoff
from typing import Dict, Any, Optional, TypeVar, Tuple, Sequence

from adalflow.core.model_client import ModelClient
from adalflow.core.types import ModelType, GeneratorOutput, CompletionUsage, EmbedderOutput

try:
    from google import genai
    from google.genai import types
except ImportError:
    raise ImportError("google-genai is required. Install it with 'pip install google-genai'")

log = logging.getLogger(__name__)
T = TypeVar("T")

# Module-level client cache keyed by (project, location) to avoid pickle errors
_vertex_clients: Dict[Tuple[str, str], genai.Client] = {}


def _get_vertex_client(project: str, location: str) -> genai.Client:
    """Get or create a cached Vertex AI genai.Client for the given project/location."""
    key = (project, location)
    if key not in _vertex_clients:
        _vertex_clients[key] = genai.Client(
            vertexai=True,
            project=project,
            location=location,
            http_options=types.HttpOptions(api_version="v1"),
        )
    return _vertex_clients[key]


class VertexAIClient(ModelClient):
    """A ModelClient for Google's Generative AI via Vertex AI.

    Uses Application Default Credentials (ADC) instead of an API key.
    Requires GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION environment variables.
    """

    def __init__(
        self,
        project: Optional[str] = None,
        location: Optional[str] = None,
    ):
        super().__init__()
        self._project = project or os.getenv("GOOGLE_CLOUD_PROJECT")
        self._location = location or os.getenv("GOOGLE_CLOUD_LOCATION")
        if not self._project or not self._location:
            raise ValueError(
                "GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION environment variables must be set"
            )

    @property
    def _client(self) -> genai.Client:
        """Lazily get the genai.Client from the module-level cache."""
        return _get_vertex_client(self._project, self._location)

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
            log.error(f"Error parsing Vertex AI response: {e}")
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
            raise ValueError(f"VertexAIClient only supports LLM model type, got {model_type}")

    @backoff.on_exception(
        backoff.expo,
        (Exception,),
        max_time=5,
    )
    def call(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        if model_type != ModelType.LLM:
            raise ValueError(f"VertexAIClient only supports LLM model type, got {model_type}")

        model = api_kwargs.get("model", "gemini-2.5-flash")
        contents = api_kwargs.get("contents", "")

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


class VertexEmbedderClient(ModelClient):
    """A ModelClient for Google's Embedding API via Vertex AI.

    Uses Application Default Credentials (ADC) instead of an API key.
    Requires GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION environment variables.
    """

    def __init__(
        self,
        project: Optional[str] = None,
        location: Optional[str] = None,
    ):
        super().__init__()
        self._project = project or os.getenv("GOOGLE_CLOUD_PROJECT")
        self._location = location or os.getenv("GOOGLE_CLOUD_LOCATION")
        if not self._project or not self._location:
            raise ValueError(
                "GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION environment variables must be set"
            )

    @property
    def _client(self) -> genai.Client:
        """Lazily get the genai.Client from the module-level cache."""
        return _get_vertex_client(self._project, self._location)

    def parse_embedding_response(self, response) -> EmbedderOutput:
        """Parse Vertex AI embedding response to EmbedderOutput format."""
        try:
            from adalflow.core.types import Embedding

            embedding_data = []

            if hasattr(response, 'embeddings'):
                embeddings = response.embeddings
                for i, emb in enumerate(embeddings):
                    if hasattr(emb, 'values'):
                        embedding_data.append(Embedding(embedding=list(emb.values), index=i))
                    elif isinstance(emb, list):
                        embedding_data.append(Embedding(embedding=list(emb), index=i))
            else:
                log.warning("Unexpected embedding response type/structure: %s", type(response))
                embedding_data = []

            if embedding_data:
                first_dim = len(embedding_data[0].embedding) if embedding_data[0].embedding is not None else 0
                log.info("Parsed %s embedding(s) (dim=%s)", len(embedding_data), first_dim)

            return EmbedderOutput(
                data=embedding_data,
                error=None,
                raw_response=None
            )
        except Exception as e:
            log.error(f"Error parsing Vertex AI embedding response: {e}")
            return EmbedderOutput(
                data=[],
                error=str(e),
                raw_response=None
            )

    def convert_inputs_to_api_kwargs(
        self,
        input: Optional[Any] = None,
        model_kwargs: Dict = {},
        model_type: ModelType = ModelType.UNDEFINED,
    ) -> Dict:
        if model_type != ModelType.EMBEDDER:
            raise ValueError(f"VertexEmbedderClient only supports EMBEDDER model type, got {model_type}")

        if isinstance(input, str):
            contents = [input]
        elif isinstance(input, Sequence):
            contents = list(input)
        else:
            raise TypeError("input must be a string or sequence of strings")

        final_model_kwargs = model_kwargs.copy()
        final_model_kwargs["contents"] = contents

        if "task_type" not in final_model_kwargs:
            final_model_kwargs["task_type"] = "SEMANTIC_SIMILARITY"

        if "model" not in final_model_kwargs:
            final_model_kwargs["model"] = "gemini-embedding-001"

        return final_model_kwargs

    @backoff.on_exception(
        backoff.expo,
        (Exception,),
        max_time=5,
    )
    def call(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        if model_type != ModelType.EMBEDDER:
            raise ValueError(f"VertexEmbedderClient only supports EMBEDDER model type")

        safe_log_kwargs = {k: v for k, v in api_kwargs.items() if k not in {"content", "contents"}}
        if "contents" in api_kwargs:
            try:
                contents = api_kwargs.get("contents")
                safe_log_kwargs["contents_count"] = len(contents) if hasattr(contents, "__len__") else None
            except Exception:
                safe_log_kwargs["contents_count"] = None
        log.info("Vertex AI Embeddings call kwargs (sanitized): %s", safe_log_kwargs)

        try:
            call_kwargs = {}
            call_kwargs["model"] = api_kwargs.get("model", "gemini-embedding-001")
            call_kwargs["contents"] = api_kwargs["contents"]

            config = {}
            if "task_type" in api_kwargs:
                config["task_type"] = api_kwargs["task_type"]
            if config:
                call_kwargs["config"] = types.EmbedContentConfig(**config)

            response = self._client.models.embed_content(**call_kwargs)
            return response

        except Exception as e:
            log.error(f"Error calling Vertex AI Embeddings API: {e}")
            raise

    async def acall(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        """Async call - falls back to synchronous."""
        return self.call(api_kwargs, model_type)
