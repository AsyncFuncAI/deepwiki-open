"""Google AI Embeddings ModelClient integration."""

import os
import logging
import backoff
from typing import Dict, Any, Optional, List, Sequence

from adalflow.core.model_client import ModelClient
from adalflow.core.types import ModelType, EmbedderOutput

try:
    from google import genai
except ImportError:
    raise ImportError("google-genai is required. Install it with 'pip install google-genai'")

log = logging.getLogger(__name__)

# Module-level client cache so genai.Client is never stored on the instance
# (avoids pickle errors from _thread.lock objects inside httpx)
_genai_clients: Dict[str, genai.Client] = {}


def _get_genai_client(api_key: str) -> genai.Client:
    """Get or create a cached genai.Client for the given API key."""
    if api_key not in _genai_clients:
        _genai_clients[api_key] = genai.Client(api_key=api_key)
    return _genai_clients[api_key]


class GoogleEmbedderClient(ModelClient):
    __doc__ = r"""A component wrapper for Google AI Embeddings API client.

    This client provides access to Google's embedding models through the Google AI API.
    It supports text embeddings for various tasks including semantic similarity,
    retrieval, and classification.

    Args:
        api_key (Optional[str]): Google AI API key. Defaults to None.
            If not provided, will use the GOOGLE_API_KEY environment variable.
        env_api_key_name (str): Environment variable name for the API key.
            Defaults to "GOOGLE_API_KEY".

    Example:
        ```python
        from api.google_embedder_client import GoogleEmbedderClient
        import adalflow as adal

        client = GoogleEmbedderClient()
        embedder = adal.Embedder(
            model_client=client,
            model_kwargs={
                "model": "gemini-embedding-001",
                "task_type": "SEMANTIC_SIMILARITY"
            }
        )
        ```

    References:
        - Google AI Embeddings: https://ai.google.dev/gemini-api/docs/embeddings
        - Available models: gemini-embedding-001
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        env_api_key_name: str = "GOOGLE_API_KEY",
    ):
        """Initialize Google AI Embeddings client.

        Args:
            api_key: Google AI API key. If not provided, uses environment variable.
            env_api_key_name: Name of environment variable containing API key.
        """
        super().__init__()
        self._env_api_key_name = env_api_key_name
        # Resolve and store the API key string (picklable), but not the Client
        self._resolved_api_key = api_key or os.getenv(env_api_key_name)
        if not self._resolved_api_key:
            raise ValueError(
                f"Environment variable {env_api_key_name} must be set"
            )

    @property
    def _client(self) -> genai.Client:
        """Lazily get the genai.Client from the module-level cache."""
        return _get_genai_client(self._resolved_api_key)

    def parse_embedding_response(self, response) -> EmbedderOutput:
        """Parse Google AI embedding response to EmbedderOutput format.

        Args:
            response: Google AI embedding response (contains .embeddings list)

        Returns:
            EmbedderOutput with parsed embeddings
        """
        try:
            from adalflow.core.types import Embedding

            embedding_data = []

            # The new google-genai API returns a result with .embeddings,
            # each being a ContentEmbedding with a .values attribute
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
            log.error(f"Error parsing Google AI embedding response: {e}")
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
        """Convert inputs to Google AI API format.

        Args:
            input: Text input(s) to embed
            model_kwargs: Model parameters including model name and task_type
            model_type: Should be ModelType.EMBEDDER for this client

        Returns:
            Dict: API kwargs for Google AI embedding call
        """
        if model_type != ModelType.EMBEDDER:
            raise ValueError(f"GoogleEmbedderClient only supports EMBEDDER model type, got {model_type}")

        # Ensure input is a list
        if isinstance(input, str):
            contents = [input]
        elif isinstance(input, Sequence):
            contents = list(input)
        else:
            raise TypeError("input must be a string or sequence of strings")

        final_model_kwargs = model_kwargs.copy()

        # The new API always uses "contents" (plural)
        final_model_kwargs["contents"] = contents

        # Set default task type if not provided
        if "task_type" not in final_model_kwargs:
            final_model_kwargs["task_type"] = "SEMANTIC_SIMILARITY"

        # Set default model if not provided
        if "model" not in final_model_kwargs:
            final_model_kwargs["model"] = "gemini-embedding-001"

        return final_model_kwargs

    @backoff.on_exception(
        backoff.expo,
        (Exception,),  # Google AI may raise various exceptions
        max_time=5,
    )
    def call(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        """Call Google AI embedding API.

        Args:
            api_kwargs: API parameters
            model_type: Should be ModelType.EMBEDDER

        Returns:
            Google AI embedding response
        """
        if model_type != ModelType.EMBEDDER:
            raise ValueError(f"GoogleEmbedderClient only supports EMBEDDER model type")

        safe_log_kwargs = {k: v for k, v in api_kwargs.items() if k not in {"content", "contents"}}
        if "contents" in api_kwargs:
            try:
                contents = api_kwargs.get("contents")
                safe_log_kwargs["contents_count"] = len(contents) if hasattr(contents, "__len__") else None
            except Exception:
                safe_log_kwargs["contents_count"] = None
        log.info("Google AI Embeddings call kwargs (sanitized): %s", safe_log_kwargs)

        try:
            # Build the call kwargs
            call_kwargs = {}
            call_kwargs["model"] = api_kwargs.get("model", "gemini-embedding-001")
            call_kwargs["contents"] = api_kwargs["contents"]

            # Pass through config if present
            config = {}
            if "task_type" in api_kwargs:
                config["task_type"] = api_kwargs["task_type"]
            if config:
                from google.genai import types
                call_kwargs["config"] = types.EmbedContentConfig(**config)

            response = self._client.models.embed_content(**call_kwargs)
            return response

        except Exception as e:
            log.error(f"Error calling Google AI Embeddings API: {e}")
            raise

    async def acall(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        """Async call to Google AI embedding API.

        Note: Google AI Python client doesn't have async support yet,
        so this falls back to synchronous call.
        """
        return self.call(api_kwargs, model_type)
