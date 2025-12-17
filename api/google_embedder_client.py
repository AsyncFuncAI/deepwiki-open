"""Google AI Embeddings ModelClient integration using the new google-genai SDK."""

import os
import logging
import backoff
from typing import Dict, Any, Optional, List, Sequence

from adalflow.core.model_client import ModelClient
from adalflow.core.types import ModelType, EmbedderOutput

try:
    from google import genai
    from google.genai import types as genai_types
except ImportError:
    raise ImportError("google-genai is required. Install it with 'pip install google-genai'")

log = logging.getLogger(__name__)


class GoogleEmbedderClient(ModelClient):
    __doc__ = r"""A component wrapper for Google AI Embeddings API client.

    This client provides access to Google's embedding models through the Google AI API
    using the new google-genai SDK. It supports text embeddings for various tasks
    including semantic similarity, retrieval, and classification.

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
                "task_type": "SEMANTIC_SIMILARITY",
                "output_dimensionality": 3072
            }
        )
        ```

    References:
        - Google AI Embeddings: https://ai.google.dev/gemini-api/docs/embeddings
        - Available models: gemini-embedding-001, text-embedding-004
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
        self._api_key = api_key
        self._env_api_key_name = env_api_key_name
        self._client = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize the Google AI client with API key."""
        api_key = self._api_key or os.getenv(self._env_api_key_name)
        if not api_key:
            raise ValueError(
                f"Environment variable {self._env_api_key_name} must be set"
            )
        self._client = genai.Client(api_key=api_key)

    def parse_embedding_response(self, response) -> EmbedderOutput:
        """Parse Google AI embedding response to EmbedderOutput format.

        Args:
            response: Google AI embedding response from embed_content

        Returns:
            EmbedderOutput with parsed embeddings
        """
        try:
            from adalflow.core.types import Embedding

            embedding_data = []

            # New SDK returns response with .embeddings attribute
            # Each embedding has .values which is a list of floats
            if hasattr(response, 'embeddings') and response.embeddings:
                for i, emb in enumerate(response.embeddings):
                    if hasattr(emb, 'values'):
                        embedding_data.append(Embedding(embedding=list(emb.values), index=i))
                    elif isinstance(emb, (list, tuple)):
                        embedding_data.append(Embedding(embedding=list(emb), index=i))
                    else:
                        log.warning(f"Unexpected embedding format at index {i}: {type(emb)}")
            else:
                log.warning(f"Unexpected response structure: {type(response)}")

            return EmbedderOutput(
                data=embedding_data,
                error=None,
                raw_response=response
            )
        except Exception as e:
            log.error(f"Error parsing Google AI embedding response: {e}")
            return EmbedderOutput(
                data=[],
                error=str(e),
                raw_response=response
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
            model_kwargs: Model parameters including model name, task_type, output_dimensionality
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

        final_kwargs = {
            "model": model_kwargs.get("model", "gemini-embedding-001"),
            "contents": contents,
        }

        # Build EmbedContentConfig if we have additional parameters
        config_params = {}

        if "task_type" in model_kwargs:
            config_params["task_type"] = model_kwargs["task_type"]

        if "output_dimensionality" in model_kwargs:
            config_params["output_dimensionality"] = model_kwargs["output_dimensionality"]

        if config_params:
            final_kwargs["config"] = genai_types.EmbedContentConfig(**config_params)

        return final_kwargs

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

        log.info(f"Google AI Embeddings API call with model: {api_kwargs.get('model')}")

        try:
            # Use the new SDK client.models.embed_content
            response = self._client.models.embed_content(**api_kwargs)
            return response

        except Exception as e:
            log.error(f"Error calling Google AI Embeddings API: {e}")
            raise

    async def acall(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        """Async call to Google AI embedding API.

        Note: Using synchronous call as the google-genai SDK async support
        may vary. For true async, consider using asyncio.to_thread.
        """
        import asyncio
        return await asyncio.to_thread(self.call, api_kwargs, model_type)
