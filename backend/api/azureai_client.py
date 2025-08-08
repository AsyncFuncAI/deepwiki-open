"""AzureOpenAI ModelClient integration."""

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

# optional import
from adalflow.utils.lazy_import import safe_import, OptionalPackages

import sys

openai = safe_import(OptionalPackages.OPENAI.value[0], OptionalPackages.OPENAI.value[1])
# Importing all Azure packages together
azure_modules = safe_import(
    OptionalPackages.AZURE.value[0],  # List of package names
    OptionalPackages.AZURE.value[1],  # Error message
)
# Manually add each module to sys.modules to make them available globally as if imported normally
azure_module_names = OptionalPackages.AZURE.value[0]
for name, module in zip(azure_module_names, azure_modules):
    sys.modules[name] = module

# Use the modules as if they were imported normally
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

# from azure.core.credentials import AccessToken
from openai import AzureOpenAI, AsyncAzureOpenAI, Stream
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
from openai.types.chat import ChatCompletionChunk, ChatCompletion

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


__all__ = ["AzureAIClient"]

# TODO: this overlaps with openai client largely, might need to refactor to subclass openai client to simplify the code


# completion parsing functions and you can combine them into one singple chat completion parser
def get_first_message_content(completion: ChatCompletion) -> str:
    r"""When we only need the content of the first message.
    It is the default parser for chat completion."""
    return completion.choices[0].message.content


# def _get_chat_completion_usage(completion: ChatCompletion) -> OpenAICompletionUsage:
#     return completion.usage


def parse_stream_response(completion: ChatCompletionChunk) -> str:
    r"""Parse the response of the stream API."""
    return completion.choices[0].delta.content


def handle_streaming_response(generator: Stream[ChatCompletionChunk]):
    r"""Handle the streaming response."""
    for completion in generator:
        log.debug(f"Raw chunk completion: {completion}")
        parsed_content = parse_stream_response(completion)
        yield parsed_content


def get_all_messages_content(completion: ChatCompletion) -> List[str]:
    r"""When the n > 1, get all the messages content."""
    return [c.message.content for c in completion.choices]


def get_probabilities(completion: ChatCompletion) -> List[List[TokenLogProb]]:
    r"""Get the probabilities of each token in the completion."""
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


