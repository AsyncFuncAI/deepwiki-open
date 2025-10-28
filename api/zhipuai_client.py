"""ZhipuAI (智谱AI) ModelClient integration.

ZhipuAI's API is fully compatible with OpenAI's format, so this client
leverages the OpenAI SDK with a custom base_url.
"""

import os
import base64
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

# optional import
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
    Image,
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


# completion parsing functions
def get_first_message_content(completion: ChatCompletion) -> str:
    """When we only need the content of the first message.
    It is the default parser for chat completion."""
    log.debug(f"raw completion: {completion}")
    return completion.choices[0].message.content


# A simple heuristic to estimate token count for estimating number of tokens in a Streaming response
def estimate_token_count(text: str) -> int:
    """
    Estimate the token count of a given text.

    Args:
        text (str): The text to estimate token count for.

    Returns:
        int: Estimated token count.
    """
    # Split the text into tokens using spaces as a simple heuristic
    tokens = text.split()

    # Return the number of tokens
    return len(tokens)


def parse_stream_response(completion: ChatCompletionChunk) -> str:
    """Parse the response of the stream API."""
    return completion.choices[0].delta.content


def handle_streaming_response(generator: Stream[ChatCompletionChunk]):
    """Handle the streaming response."""
    for completion in generator:
        log.debug(f"Raw chunk completion: {completion}")
        parsed_content = parse_stream_response(completion)
        yield parsed_content


def get_all_messages_content(completion: ChatCompletion) -> List[str]:
    """When the n > 1, get all the messages content."""
    return [c.message.content for c in completion.choices]


def get_probabilities(completion: ChatCompletion) -> List[List[TokenLogProb]]:
    """Get the probabilities of each token in the completion."""
    log_probs = []
    for c in completion.choices:
        content = c.logprobs.content
        print(content)
        log_probs_for_choice = []
        for openai_token_logprob in content:
            token = openai_token_logprob.token
            logprob = openai_token_logprob.logprob
            log_probs_for_choice.append(TokenLogProb(token=token, logprob=logprob))
        log_probs.append(log_probs_for_choice)
    return log_probs


