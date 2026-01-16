"""Enterprise OpenAI-compatible LLM Client for gpt-oss-130b."""

import os
import logging
import backoff
import time
from typing import Dict, Any, Optional, List, Union, Callable, Generator

from adalflow.core.model_client import ModelClient
from adalflow.core.types import ModelType, GeneratorOutput, CompletionUsage

try:
    import httpx
except ImportError:
    raise ImportError("httpx is required. Install it with 'pip install httpx'")

log = logging.getLogger(__name__)

DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
}


def get_first_message_content(completion: Dict[str, Any]) -> str:
    """Extract the first message content from completion response."""
    try:
        choices = completion.get("choices", [])
        if choices:
            message = choices[0].get("message", {})
            return message.get("content", "")
        return ""
    except Exception as e:
        log.error(f"Error parsing completion: {e}")
        return ""


class EnterpriseOpenAIClient(ModelClient):
    __doc__ = r"""Enterprise OpenAI-compatible LLM Client.

    This client connects to an internal enterprise OpenAI-compatible API
    for the gpt-oss-130b model. It uses custom authentication via x-dep-ticket
    header and follows the OpenAI Chat Completions API format.

    Args:
        base_url (Optional[str]): Base URL for the enterprise API. Defaults to None.
        api_token (Optional[str]): Authentication token for x-dep-ticket header. Defaults to None.
        env_base_url_name (str): Environment variable name for base URL. Defaults to "ENTERPRISE_OPENAI_BASE_URL".
        env_token_name (str): Environment variable name for API token. Defaults to "ENTERPRISE_OPENAI_TOKEN".
        timeout (float): Request timeout in seconds. Defaults to 30.0.
        max_retries (int): Maximum number of retries for failed requests. Defaults to 4.
        chat_completion_parser (Callable): Function to parse chat completion responses.

    Environment Variables:
        ENTERPRISE_OPENAI_BASE_URL: Base URL for the enterprise API
        ENTERPRISE_OPENAI_TOKEN: Authentication token for API access

    Example:
        ```python
        from api.enterprise_openai_client import EnterpriseOpenAIClient
        import adalflow as adal

        client = EnterpriseOpenAIClient()
        generator = adal.Generator(
            model_client=client,
            model_kwargs={"model": "gpt-oss-130b", "temperature": 0.7}
        )
        ```
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_token: Optional[str] = None,
        env_base_url_name: str = "ENTERPRISE_OPENAI_BASE_URL",
        env_token_name: str = "ENTERPRISE_OPENAI_TOKEN",
        timeout: float = 30.0,
        max_retries: int = 4,
        chat_completion_parser: Optional[Callable] = None,
    ):
        """Initialize Enterprise OpenAI client.

        Args:
            base_url: Base URL for the enterprise API
            api_token: Authentication token
            env_base_url_name: Environment variable name for base URL
            env_token_name: Environment variable name for token
            timeout: Request timeout in seconds
            max_retries: Maximum retry attempts
            chat_completion_parser: Custom completion parser function
        """
        super().__init__()
        self._base_url = base_url
        self._api_token = api_token
        self._env_base_url_name = env_base_url_name
        self._env_token_name = env_token_name
        self._timeout = timeout
        self._max_retries = max_retries
        self.chat_completion_parser = chat_completion_parser or get_first_message_content

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
        """Convert inputs to enterprise API format.

        Args:
            input: The input prompt text
            model_kwargs: Model parameters including model name and generation params
            model_type: Should be ModelType.LLM for this client

        Returns:
            Dict: API kwargs for the enterprise API call
        """
        if model_type != ModelType.LLM:
            raise ValueError(f"EnterpriseOpenAIClient only supports LLM model type, got {model_type}")

        final_model_kwargs = model_kwargs.copy()

        # Convert input to OpenAI chat format
        messages: List[Dict[str, str]] = []

        # Check for system/user prompt tags
        import re
        system_start_tag = "<START_OF_SYSTEM_PROMPT>"
        system_end_tag = "<END_OF_SYSTEM_PROMPT>"
        user_start_tag = "<START_OF_USER_PROMPT>"
        user_end_tag = "<END_OF_USER_PROMPT>"

        pattern = (
            rf"{system_start_tag}\s*(.*?)\s*{system_end_tag}\s*"
            rf"{user_start_tag}\s*(.*?)\s*{user_end_tag}"
        )
        regex = re.compile(pattern, re.DOTALL)
        match = regex.match(input)

        if match:
            system_prompt = match.group(1)
            user_prompt = match.group(2)
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            if user_prompt:
                messages.append({"role": "user", "content": user_prompt})
        else:
            # No tags found, treat entire input as user message
            messages.append({"role": "user", "content": input})

        final_model_kwargs["messages"] = messages

        # Ensure model is prefixed correctly for enterprise API
        model = final_model_kwargs.get("model", "gpt-oss-130b")
        if not model.startswith("openai/"):
            final_model_kwargs["model"] = f"openai/{model}"

        return final_model_kwargs

    def parse_chat_completion(self, completion: Dict[str, Any]) -> GeneratorOutput:
        """Parse completion response into GeneratorOutput.

        Args:
            completion: API response dictionary

        Returns:
            GeneratorOutput with parsed content and usage
        """
        try:
            data = self.chat_completion_parser(completion)
            usage = self._extract_usage(completion)

            return GeneratorOutput(
                data=None,
                error=None,
                raw_response=data,
                usage=usage
            )
        except Exception as e:
            log.error(f"Error parsing completion: {e}")
            return GeneratorOutput(
                data=None,
                error=str(e),
                raw_response=completion
            )

    def _extract_usage(self, completion: Dict[str, Any]) -> CompletionUsage:
        """Extract token usage from completion response.

        Args:
            completion: API response dictionary

        Returns:
            CompletionUsage object
        """
        try:
            usage = completion.get("usage", {})
            return CompletionUsage(
                completion_tokens=usage.get("completion_tokens"),
                prompt_tokens=usage.get("prompt_tokens"),
                total_tokens=usage.get("total_tokens"),
            )
        except Exception as e:
            log.error(f"Error extracting usage: {e}")
            return CompletionUsage(
                completion_tokens=None,
                prompt_tokens=None,
                total_tokens=None
            )

    def _should_retry(self, status_code: int) -> bool:
        """Determine if request should be retried based on status code.

        Args:
            status_code: HTTP status code

        Returns:
            bool: True if should retry
        """
        # Retry on rate limit (429) and server errors (5xx)
        return status_code == 429 or status_code >= 500

    def _exponential_backoff(self, attempt: int) -> float:
        """Calculate exponential backoff delay.

        Args:
            attempt: Current attempt number (0-indexed)

        Returns:
            float: Delay in seconds
        """
        return min(2 ** attempt, 16)  # Cap at 16 seconds

    @backoff.on_exception(
        backoff.expo,
        (httpx.TimeoutException, httpx.HTTPStatusError),
        max_tries=5,
        giveup=lambda e: isinstance(e, httpx.HTTPStatusError) and not (e.response.status_code == 429 or e.response.status_code >= 500)
    )
    def call(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        """Call the enterprise API synchronously.

        Args:
            api_kwargs: API parameters including model, messages, and generation params
            model_type: Should be ModelType.LLM

        Returns:
            Dict: API response

        Raises:
            httpx.HTTPStatusError: On HTTP errors that shouldn't be retried
            httpx.TimeoutException: On timeout
        """
        if model_type != ModelType.LLM:
            raise ValueError(f"EnterpriseOpenAIClient only supports LLM model type")

        log.info(f"Enterprise OpenAI API call with model: {api_kwargs.get('model')}")

        # Extract model to construct endpoint
        model = api_kwargs.get("model", "openai/gpt-oss-130b")
        # Remove 'openai/' prefix for endpoint construction
        model_name = model.replace("openai/", "")

        # Construct endpoint URL
        endpoint = f"/{model_name}/v1/chat/completions"

        # Prepare payload
        payload = {
            "model": model,
            "messages": api_kwargs.get("messages", []),
        }

        # Add optional generation parameters
        for key in ["temperature", "top_p", "max_tokens", "n", "stop", "presence_penalty", "frequency_penalty"]:
            if key in api_kwargs:
                payload[key] = api_kwargs[key]

        try:
            response = self.sync_client.post(endpoint, json=payload)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            log.error(f"HTTP error: {e.response.status_code} - {e.response.text}")
            raise
        except httpx.TimeoutException as e:
            log.error(f"Request timeout: {e}")
            raise
        except Exception as e:
            log.error(f"Unexpected error in API call: {e}")
            raise

    @backoff.on_exception(
        backoff.expo,
        (httpx.TimeoutException, httpx.HTTPStatusError),
        max_tries=5,
        giveup=lambda e: isinstance(e, httpx.HTTPStatusError) and not (e.response.status_code == 429 or e.response.status_code >= 500)
    )
    async def acall(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        """Call the enterprise API asynchronously.

        Args:
            api_kwargs: API parameters
            model_type: Should be ModelType.LLM

        Returns:
            Dict: API response
        """
        if model_type != ModelType.LLM:
            raise ValueError(f"EnterpriseOpenAIClient only supports LLM model type")

        if self.async_client is None:
            self.async_client = self._init_async_client()

        # Extract model to construct endpoint
        model = api_kwargs.get("model", "openai/gpt-oss-130b")
        model_name = model.replace("openai/", "")

        # Construct endpoint URL
        endpoint = f"/{model_name}/v1/chat/completions"

        # Prepare payload
        payload = {
            "model": model,
            "messages": api_kwargs.get("messages", []),
        }

        # Add optional generation parameters
        for key in ["temperature", "top_p", "max_tokens", "n", "stop", "presence_penalty", "frequency_penalty"]:
            if key in api_kwargs:
                payload[key] = api_kwargs[key]

        try:
            response = await self.async_client.post(endpoint, json=payload)
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
