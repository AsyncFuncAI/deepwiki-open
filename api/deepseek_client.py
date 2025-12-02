"""DeepSeek ModelClient integration."""

import os
from typing import (
    Dict,
    Sequence,
    Optional,
    List,
    Any,
    TypeVar,
    Callable,
    Generator,
    Union,
    Literal,
)
import re
import logging
import backoff

from adalflow.utils.lazy_import import safe_import, OptionalPackages
from openai.types.chat.chat_completion import Choice

openai = safe_import(OptionalPackages.OPENAI.value[0], OptionalPackages.OPENAI.value[1])

from openai import OpenAI, AsyncOpenAI, Stream
from openai import (
    APITimeoutError,
    InternalServerError,
    RateLimitError,
    UnprocessableEntityError,
    BadRequestError,
)
from openai.types import (
    Completion,
    CreateEmbeddingResponse,
)
from openai.types.chat import ChatCompletionChunk, ChatCompletion, ChatCompletionMessage

from adalflow.core.model_client import ModelClient
from adalflow.core.types import (
    ModelType,
    EmbedderOutput,
    TokenLogProb,
    CompletionUsage,
    GeneratorOutput,
)
from adalflow.components.model_client.utils import parse_embedding_response

log = logging.getLogger(__name__)
T = TypeVar("T")


def get_first_message_content(completion: ChatCompletion) -> str:
    """Extract the content of the first message from completion."""
    log.debug(f"raw completion: {completion}")
    return completion.choices[0].message.content


def parse_stream_response(completion: ChatCompletionChunk) -> str:
    """Parse the response of the stream API."""
    return completion.choices[0].delta.content


def handle_streaming_response(generator: Stream[ChatCompletionChunk]):
    """Handle the streaming response."""
    for completion in generator:
        log.debug(f"Raw chunk completion: {completion}")
        parsed_content = parse_stream_response(completion)
        yield parsed_content


