"""BGE-M3 Embedding Client for DeepWiki Single Provider."""

import os
import logging
from typing import List, Optional
import httpx
import time

logger = logging.getLogger(__name__)

DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
}

BGE_M3_DIMENSION = 1024


class BGEM3Client:
    """Single-provider embedding client for BGE-M3.

    This is the ONLY embedding client in the simplified DeepWiki architecture.
    No provider abstraction, no fallbacks, no multi-model support.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        token: Optional[str] = None,
        batch_size: int = 100,
        timeout: float = 60.0,
        max_retries: int = 3,
    ):
        """Initialize BGE-M3 client.

        Args:
            base_url: API base URL (or from DEEPWIKI_EMBEDDING_BASE_URL)
            token: Auth token (or from DEEPWIKI_EMBEDDING_TOKEN)
            batch_size: Max texts per batch
            timeout: Request timeout in seconds
            max_retries: Max retry attempts on failure
        """
        self.base_url = base_url or os.getenv("DEEPWIKI_EMBEDDING_BASE_URL")
        self.token = token or os.getenv("DEEPWIKI_EMBEDDING_TOKEN")
        self.batch_size = batch_size
        self.timeout = timeout
        self.max_retries = max_retries

        if not self.base_url:
            raise ValueError("DEEPWIKI_EMBEDDING_BASE_URL must be set")
        if not self.token:
            raise ValueError("DEEPWIKI_EMBEDDING_TOKEN must be set")

        # Initialize HTTP client with custom auth
        headers = {**DEFAULT_HEADERS, "x-dep-ticket": self.token}
        self.client = httpx.Client(
            base_url=self.base_url,
            headers=headers,
            timeout=self.timeout,
        )

        logger.info(f"BGEM3Client initialized with base_url={self.base_url}, batch_size={self.batch_size}")

    def embed(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for texts using BGE-M3.

        Args:
            texts: List of texts to embed

        Returns:
            List of 1024-dimensional embedding vectors

        Raises:
            httpx.HTTPStatusError: On API errors
            httpx.TimeoutException: On timeout
        """
        if not texts:
            return []

        logger.info(f"Embedding {len(texts)} text(s)")

        # Process in batches
        all_embeddings = []
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]
            batch_embeddings = self._embed_batch(batch)
            all_embeddings.extend(batch_embeddings)

        logger.info(f"Generated {len(all_embeddings)} embedding(s)")
        return all_embeddings

    def _embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embed a single batch with retry logic.

        Args:
            texts: Batch of texts (max batch_size)

        Returns:
            List of embeddings
        """
        payload = {
            "model": "bge-m3",
            "input": texts,
        }

        endpoint = "/v1/embeddings"

        for attempt in range(self.max_retries):
            try:
                logger.debug(f"Embedding batch of {len(texts)} (attempt {attempt + 1}/{self.max_retries})")
                response = self.client.post(endpoint, json=payload)
                response.raise_for_status()

                data = response.json()
                embeddings = self._parse_response(data)

                # Validate dimension
                if embeddings and len(embeddings[0]) != BGE_M3_DIMENSION:
                    logger.warning(
                        f"Expected dimension {BGE_M3_DIMENSION}, got {len(embeddings[0])}"
                    )

                return embeddings

            except httpx.HTTPStatusError as e:
                status = e.response.status_code
                logger.error(f"HTTP {status}: {e.response.text}")

                # If batch fails, try individual texts
                if len(texts) > 1 and status in (400, 413):
                    logger.warning("Batch failed, retrying individual texts")
                    return self._embed_individual(texts)

                # Retry on rate limit or server errors
                if status in (429, 500, 502, 503, 504) and attempt < self.max_retries - 1:
                    wait = 2 ** attempt
                    logger.warning(f"Retrying in {wait}s...")
                    time.sleep(wait)
                    continue
                raise

            except httpx.TimeoutException as e:
                logger.error(f"Timeout: {e}")
                if attempt < self.max_retries - 1:
                    logger.warning("Retrying...")
                    continue
                raise

        raise RuntimeError(f"Failed after {self.max_retries} attempts")

    def _embed_individual(self, texts: List[str]) -> List[List[float]]:
        """Fallback: embed texts individually on batch failure.

        Args:
            texts: Texts that failed in batch

        Returns:
            List of embeddings (may have fewer items if some fail)
        """
        embeddings = []
        for text in texts:
            try:
                emb = self._embed_batch([text])
                embeddings.extend(emb)
            except Exception as e:
                logger.error(f"Failed to embed text: {e}")
                # Add zero vector as fallback
                embeddings.append([0.0] * BGE_M3_DIMENSION)
        return embeddings

    def _parse_response(self, data: dict) -> List[List[float]]:
        """Parse API response to extract embeddings.

        Args:
            data: API response JSON

        Returns:
            List of embedding vectors
        """
        # Handle different response formats
        if "embeddings" in data:
            return data["embeddings"]
        elif "data" in data:
            # OpenAI-compatible format
            return [item["embedding"] for item in data["data"]]
        else:
            raise ValueError(f"Unexpected response format: {data.keys()}")

    def __del__(self):
        """Cleanup HTTP client."""
        if hasattr(self, 'client'):
            try:
                self.client.close()
            except Exception:
                pass