class AzureAIClient(ModelClient):
    __doc__ = r"""
    A client wrapper for interacting with Azure OpenAI's API.

    This class provides support for both embedding and chat completion API calls.
    Users can use this class to simplify their interactions with Azure OpenAI models
    through the `Embedder` and `Generator` components.

    **Initialization:**

    You can initialize the `AzureAIClient` with either an API key or Azure Active Directory (AAD) token
    authentication. It is recommended to set environment variables for sensitive data like API keys.

    Args:
        api_key (Optional[str]): Azure OpenAI API key. Default is None.
        api_version (Optional[str]): API version to use. Default is None.
        azure_endpoint (Optional[str]): Azure OpenAI endpoint URL. Default is None.
        credential (Optional[DefaultAzureCredential]): Azure AD credential for token-based authentication. Default is None.
        chat_completion_parser (Callable[[Completion], Any]): Function to parse chat completions. Default is `get_first_message_content`.
        input_type (Literal["text", "messages"]): Format for input, either "text" or "messages". Default is "text".

    **Setup Instructions:**

    - **Using API Key:**
      Set up the following environment variables:
      ```bash
      export AZURE_OPENAI_API_KEY="your_api_key"
      export AZURE_OPENAI_ENDPOINT="your_endpoint"
      export AZURE_OPENAI_VERSION="your_version"
      ```

    - **Using Azure AD Token:**
      Ensure you have configured Azure AD credentials. The `DefaultAzureCredential` will automatically use your configured credentials.

    **Example Usage:**

    .. code-block:: python

        from azure.identity import DefaultAzureCredential
        from your_module import AzureAIClient  # Adjust import based on your module name

        # Initialize with API key
        client = AzureAIClient(
            api_key="your_api_key",
            api_version="2023-05-15",
            azure_endpoint="https://your-endpoint.openai.azure.com/"
        )

        # Or initialize with Azure AD token
        client = AzureAIClient(
            api_version="2023-05-15",
            azure_endpoint="https://your-endpoint.openai.azure.com/",
            credential=DefaultAzureCredential()
        )

        # Example call to the chat completion API
        api_kwargs = {
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "user", "content": "What is the meaning of life?"}],
            "stream": True
        }
        response = client.call(api_kwargs=api_kwargs, model_type=ModelType.LLM)

        for chunk in response:
            print(chunk)


    **Notes:**
    - Ensure that the API key or credentials are correctly set up and accessible to avoid authentication errors.
    - Use `chat_completion_parser` to define how to extract and handle the chat completion responses.
    - The `input_type` parameter determines how input is formatted for the API call.

    **References:**
    - [Azure OpenAI API Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/overview)
    - [OpenAI API Documentation](https://platform.openai.com/docs/guides/text-generation)
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_version: Optional[str] = None,
        azure_endpoint: Optional[str] = None,
        credential: Optional[DefaultAzureCredential] = None,
        chat_completion_parser: Callable[[Completion], Any] = None,
        input_type: Literal["text", "messages"] = "text",
    ):
        r"""It is recommended to set the API_KEY into the  environment variable instead of passing it as an argument.


        Initializes the Azure OpenAI client with either API key or AAD token authentication.

        Args:
            api_key: Azure OpenAI API key.
            api_version: Azure OpenAI API version.
            azure_endpoint: Azure OpenAI endpoint.
            credential: Azure AD credential for token-based authentication.
            chat_completion_parser: Function to parse chat completions.
            input_type: Input format, either "text" or "messages".

        """
        super().__init__()

        # added api_type azure for azure Ai
        self.api_type = "azure"
        self._api_key = api_key
        self._apiversion = api_version
        self._azure_endpoint = azure_endpoint
        self._credential = credential
        self.sync_client = self.init_sync_client()
        self.async_client = None  # only initialize if the async call is called
        self.chat_completion_parser = (
            chat_completion_parser or get_first_message_content
        )
        self._input_type = input_type

    def init_sync_client(self):
        api_key = self._api_key or os.getenv("AZURE_OPENAI_API_KEY")
        azure_endpoint = self._azure_endpoint or os.getenv("AZURE_OPENAI_ENDPOINT")
        api_version = self._apiversion or os.getenv("AZURE_OPENAI_VERSION")
        # credential = self._credential or DefaultAzureCredential
        if not azure_endpoint:
            raise ValueError("Environment variable AZURE_OPENAI_ENDPOINT must be set")
        if not api_version:
            raise ValueError("Environment variable AZURE_OPENAI_VERSION must be set")

        if api_key:
            return AzureOpenAI(
                api_key=api_key, azure_endpoint=azure_endpoint, api_version=api_version
            )
        elif self._credential:
            # credential = DefaultAzureCredential()
            token_provider = get_bearer_token_provider(
                DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
            )
            return AzureOpenAI(
                azure_ad_token_provider=token_provider,
                azure_endpoint=azure_endpoint,
                api_version=api_version,
            )
        else:
            raise ValueError(
                "Environment variable AZURE_OPENAI_API_KEY must be set or credential must be provided"
            )

    def init_async_client(self):
        api_key = self._api_key or os.getenv("AZURE_OPENAI_API_KEY")
        azure_endpoint = self._azure_endpoint or os.getenv("AZURE_OPENAI_ENDPOINT")
        api_version = self._apiversion or os.getenv("AZURE_OPENAI_VERSION")
        # credential = self._credential or DefaultAzureCredential()
        if not azure_endpoint:
            raise ValueError("Environment variable AZURE_OPENAI_ENDPOINT must be set")
        if not api_version:
            raise ValueError("Environment variable AZURE_OPENAI_VERSION must be set")

        if api_key:
            return AsyncAzureOpenAI(
                api_key=api_key, azure_endpoint=azure_endpoint, api_version=api_version
            )
        elif self._credential:
            # credential = DefaultAzureCredential()
            token_provider = get_bearer_token_provider(
                DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"
            )
            return AsyncAzureOpenAI(
                azure_ad_token_provider=token_provider,
                azure_endpoint=azure_endpoint,
                api_version=api_version,
            )
        else:
            raise ValueError(
                "Environment variable AZURE_OPENAI_API_KEY must be set or credential must be provided"
            )

    # def _parse_chat_completion(self, completion: ChatCompletion) -> "GeneratorOutput":
    #     # TODO: raw output it is better to save the whole completion as a source of truth instead of just the message
    #     try:
    #         data = self.chat_completion_parser(completion)
    #         usage = self.track_completion_usage(completion)
    #         return GeneratorOutput(
    #             data=data, error=None, raw_response=str(data), usage=usage
    #         )
    #     except Exception as e:
    #         log.error(f"Error parsing the completion: {e}")
    #         return GeneratorOutput(data=None, error=str(e), raw_response=completion)

    def parse_chat_completion(
        self,
        completion: Union[ChatCompletion, Generator[ChatCompletionChunk, None, None]],
    ) -> "GeneratorOutput":
        """Parse the completion, and put it into the raw_response."""
        log.debug(f"completion: {completion}, parser: {self.chat_completion_parser}")
        try:
            data = self.chat_completion_parser(completion)
            usage = self.track_completion_usage(completion)
            return GeneratorOutput(
                data=None, error=None, raw_response=data, usage=usage
            )
        except Exception as e:
            log.error(f"Error parsing the completion: {e}")
            return GeneratorOutput(data=None, error=str(e), raw_response=completion)

    def track_completion_usage(
        self,
        completion: Union[ChatCompletion, Generator[ChatCompletionChunk, None, None]],
    ) -> CompletionUsage:
        if isinstance(completion, ChatCompletion):
            usage: CompletionUsage = CompletionUsage(
                completion_tokens=completion.usage.completion_tokens,
                prompt_tokens=completion.usage.prompt_tokens,
                total_tokens=completion.usage.total_tokens,
            )
            return usage
        else:
            raise NotImplementedError(
                "streaming completion usage tracking is not implemented"
            )

    def parse_embedding_response(
        self, response: CreateEmbeddingResponse
    ) -> EmbedderOutput:
        r"""Parse the embedding response to a structure AdalFlow components can understand.

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
        Convert the Component's standard input, and system_input(chat model) and model_kwargs into API-specific format
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
                pattern = f"{system_start_tag}(.*?){system_end_tag}{user_start_tag}(.*?){user_end_tag}"
                # Compile the regular expression
                regex = re.compile(pattern)
                # Match the pattern
                match = regex.search(input)
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
                messages.append({"role": "system", "content": input})
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
        if model_type == ModelType.EMBEDDER:
            return self.sync_client.embeddings.create(**api_kwargs)
        elif model_type == ModelType.LLM:
            if "stream" in api_kwargs and api_kwargs.get("stream", False):
                log.debug("streaming call")
                self.chat_completion_parser = handle_streaming_response
                return self.sync_client.chat.completions.create(**api_kwargs)
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
        """
        kwargs is the combined input and model_kwargs
        """
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
        # TODO: not exclude but save yes or no for recreating the clients
        exclude = [
            "sync_client",
            "async_client",
        ]  # unserializable object
        output = super().to_dict(exclude=exclude)
        return output


# if __name__ == "__main__":
#     from adalflow.core import Generator
#     from adalflow.utils import setup_env, get_logger

#     log = get_logger(level="DEBUG")

#     setup_env()
#     prompt_kwargs = {"input_str": "What is the meaning of life?"}

#     gen = Generator(
#         model_client=OpenAIClient(),
#         model_kwargs={"model": "gpt-3.5-turbo", "stream": True},
#     )
#     gen_response = gen(prompt_kwargs)
#     print(f"gen_response: {gen_response}")

#     for genout in gen_response.data:
#         print(f"genout: {genout}")