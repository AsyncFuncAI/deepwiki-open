"""GPT-OSS-130B LLM Client for DeepWiki Single Provider."""

import os
import logging
from typing import List, Dict, Optional
import httpx
import time

logger = logging.getLogger(__name__)

DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
}


class GPTOSSClient:
    """Single-provider LLM client for gpt-oss-130b.

    This is the ONLY LLM client in the simplified DeepWiki architecture.
    No provider abstraction, no fallbacks, no multi-model support.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        token: Optional[str] = None,
        timeout: float = 30.0,
        max_retries: int = 3,
    ):
        """Initialize GPT-OSS client.

        Args:
            base_url: API base URL (or from DEEPWIKI_LLM_BASE_URL)
            token: Auth token (or from DEEPWIKI_LLM_TOKEN)
            timeout: Request timeout in seconds
            max_retries: Max retry attempts on failure
        """
        self.base_url = base_url or os.getenv("DEEPWIKI_LLM_BASE_URL")
        self.token = token or os.getenv("DEEPWIKI_LLM_TOKEN")
        self.timeout = timeout
        self.max_retries = max_retries

        if not self.base_url:
            raise ValueError("DEEPWIKI_LLM_BASE_URL must be set")
        if not self.token:
            raise ValueError("DEEPWIKI_LLM_TOKEN must be set")

        # Initialize HTTP client with custom auth
        headers = {**DEFAULT_HEADERS, "x-dep-ticket": self.token}
        self.client = httpx.Client(
            base_url=self.base_url,
            headers=headers,
            timeout=self.timeout,
        )

        logger.info(f"GPTOSSClient initialized with base_url={self.base_url}")

    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> str:
        """Generate completion using gpt-oss-130b.

        Args:
            messages: OpenAI-compatible message list
            temperature: Sampling temperature
            max_tokens: Max tokens to generate

        Returns:
            Generated text content

        Raises:
            httpx.HTTPStatusError: On API errors
            httpx.TimeoutException: On timeout
        """
        payload = {
            "model": "openai/gpt-oss-130b",
            "messages": messages,
            "temperature": temperature,
        }

        if max_tokens:
            payload["max_tokens"] = max_tokens

        endpoint = "/gpt-oss-130b/v1/chat/completions"

        for attempt in range(self.max_retries):
            try:
                logger.debug(f"LLM request (attempt {attempt + 1}/{self.max_retries})")
                response = self.client.post(endpoint, json=payload)
                response.raise_for_status()

                data = response.json()
                content = data["choices"][0]["message"]["content"]

                logger.info(f"LLM response received ({len(content)} chars)")
                return content

            except httpx.HTTPStatusError as e:
                status = e.response.status_code
                logger.error(f"HTTP {status}: {e.response.text}")

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

    def chat_with_system(
        self,
        system: str,
        user: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> str:
        """Convenience method for system + user prompt.

        Args:
            system: System prompt
            user: User prompt
            temperature: Sampling temperature
            max_tokens: Max tokens

        Returns:
            Generated text
        """
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        return self.chat(messages, temperature, max_tokens)

    def __del__(self):
        """Cleanup HTTP client."""
        if hasattr(self, 'client'):
            try:
                self.client.close()
            except Exception:
                pass
