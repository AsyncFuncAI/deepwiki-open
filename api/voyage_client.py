"""Voyage AI Embeddings ModelClient integration."""

import os
import logging
import backoff
from typing import Dict, Any, Optional, List, Sequence

from adalflow.core.model_client import ModelClient
from adalflow.core.types import ModelType, EmbedderOutput

try:
    import voyageai
except ImportError:
    raise ImportError("voyageai is required. Install it with 'pip install voyageai'")

log = logging.getLogger(__name__)


class VoyageEmbedderClient(ModelClient):
    __doc__ = r"""A component wrapper for Voyage AI Embeddings API client.

    This client provides access to Voyage AI's specialized embedding models.
    It supports text embeddings optimized for code retrieval and general semantic search.

    Args:
        api_key (Optional[str]): Voyage AI API key. Defaults to None.
            If not provided, will use the VOYAGE_API_KEY environment variable.
        env_api_key_name (str): Environment variable name for the API key.
            Defaults to "VOYAGE_API_KEY".

    Example:
        ```python
        from api.voyage_client import VoyageEmbedderClient
        import adalflow as adal

        client = VoyageEmbedderClient()
        embedder = adal.Embedder(
            model_client=client,
            model_kwargs={
                "model": "voyage-code-2",
                "input_type": "document"  # or "query"
            }
        )
        ```
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        env_api_key_name: str = "VOYAGE_API_KEY",
    ):
        """Initialize Voyage AI Embeddings client.
        
        Args:
            api_key: Voyage AI API key. If not provided, uses environment variable.
            env_api_key_name: Name of environment variable containing API key.
        """
        super().__init__()
        self._api_key = api_key
        self._env_api_key_name = env_api_key_name
        self._client: Optional[Any] = None
        self._voyage_async_client: Optional[Any] = None

    def _initialize_client(self):
        """Initialize (or re-initialize) the Voyage AI client with API key."""
        api_key = self._api_key or os.getenv(self._env_api_key_name)
        if not api_key:
            raise ValueError(
                f"Environment variable {self._env_api_key_name} must be set"
            )
        self._client = voyageai.Client(api_key=api_key)

    @property
    def client(self):
        """Lazy client accessor — reconstructs after unpickling."""
        if self._client is None:
            self._initialize_client()
        return self._client

    def __getstate__(self):
        """Exclude unpicklable voyageai clients from pickle state."""
        state = self.__dict__.copy()
        state['_client'] = None
        state['_voyage_async_client'] = None
        return state

    def __setstate__(self, state):
        """Restore state; client will be lazily re-initialized on next use."""
        self.__dict__.update(state)

    def to_dict(self, exclude: Optional[List[str]] = None) -> dict:
        """Serialize to dict, excluding the voyageai.Client which is not serializable.

        voyageai.Client internally uses tenacity retry objects (retry_if_exception_type)
        that contain lambdas and cannot be pickled or serialized. The client is
        reconstructed lazily from _api_key / _env_api_key_name on next use.
        """
        exclude = list(exclude or []) + ['_client', '_voyage_async_client']
        return super().to_dict(exclude=exclude)

    def parse_embedding_response(self, response) -> EmbedderOutput:
        """Parse Voyage AI embedding response to EmbedderOutput format.
        
        Args:
            response: Voyage AI embedding response object
            
        Returns:
            EmbedderOutput with parsed embeddings
        """
        try:
            from adalflow.core.types import Embedding
            
            # The response object has an 'embeddings' attribute which is a list of lists
            embedding_data = []
            
            if hasattr(response, 'embeddings') and response.embeddings:
                embedding_data = [
                    Embedding(embedding=emb, index=i)
                    for i, emb in enumerate(response.embeddings)
                ]
                
                if embedding_data:
                    first_dim = len(embedding_data[0].embedding)
                    log.info("Parsed %s embedding(s) (dim=%s)", len(embedding_data), first_dim)
            else:
                log.warning("Empty or invalid embedding data in response")

            return EmbedderOutput(
                data=embedding_data,
                error=None,
                raw_response=response
            )
        except Exception as e:
            log.error(f"Error parsing Voyage AI embedding response: {e}")
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
        """Convert inputs to Voyage AI API format.
        
        Args:
            input: Text input(s) to embed
            model_kwargs: Model parameters including model name and input_type
            model_type: Should be ModelType.EMBEDDER for this client
            
        Returns:
            Dict: API kwargs for Voyage AI embedding call
        """
        if model_type != ModelType.EMBEDDER:
            raise ValueError(f"VoyageEmbedderClient only supports EMBEDDER model type, got {model_type}")
        
        # Ensure input is a list
        if isinstance(input, str):
            texts = [input]
        elif isinstance(input, Sequence):
            texts = list(input)
        else:
            raise TypeError("input must be a string or sequence of strings")
        
        final_model_kwargs = model_kwargs.copy()
        final_model_kwargs["texts"] = texts
            
        # Set default model if not provided
        if "model" not in final_model_kwargs:
            final_model_kwargs["model"] = "voyage-code-3"

        # Ensure input_type is set (default to document; callers set "query" for retrieval)
        if "input_type" not in final_model_kwargs:
            final_model_kwargs["input_type"] = "document"

        return final_model_kwargs

    @backoff.on_exception(
        backoff.expo,
        Exception,
        max_tries=3,
        giveup=lambda e: isinstance(e, (ValueError, TypeError)),
    )
    def call(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        """Call Voyage AI embedding API.

        Args:
            api_kwargs: API parameters
            model_type: Should be ModelType.EMBEDDER

        Returns:
            Voyage AI embedding response
        """
        if model_type != ModelType.EMBEDDER:
            raise ValueError("VoyageEmbedderClient only supports EMBEDDER model type")

        safe_log_kwargs = {k: v for k, v in api_kwargs.items() if k != "texts"}
        if "texts" in api_kwargs:
            safe_log_kwargs["texts_count"] = len(api_kwargs["texts"])

        log.info("Voyage AI Embeddings call kwargs (sanitized): %s", safe_log_kwargs)
        return self.client.embed(**api_kwargs)

    @property
    def voyage_async_client(self):
        """Lazy async client accessor — reconstructs after unpickling."""
        if self._voyage_async_client is None:
            api_key = self._api_key or os.getenv(self._env_api_key_name)
            if not api_key:
                raise ValueError(f"Environment variable {self._env_api_key_name} must be set")
            self._voyage_async_client = voyageai.AsyncClient(api_key=api_key)
        return self._voyage_async_client

    async def acall(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        """Async call to Voyage AI embedding API via voyageai.AsyncClient."""
        if model_type != ModelType.EMBEDDER:
            raise ValueError("VoyageEmbedderClient only supports EMBEDDER model type")

        safe_log_kwargs = {k: v for k, v in api_kwargs.items() if k != "texts"}
        if "texts" in api_kwargs:
            safe_log_kwargs["texts_count"] = len(api_kwargs["texts"])

        log.info("Voyage AI Embeddings async call kwargs (sanitized): %s", safe_log_kwargs)
        return await self.voyage_async_client.embed(**api_kwargs)