class ZhipuAIClient(ModelClient):
    __doc__ = r"""A component wrapper for the ZhipuAI (智谱AI) API client.

    ZhipuAI's API is fully compatible with OpenAI's format, enabling seamless integration
    with existing OpenAI-compatible code. This client uses the OpenAI SDK with a custom
    base_url pointing to ZhipuAI's API endpoint.

    Supports both embedding and chat completion APIs.

    Users can:
    1. Simplify use of ``Embedder`` and ``Generator`` components by passing `ZhipuAIClient()` as the `model_client`.
    2. Use this as a reference to create their own API client or extend this class by copying and modifying the code.

    Note:
        We recommend avoiding `response_format` to enforce output data type or `tools` and `tool_choice` in `model_kwargs` when calling the API.
        ZhipuAI's internal formatting and added prompts are unknown. Instead:
        - Use :ref:`OutputParser<components-output_parsers>` for response parsing and formatting.

    Args:
        api_key (Optional[str], optional): ZhipuAI API key. Defaults to `None`.
        chat_completion_parser (Callable[[Completion], Any], optional): A function to parse the chat completion into a `str`. Defaults to `None`.
            The default parser is `get_first_message_content`.
        base_url (str): The API base URL to use when initializing the client.
            Defaults to `"https://open.bigmodel.cn/api/paas/v4/"`.
        env_api_key_name (str): The environment variable name for the API key. Defaults to `"ZHIPUAI_API_KEY"`.
        env_base_url_name (str): The environment variable name for the base URL. Defaults to `"ZHIPUAI_BASE_URL"`.

    References:
        - ZhipuAI API Documentation: https://open.bigmodel.cn/dev/api
        - ZhipuAI Quick Start: https://docs.bigmodel.cn/cn/guide/start/quick-start
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        chat_completion_parser: Callable[[Completion], Any] = None,
        input_type: Literal["text", "messages"] = "text",
        base_url: Optional[str] = None,
        env_base_url_name: str = "ZHIPUAI_BASE_URL",
        env_api_key_name: str = "ZHIPUAI_API_KEY",
    ):
        r"""It is recommended to set the ZHIPUAI_API_KEY environment variable instead of passing it as an argument.

        Args:
            api_key (Optional[str], optional): ZhipuAI API key. Defaults to None.
            base_url (str): The API base URL to use when initializing the client.
            env_api_key_name (str): The environment variable name for the API key. Defaults to `"ZHIPUAI_API_KEY"`.
            env_base_url_name (str): The environment variable name for the base URL. Defaults to `"ZHIPUAI_BASE_URL"`.
        """
        super().__init__()
        self._api_key = api_key
        self._env_api_key_name = env_api_key_name
        self._env_base_url_name = env_base_url_name
        
        # base_url priority: parameter > environment variable > default
        self.base_url = (
            base_url or 
            os.getenv(self._env_base_url_name) or 
            "https://open.bigmodel.cn/api/paas/v4/"
        )
        
        self.sync_client = self.init_sync_client()
        self.async_client = None  # only initialize if the async call is called
        self.chat_completion_parser = (
            chat_completion_parser or get_first_message_content
        )
        self._input_type = input_type
        self._api_kwargs = {}  # add api kwargs when the ZhipuAI Client is called

    def init_sync_client(self):
        api_key = self._api_key or os.getenv(self._env_api_key_name)
        if not api_key:
            raise ValueError(
                f"Environment variable {self._env_api_key_name} must be set"
            )
        
        # Support SSL verification control via environment variable
        # 支持通过环境变量控制SSL验证（用于代理/VPN环境）
        import httpx
        verify_ssl = os.getenv("ZHIPUAI_VERIFY_SSL", "true").lower() != "false"
        
        if not verify_ssl:
            log.warning("SSL verification disabled for ZhipuAI API (ZHIPUAI_VERIFY_SSL=false)")
            http_client = httpx.Client(verify=False)
            return OpenAI(api_key=api_key, base_url=self.base_url, http_client=http_client)
        
        return OpenAI(api_key=api_key, base_url=self.base_url)

    def init_async_client(self):
        api_key = self._api_key or os.getenv(self._env_api_key_name)
        if not api_key:
            raise ValueError(
                f"Environment variable {self._env_api_key_name} must be set"
            )
        
        # Support SSL verification control via environment variable
        import httpx
        verify_ssl = os.getenv("ZHIPUAI_VERIFY_SSL", "true").lower() != "false"
        
        if not verify_ssl:
            http_client = httpx.AsyncClient(verify=False)
            return AsyncOpenAI(api_key=api_key, base_url=self.base_url, http_client=http_client)
        
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

    def parse_embedding_response(
        self, response: CreateEmbeddingResponse
    ) -> EmbedderOutput:
        r"""Parse the embedding response to a structure Adalflow components can understand.

        Should be called in ``Embedder``.
        """
        try:
            return parse_embedding_response(response)
        except Exception as e:
            log.error(f"Error parsing the embedding response: {e}")
            return EmbedderOutput(data=[], error=str(e), raw_response=response)

    def convert_inputs_to_api_kwargs(
        self,
        input: Optional[Any] = None,
        model_kwargs: Dict = {},
        model_type: ModelType = ModelType.UNDEFINED,
    ) -> Dict:
        r"""
        Specify the API input type and output api_kwargs that will be used in _call and _acall methods.
        Convert the Component's standard input, and system_input(chat model) and model_kwargs into API-specific format.

        Args:
            input: The input text or messages to process
            model_kwargs: Additional parameters including model name
            model_type: The type of model (EMBEDDER or LLM)

        Returns:
            Dict: API-specific kwargs for the model call
        """

        final_model_kwargs = model_kwargs.copy()
        if model_type == ModelType.EMBEDDER:
            if isinstance(input, str):
                input = [input]
            # convert input to input
            if not isinstance(input, Sequence):
                raise TypeError("input must be a sequence of text")
            final_model_kwargs["input"] = input
        elif model_type == ModelType.LLM:
            # convert input to messages
            messages: List[Dict[str, str]] = []

            if self._input_type == "messages":
                system_start_tag = "<START_OF_SYSTEM_PROMPT>"
                system_end_tag = "<END_OF_SYSTEM_PROMPT>"
                user_start_tag = "<START_OF_USER_PROMPT>"
                user_end_tag = "<END_OF_USER_PROMPT>"

                # new regex pattern to ignore special characters such as \n
                pattern = (
                    rf"{system_start_tag}\s*(.*?)\s*{system_end_tag}\s*"
                    rf"{user_start_tag}\s*(.*?)\s*{user_end_tag}"
                )

                # Compile the regular expression
                # re.DOTALL is to allow . to match newline so that (.*?) does not match in a single line
                regex = re.compile(pattern, re.DOTALL)
                # Match the pattern
                match = regex.match(input)
                system_prompt, input_str = None, None

                if match:
                    system_prompt = match.group(1)
                    input_str = match.group(2)
                else:
                    print("No match found.")
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
        """
        kwargs is the combined input and model_kwargs.  Support streaming call.
        """
        log.info(f"api_kwargs: {api_kwargs}")
        self._api_kwargs = api_kwargs
        if model_type == ModelType.EMBEDDER:
            return self.sync_client.embeddings.create(**api_kwargs)
        elif model_type == ModelType.LLM:
            if "stream" in api_kwargs and api_kwargs.get("stream", False):
                log.debug("streaming call")
                self.chat_completion_parser = handle_streaming_response
                return self.sync_client.chat.completions.create(**api_kwargs)
            else:
                log.debug("non-streaming call converted to streaming")
                # Make a copy of api_kwargs to avoid modifying the original
                streaming_kwargs = api_kwargs.copy()
                streaming_kwargs["stream"] = True

                # Get streaming response
                stream_response = self.sync_client.chat.completions.create(**streaming_kwargs)

                # Accumulate all content from the stream
                accumulated_content = ""
                id = ""
                model = ""
                created = 0
                for chunk in stream_response:
                    id = getattr(chunk, "id", None) or id
                    model = getattr(chunk, "model", None) or model
                    created = getattr(chunk, "created", 0) or created
                    choices = getattr(chunk, "choices", [])
                    if len(choices) > 0:
                        delta = getattr(choices[0], "delta", None)
                        if delta is not None:
                            text = getattr(delta, "content", None)
                            if text is not None:
                                accumulated_content += text or ""
                # Return the mock completion object that will be processed by the chat_completion_parser
                return ChatCompletion(
                    id = id,
                    model=model,
                    created=created,
                    object="chat.completion",
                    choices=[Choice(
                        index=0,
                        finish_reason="stop",
                        message=ChatCompletionMessage(content=accumulated_content, role="assistant")
                    )]
                )
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
        """
        kwargs is the combined input and model_kwargs
        """
        # store the api kwargs in the client
        self._api_kwargs = api_kwargs
        if self.async_client is None:
            self.async_client = self.init_async_client()
        if model_type == ModelType.EMBEDDER:
            return await self.async_client.embeddings.create(**api_kwargs)
        elif model_type == ModelType.LLM:
            return await self.async_client.chat.completions.create(**api_kwargs)
        else:
            raise ValueError(f"model_type {model_type} is not supported")

    @classmethod
    def from_dict(cls: type[T], data: Dict[str, Any]) -> T:
        obj = super().from_dict(data)
        # recreate the existing clients
        obj.sync_client = obj.init_sync_client()
        obj.async_client = obj.init_async_client()
        return obj

    def to_dict(self) -> Dict[str, Any]:
        r"""Convert the component to a dictionary."""
        exclude = [
            "sync_client",
            "async_client",
        ]  # unserializable object
        output = super().to_dict(exclude=exclude)
        return output

