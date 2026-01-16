"""Enterprise BGE-M3 Embedder Client."""

import os
import logging
import backoff
from typing import Dict, Any, Optional, List, Sequence

from adalflow.core.model_client import ModelClient
from adalflow.core.types import ModelType, EmbedderOutput, Embedding

try:
    import httpx
except ImportError:
    raise ImportError("httpx is required. Install it with 'pip install httpx'")

log = logging.getLogger(__name__)

DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
}

# BGE-M3 embedding dimension
BGE_M3_DIMENSION = 1024


class EnterpriseBGEEmbedderClient(ModelClient):
    __doc__ = r"""Enterprise BGE-M3 Embedder Client.

    This client connects to an internal enterprise BGE-M3 embedding API.
    It supports batch embedding with graceful handling of partial failures.

    Args:
        base_url (Optional[str]): Base URL for the enterprise embedding API. Defaults to None.
        api_token (Optional[str]): Authentication token for x-dep-ticket header. Defaults to None.
        env_base_url_name (str): Environment variable name for base URL. Defaults to "ENTERPRISE_BGE_BASE_URL".
        env_token_name (str): Environment variable name for API token. Defaults to "ENTERPRISE_BGE_TOKEN".
        timeout (float): Request timeout in seconds. Defaults to 60.0.
        batch_size (int): Maximum batch size for embedding requests. Defaults to 100.
        max_retries (int): Maximum number of retries for failed requests. Defaults to 4.

    Environment Variables:
        ENTERPRISE_BGE_BASE_URL: Base URL for the enterprise embedding API
        ENTERPRISE_BGE_TOKEN: Authentication token for API access

    Example:
        ```python
        from api.enterprise_bge_embedder_client import EnterpriseBGEEmbedderClient
        import adalflow as adal

        client = EnterpriseBGEEmbedderClient()
        embedder = adal.Embedder(
            model_client=client,
            model_kwargs={"model": "bge-m3"}
        )
        ```
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_token: Optional[str] = None,
        env_base_url_name: str = "ENTERPRISE_BGE_BASE_URL",
        env_token_name: str = "ENTERPRISE_BGE_TOKEN",
        timeout: float = 60.0,
        batch_size: int = 100,
        max_retries: int = 4,
    ):
        """Initialize Enterprise BGE Embedder client.

        Args:
            base_url: Base URL for the enterprise embedding API
            api_token: Authentication token
            env_base_url_name: Environment variable name for base URL
            env_token_name: Environment variable name for token
            timeout: Request timeout in seconds
            batch_size: Maximum batch size for embedding requests
            max_retries: Maximum retry attempts
        """
        super().__init__()
        self._base_url = base_url
        self._api_token = api_token
        self._env_base_url_name = env_base_url_name
        self._env_token_name = env_token_name
        self._timeout = timeout
        self._batch_size = batch_size
        self._max_retries = max_retries

        # Initialize HTTP client
        self.sync_client = self._init_sync_client()
        self.async_client = None

    def _init_sync_client(self) -> httpx.Client:
        """Initialize synchronous HTTP client with enterprise authentication."""
        base_url = self._base_url or os.getenv(self._env_base_url_name)
        if not base_url:
            raise ValueError(
                f"Environment variable {self._env_base_url_name} must be set or base_url must be provided"
            )

        token = self._api_token or os.getenv(self._env_token_name)
        if not token:
            raise ValueError(
                f"Environment variable {self._env_token_name} must be set or api_token must be provided"
            )

        headers = {**DEFAULT_HEADERS, "x-dep-ticket": token}

        return httpx.Client(
            base_url=base_url,
            headers=headers,
            timeout=self._timeout,
        )

    def _init_async_client(self) -> httpx.AsyncClient:
        """Initialize asynchronous HTTP client."""
        base_url = self._base_url or os.getenv(self._env_base_url_name)
        token = self._api_token or os.getenv(self._env_token_name)

        headers = {**DEFAULT_HEADERS, "x-dep-ticket": token}

        return httpx.AsyncClient(
            base_url=base_url,
            headers=headers,
            timeout=self._timeout,
        )

    def convert_inputs_to_api_kwargs(
        self,
        input: Optional[Any] = None,
        model_kwargs: Dict = {},
        model_type: ModelType = ModelType.UNDEFINED,
    ) -> Dict:
        """Convert inputs to enterprise BGE API format.

        Args:
            input: Text input(s) to embed
            model_kwargs: Model parameters
            model_type: Should be ModelType.EMBEDDER for this client

        Returns:
            Dict: API kwargs for the embedding call
        """
        if model_type != ModelType.EMBEDDER:
            raise ValueError(f"EnterpriseBGEEmbedderClient only supports EMBEDDER model type, got {model_type}")

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
            final_model_kwargs["model"] = "bge-m3"

        return final_model_kwargs

    def parse_embedding_response(self, response: Dict[str, Any]) -> EmbedderOutput:
        """Parse enterprise BGE embedding response to EmbedderOutput format.

        Args:
            response: Enterprise BGE API response

        Returns:
            EmbedderOutput with parsed embeddings
        """
        try:
            embedding_data = []

            # Expected response format:
            # {"embeddings": [[float, ...], [float, ...]], "model": "bge-m3"}
            # or
            # {"data": [{"embedding": [float, ...], "index": 0}, ...]}

            embeddings_raw = response.get("embeddings") or response.get("data", [])

            if isinstance(embeddings_raw, list):
                for idx, emb in enumerate(embeddings_raw):
                    if isinstance(emb, list):
                        # Direct list of floats
                        embedding_data.append(Embedding(embedding=emb, index=idx))
                    elif isinstance(emb, dict):
                        # Dict with embedding key
                        emb_vector = emb.get("embedding", [])
                        emb_index = emb.get("index", idx)
                        embedding_data.append(Embedding(embedding=emb_vector, index=emb_index))
                    else:
                        log.warning(f"Unexpected embedding format at index {idx}: {type(emb)}")

            if embedding_data:
                first_dim = len(embedding_data[0].embedding) if embedding_data[0].embedding else 0
                log.info(f"Parsed {len(embedding_data)} embedding(s) (dim={first_dim})")

                # Validate dimension
                if first_dim != BGE_M3_DIMENSION:
                    log.warning(f"Expected dimension {BGE_M3_DIMENSION}, got {first_dim}")

            return EmbedderOutput(
                data=embedding_data,
                error=None,
                raw_response=response
            )
        except Exception as e:
            log.error(f"Error parsing enterprise BGE embedding response: {e}")
            return EmbedderOutput(
                data=[],
                error=str(e),
                raw_response=response
            )

    def _embed_batch(self, texts: List[str], model: str) -> Dict[str, Any]:
        """Embed a single batch of texts.

        Args:
            texts: List of texts to embed
            model: Model name

        Returns:
            Dict: API response

        Raises:
            httpx.HTTPStatusError: On HTTP errors
            httpx.TimeoutException: On timeout
        """
        payload = {
            "model": model,
            "input": texts,
        }

        try:
            response = self.sync_client.post("/v1/embeddings", json=payload)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            log.error(f"HTTP error in batch embedding: {e.response.status_code} - {e.response.text}")
            raise
        except httpx.TimeoutException as e:
            log.error(f"Timeout in batch embedding: {e}")
            raise

    def _embed_with_partial_retry(self, texts: List[str], model: str) -> EmbedderOutput:
        """Embed texts with partial retry on batch failures.

        If a batch fails, try to embed texts individually to salvage as many as possible.

        Args:
            texts: List of texts to embed
            model: Model name

        Returns:
            EmbedderOutput with successfully embedded texts
        """
        try:
            # Try full batch first
            response = self._embed_batch(texts, model)
            return self.parse_embedding_response(response)
        except Exception as batch_error:
            log.warning(f"Batch embedding failed: {batch_error}. Attempting individual retries.")

            # Fallback: try individual embeddings
            successful_embeddings = []
            errors = []

            for idx, text in enumerate(texts):
                try:
                    response = self._embed_batch([text], model)
                    parsed = self.parse_embedding_response(response)
                    if parsed.data:
                        # Update index to match original position
                        emb = parsed.data[0]
                        emb.index = idx
                        successful_embeddings.append(emb)
                except Exception as e:
                    log.error(f"Failed to embed text at index {idx}: {e}")
                    errors.append(f"Index {idx}: {str(e)}")

            if not successful_embeddings:
                error_msg = f"All individual embeddings failed. Errors: {'; '.join(errors)}"
                return EmbedderOutput(data=[], error=error_msg, raw_response=None)

            log.info(f"Partial success: {len(successful_embeddings)}/{len(texts)} embeddings succeeded")
            return EmbedderOutput(
                data=successful_embeddings,
                error=None if len(successful_embeddings) == len(texts) else f"Partial failure: {'; '.join(errors)}",
                raw_response=None
            )

    @backoff.on_exception(
        backoff.expo,
        (httpx.TimeoutException, httpx.HTTPStatusError),
        max_tries=5,
        giveup=lambda e: isinstance(e, httpx.HTTPStatusError) and not (e.response.status_code == 429 or e.response.status_code >= 500)
    )
    def call(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        """Call the enterprise BGE embedding API synchronously.

        Args:
            api_kwargs: API parameters including texts and model
            model_type: Should be ModelType.EMBEDDER

        Returns:
            Dict: API response with embeddings
        """
        if model_type != ModelType.EMBEDDER:
            raise ValueError(f"EnterpriseBGEEmbedderClient only supports EMBEDDER model type")

        texts = api_kwargs.get("texts", [])
        model = api_kwargs.get("model", "bge-m3")

        if not texts:
            log.warning("Empty texts provided for embedding")
            return {"embeddings": [], "model": model}

        log.info(f"Enterprise BGE embedding call with {len(texts)} text(s)")

        # Process in batches if needed
        if len(texts) <= self._batch_size:
            return self._embed_batch(texts, model)
        else:
            # Split into batches
            all_embeddings = []
            for i in range(0, len(texts), self._batch_size):
                batch = texts[i:i + self._batch_size]
                log.info(f"Processing batch {i // self._batch_size + 1} ({len(batch)} texts)")

                batch_response = self._embed_batch(batch, model)
                batch_parsed = self.parse_embedding_response(batch_response)

                # Adjust indices for concatenated results
                for emb in batch_parsed.data:
                    emb.index = i + emb.index
                    all_embeddings.append(emb.embedding)

            # Return in standard format
            return {
                "embeddings": all_embeddings,
                "model": model
            }

    @backoff.on_exception(
        backoff.expo,
        (httpx.TimeoutException, httpx.HTTPStatusError),
        max_tries=5,
        giveup=lambda e: isinstance(e, httpx.HTTPStatusError) and not (e.response.status_code == 429 or e.response.status_code >= 500)
    )
    async def acall(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        """Call the enterprise BGE embedding API asynchronously.

        Args:
            api_kwargs: API parameters
            model_type: Should be ModelType.EMBEDDER

        Returns:
            Dict: API response with embeddings
        """
        if model_type != ModelType.EMBEDDER:
            raise ValueError(f"EnterpriseBGEEmbedderClient only supports EMBEDDER model type")

        if self.async_client is None:
            self.async_client = self._init_async_client()

        texts = api_kwargs.get("texts", [])
        model = api_kwargs.get("model", "bge-m3")

        if not texts:
            log.warning("Empty texts provided for embedding")
            return {"embeddings": [], "model": model}

        payload = {
            "model": model,
            "input": texts,
        }

        try:
            response = await self.async_client.post("/v1/embeddings", json=payload)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            log.error(f"HTTP error: {e.response.status_code} - {e.response.text}")
            raise
        except httpx.TimeoutException as e:
            log.error(f"Request timeout: {e}")
            raise

    def __del__(self):
        """Cleanup HTTP clients."""
        try:
            if hasattr(self, 'sync_client') and self.sync_client:
                self.sync_client.close()
            if hasattr(self, 'async_client') and self.async_client:
                import asyncio
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        loop.create_task(self.async_client.aclose())
                    else:
                        loop.run_until_complete(self.async_client.aclose())
                except Exception:
                    pass
        except Exception:
            pass