class DeepSeekClient(ModelClient):
    __doc__ = r"""A component wrapper for the DeepSeek API client.

    DeepSeek API is compatible with OpenAI's API format, so we use the OpenAI SDK
    with a custom base URL pointing to DeepSeek's endpoint.

    Visit https://api-docs.deepseek.com/ for more details.

    Note:
        DeepSeek does NOT support embeddings. This client is only for LLM generation.

    Example:
        ```python
        from api.deepseek_client import DeepSeekClient

        client = DeepSeekClient()
        generator = Generator(
            model_client=client,
            model_kwargs={"model": "deepseek-chat"}
        )
        ```

    Args:
        api_key (Optional[str], optional): DeepSeek API key. Defaults to `None`.
        chat_completion_parser (Callable[[Completion], Any], optional): A function to parse the chat completion into a `str`. Defaults to `None`.
        env_api_key_name (str): The environment variable name for the API key. Defaults to `"DEEPSEEK_API_KEY"`.

    References:
        - DeepSeek API Docs: https://api-docs.deepseek.com/
        - DeepSeek Platform: https://platform.deepseek.com/
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        chat_completion_parser: Callable[[Completion], Any] = None,
        input_type: Literal["text", "messages"] = "text",
        env_api_key_name: str = "DEEPSEEK_API_KEY",
    ):
        """Initialize the DeepSeek client.

        Args:
            api_key (Optional[str], optional): DeepSeek API key. Defaults to None.
            env_api_key_name (str): The environment variable name for the API key. Defaults to `"DEEPSEEK_API_KEY"`.
        """
        super().__init__()
        self._api_key = api_key
        self._env_api_key_name = env_api_key_name
        self.base_url = "https://api.deepseek.com"
        self.sync_client = self.init_sync_client()
        self.async_client = None  # only initialize if the async call is called
        self.chat_completion_parser = (
            chat_completion_parser or get_first_message_content
        )
        self._input_type = input_type
        self._api_kwargs = {}

    def init_sync_client(self):
        """Initialize synchronous DeepSeek client using OpenAI SDK."""
        api_key = self._api_key or os.getenv(self._env_api_key_name)
        if not api_key:
            raise ValueError(
                f"Environment variable {self._env_api_key_name} must be set"
            )
        return OpenAI(api_key=api_key, base_url=self.base_url)

    def init_async_client(self):
        """Initialize asynchronous DeepSeek client using OpenAI SDK."""
        api_key = self._api_key or os.getenv(self._env_api_key_name)
        if not api_key:
            raise ValueError(
                f"Environment variable {self._env_api_key_name} must be set"
            )
        return AsyncOpenAI(api_key=api_key, base_url=self.base_url)

    def parse_chat_completion(
        self,
        completion: Union[ChatCompletion, Generator[ChatCompletionChunk, None, None]],
    ) -> "GeneratorOutput":
        """Parse the completion, and put it into the raw_response."""
        log.debug(f"completion: {completion}, parser: {self.chat_completion_parser}")
        try:
            data = self.chat_completion_parser(completion)
        except Exception as e:
            log.error(f"Error parsing the completion: {e}")
            return GeneratorOutput(data=None, error=str(e), raw_response=completion)

        try:
            usage = self.track_completion_usage(completion)
            return GeneratorOutput(
                data=None, error=None, raw_response=data, usage=usage
            )
        except Exception as e:
            log.error(f"Error tracking the completion usage: {e}")
            return GeneratorOutput(data=None, error=str(e), raw_response=data)

    def track_completion_usage(
        self,
        completion: Union[ChatCompletion, Generator[ChatCompletionChunk, None, None]],
    ) -> CompletionUsage:
        """Track token usage from the completion response."""
        try:
            usage: CompletionUsage = CompletionUsage(
                completion_tokens=completion.usage.completion_tokens,
                prompt_tokens=completion.usage.prompt_tokens,
                total_tokens=completion.usage.total_tokens,
            )
            return usage
        except Exception as e:
            log.error(f"Error tracking the completion usage: {e}")
            return CompletionUsage(
                completion_tokens=None, prompt_tokens=None, total_tokens=None
            )

    def convert_inputs_to_api_kwargs(
        self,
        input: Optional[Any] = None,
        model_kwargs: Dict = {},
        model_type: ModelType = ModelType.UNDEFINED,
    ) -> Dict:
        """Convert inputs to DeepSeek API-specific format.
        
        Args:
            input: The input text to process
            model_kwargs: Additional parameters including model name
            model_type: The type of model (only LLM is supported)

        Returns:
            Dict: API-specific kwargs for the model call
        """
        final_model_kwargs = model_kwargs.copy()
        
        if model_type == ModelType.EMBEDDER:
            raise NotImplementedError("DeepSeek does not support embeddings")
        
        elif model_type == ModelType.LLM:
            # Convert input to messages
            messages: List[Dict[str, str]] = []

            if self._input_type == "messages":
                system_start_tag = "<START_OF_SYSTEM_PROMPT>"
                system_end_tag = "<END_OF_SYSTEM_PROMPT>"
                user_start_tag = "<START_OF_USER_PROMPT>"
                user_end_tag = "<END_OF_USER_PROMPT>"

                # Pattern to extract system and user prompts
                pattern = (
                    rf"{system_start_tag}\s*(.*?)\s*{system_end_tag}\s*"
                    rf"{user_start_tag}\s*(.*?)\s*{user_end_tag}"
                )

                regex = re.compile(pattern, re.DOTALL)
                match = regex.match(input)
                system_prompt, input_str = None, None

                if match:
                    system_prompt = match.group(1)
                    input_str = match.group(2)
                else:
                    log.debug("No match found for message tags.")
                    
                if system_prompt and input_str:
                    messages.append({"role": "system", "content": system_prompt})
                    messages.append({"role": "user", "content": input_str})
                    
            if len(messages) == 0:
                messages.append({"role": "user", "content": input})
                
            final_model_kwargs["messages"] = messages
        else:
            raise ValueError(f"model_type {model_type} is not supported")

        return final_model_kwargs

    @backoff.on_exception(
        backoff.expo,
        (
            APITimeoutError,
            InternalServerError,
            RateLimitError,
            UnprocessableEntityError,
            BadRequestError,
        ),
        max_time=5,
    )
    def call(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        """Make a synchronous call to the DeepSeek API.
        
        Supports both streaming and non-streaming modes.
        """
        log.info(f"api_kwargs: {api_kwargs}")
        self._api_kwargs = api_kwargs
        
        if model_type == ModelType.EMBEDDER:
            raise NotImplementedError("DeepSeek does not support embeddings")
            
        elif model_type == ModelType.LLM:
            if "stream" in api_kwargs and api_kwargs.get("stream", False):
                log.debug("streaming call")
                self.chat_completion_parser = handle_streaming_response
                return self.sync_client.chat.completions.create(**api_kwargs)
            else:
                log.debug("non-streaming call")
                # Ensure the parser expects a standard ChatCompletion object
                self.chat_completion_parser = get_first_message_content
                # Perform a direct non-streaming API call
                # This returns a full ChatCompletion object including the `usage` field
                return self.sync_client.chat.completions.create(**api_kwargs)
        else:
            raise ValueError(f"model_type {model_type} is not supported")

    @backoff.on_exception(
        backoff.expo,
        (
            APITimeoutError,
            InternalServerError,
            RateLimitError,
            UnprocessableEntityError,
            BadRequestError,
        ),
        max_time=5,
    )
    async def acall(
        self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED
    ):
        """Make an asynchronous call to the DeepSeek API."""
        self._api_kwargs = api_kwargs
        if self.async_client is None:
            self.async_client = self.init_async_client()
            
        if model_type == ModelType.EMBEDDER:
            raise NotImplementedError("DeepSeek does not support embeddings")
            
        elif model_type == ModelType.LLM:
            return await self.async_client.chat.completions.create(**api_kwargs)
        else:
            raise ValueError(f"model_type {model_type} is not supported")

    @classmethod
    def from_dict(cls: type[T], data: Dict[str, Any]) -> T:
        """Create DeepSeekClient instance from dictionary."""
        obj = super().from_dict(data)
        # Recreate the existing clients
        obj.sync_client = obj.init_sync_client()
        obj.async_client = obj.init_async_client()
        return obj

    def to_dict(self) -> Dict[str, Any]:
        """Convert the component to a dictionary."""
        exclude = [
            "sync_client",
            "async_client",
        ]  # unserializable object
        output = super().to_dict(exclude=exclude)
        return output
