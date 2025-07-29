"""AzureOpenAI ModelClient integration."""

import os
import time
import re
import asyncio
import pickle
from copy import deepcopy
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

import logging
import backoff
from tqdm import tqdm

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
    Document,
    BatchEmbedderInputType,
    BatchEmbedderOutputType,
)
from adalflow.core.component import Component as DataComponent
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


def parse_azure_rate_limit_error(error_message: str) -> Optional[int]:
    """
    Parse Azure OpenAI rate limit error message to extract retry delay.
    
    Args:
        error_message: The error message from Azure OpenAI
        
    Returns:
        int: Number of seconds to wait, or None if not a rate limit error
    """
    # Pattern for "Please retry after X seconds"
    retry_pattern = r"Please retry after (\d+) seconds"
    match = re.search(retry_pattern, error_message)
    if match:
        return int(match.group(1))
    return None


def azure_openai_retry_with_delay(func):
    """
    Decorator to handle Azure OpenAI rate limiting with intelligent delays.
    
    This decorator:
    1. Catches RateLimitError exceptions
    2. Parses the error message to extract the required delay
    3. Waits the specified time before retrying
    4. Falls back to exponential backoff for other errors
    """
    def wrapper(*args, **kwargs):
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                return func(*args, **kwargs)
            except RateLimitError as e:
                retry_count += 1
                error_message = str(e)
                
                # Try to parse the required delay from error message
                retry_delay = parse_azure_rate_limit_error(error_message)
                
                if retry_delay is not None and retry_count < max_retries:
                    log.warning(f"Azure OpenAI rate limit hit. "
                                f"Waiting {retry_delay} seconds before retry "
                                f"({retry_count}/{max_retries})")
                    time.sleep(retry_delay)
                    continue
                else:
                    # If we can't parse delay or max retries reached, re-raise
                    if retry_count >= max_retries:
                        log.error(f"Max retries ({max_retries}) reached "
                                  f"for rate limit error")
                    else:
                        log.warning("Could not parse retry delay from "
                                    "error message")
                    raise
            except (APITimeoutError, InternalServerError,
                    UnprocessableEntityError, BadRequestError) as e:
                # For other errors, use simple exponential backoff
                if retry_count < max_retries - 1:
                    retry_count += 1
                    delay = 2 ** retry_count
                    log.warning(f"API error: {type(e).__name__}. "
                                f"Retrying in {delay} seconds "
                                f"({retry_count}/{max_retries})")
                    time.sleep(delay)
                    continue
                else:
                    raise
        
        # This should not be reached, but just in case
        return func(*args, **kwargs)
    
    return wrapper


def azure_openai_async_retry_with_delay(func):
    """
    Async version of the Azure OpenAI retry decorator.
    """
    async def wrapper(*args, **kwargs):
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                return await func(*args, **kwargs)
            except RateLimitError as e:
                retry_count += 1
                error_message = str(e)
                
                # Try to parse the required delay from error message
                retry_delay = parse_azure_rate_limit_error(error_message)
                
                if retry_delay is not None and retry_count < max_retries:
                    log.warning(f"Azure OpenAI rate limit hit. "
                                f"Waiting {retry_delay} seconds before retry "
                                f"({retry_count}/{max_retries})")
                    await asyncio.sleep(retry_delay)
                    continue
                else:
                    # If we can't parse delay or max retries reached, re-raise
                    if retry_count >= max_retries:
                        log.error(f"Max retries ({max_retries}) reached "
                                  f"for rate limit error")
                    else:
                        log.warning("Could not parse retry delay from "
                                    "error message")
                    raise
            except (APITimeoutError, InternalServerError,
                    UnprocessableEntityError, BadRequestError) as e:
                # For other errors, use simple exponential backoff
                if retry_count < max_retries - 1:
                    retry_count += 1
                    delay = 2 ** retry_count
                    log.warning(f"API error: {type(e).__name__}. "
                                f"Retrying in {delay} seconds "
                                f"({retry_count}/{max_retries})")
                    await asyncio.sleep(delay)
                    continue
                else:
                    raise
        
        # This should not be reached, but just in case
        return await func(*args, **kwargs)
    
    return wrapper


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

    @azure_openai_retry_with_delay
    def call(self, api_kwargs: Dict = {},
             model_type: ModelType = ModelType.UNDEFINED):
        """
        kwargs is the combined input and model_kwargs.  Support streaming call.
        """
        # Safely log api_kwargs without special characters that cause encoding
        try:
            safe_kwargs = {}
            for k, v in api_kwargs.items():
                if k == 'input':
                    if isinstance(v, list):
                        safe_kwargs[k] = f"[{len(v)} texts]"
                    else:
                        str_v = str(v)
                        if len(str_v) > 100:
                            safe_kwargs[k] = str_v[:100] + "..."
                        else:
                            safe_kwargs[k] = v
                else:
                    safe_kwargs[k] = v
            log.info(f"api_kwargs: {safe_kwargs}")
        except Exception as e:
            log.info(f"api_kwargs logging failed: {str(e)}")
        
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

    @azure_openai_async_retry_with_delay
    async def acall(
        self, api_kwargs: Dict = {},
        model_type: ModelType = ModelType.UNDEFINED
    ):
        """
        kwargs is the combined input and model_kwargs
        """
        if self.async_client is None:
            self.async_client = self.init_async_client()
        if model_type == ModelType.EMBEDDER:
            return await self.async_client.embeddings.create(**api_kwargs)
        elif model_type == ModelType.LLM:
            return await self.async_client.chat.completions.create(
                **api_kwargs
            )
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


class AzureBatchEmbedder(DataComponent):
    """Batch embedder specifically designed for Azure OpenAI API with intelligent rate limiting"""

    def __init__(self, embedder, batch_size: int = 100, embedding_cache_file_name: str = "default") -> None:
        super().__init__(batch_size=batch_size)
        self.embedder = embedder
        self.batch_size = batch_size
        # Reduce batch size for Azure OpenAI to avoid rate limiting
        if self.batch_size > 100:
            log.warning(f"Azure batch embedder initialization, batch size: {self.batch_size}, "
                       f"reducing to 100 for better rate limit handling")
            self.batch_size = 100
        self.cache_path = f'./embedding_cache/{embedding_cache_file_name}_{self.embedder.__class__.__name__}_azure_embeddings.pkl'

    def call(
        self, input: BatchEmbedderInputType, model_kwargs: Optional[Dict] = {}, force_recreate: bool = False
    ) -> BatchEmbedderOutputType:
        """
        Batch call to Azure OpenAI embedder with rate limiting

        Args:
            input: List of input texts
            model_kwargs: Model parameters
            force_recreate: Whether to force recreation

        Returns:
            Batch embedding output
        """
        # Check cache first
        if not force_recreate and os.path.exists(self.cache_path):
            try:
                with open(self.cache_path, 'rb') as f:
                    embeddings = pickle.load(f)
                    log.info(f"Loaded cached Azure embeddings from: {self.cache_path}")
                return embeddings
            except Exception as e:
                log.warning(f"Failed to load cache file {self.cache_path}: {e}, proceeding with fresh embedding")

        if isinstance(input, str):
            input = [input]

        n = len(input)
        embeddings: List[EmbedderOutput] = []

        log.info(f"Starting Azure batch embedding processing, total {n} texts, batch size: {self.batch_size}")

        for i in tqdm(
            range(0, n, self.batch_size),
            desc="Azure batch embedding",
            disable=False,
        ):
            batch_input = input[i : min(i + self.batch_size, n)]

            try:
                # Add small delay between batches to help with rate limiting
                if i > 0:
                    time.sleep(0.5)  # 500ms delay between batches
                
                batch_output = self.embedder(
                    input=batch_input, model_kwargs=model_kwargs
                )
                embeddings.append(batch_output)

                # Validate batch output
                if batch_output.error:
                    log.error(f"Batch {i//self.batch_size + 1} embedding failed: {batch_output.error}")
                elif batch_output.data:
                    log.debug(f"Batch {i//self.batch_size + 1} successfully generated {len(batch_output.data)} embedding vectors")
                else:
                    log.warning(f"Batch {i//self.batch_size + 1} returned no embedding data")

            except Exception as e:
                log.error(f"Batch {i//self.batch_size + 1} processing exception: {e}")
                # Create error embedding output
                error_output = EmbedderOutput(
                    data=[],
                    error=str(e),
                    raw_response=None
                )
                embeddings.append(error_output)

        log.info(f"Azure batch embedding completed, processed {len(embeddings)} batches")

        # Save to cache
        try:
            if not os.path.exists('./embedding_cache'):
                os.makedirs('./embedding_cache')
            with open(self.cache_path, 'wb') as f:
                pickle.dump(embeddings, f)
                log.info(f"Saved Azure embeddings cache to: {self.cache_path}")
        except Exception as e:
            log.warning(f"Failed to save cache to {self.cache_path}: {e}")

        return embeddings


class AzureToEmbeddings(DataComponent):
    """Component that converts document sequences to embedding vector sequences, specifically optimized for Azure OpenAI API"""

    def __init__(self, embedder, batch_size: int = 100, force_recreate_db: bool = False, embedding_cache_file_name: str = "default") -> None:
        super().__init__(batch_size=batch_size)
        self.embedder = embedder
        self.batch_size = batch_size
        self.batch_embedder = AzureBatchEmbedder(embedder=embedder, batch_size=batch_size, embedding_cache_file_name=embedding_cache_file_name)
        self.force_recreate_db = force_recreate_db

    def __call__(self, input: List[Document]) -> List[Document]:
        """
        Process list of documents, generating embedding vectors for each document

        Args:
            input: List of input documents

        Returns:
            List of documents containing embedding vectors
        """
        output = deepcopy(input)

        # Convert to text list
        embedder_input: List[str] = [chunk.text for chunk in output]

        log.info(f"Starting to process embeddings for {len(embedder_input)} documents using Azure OpenAI")

        # Batch process embeddings
        outputs: List[EmbedderOutput] = self.batch_embedder(
            input=embedder_input,
            force_recreate=self.force_recreate_db
        )

        # Validate output
        total_embeddings = 0
        error_batches = 0

        for batch_output in outputs:
            if batch_output.error:
                error_batches += 1
                log.error(f"Found error batch: {batch_output.error}")
            elif batch_output.data:
                total_embeddings += len(batch_output.data)

        log.info(f"Embedding statistics: total {total_embeddings} valid embeddings, {error_batches} error batches")

        # Assign embedding vectors back to documents
        doc_idx = 0
        for batch_idx, batch_output in tqdm(
            enumerate(outputs),
            desc="Assigning embedding vectors to documents",
            disable=False
        ):
            if batch_output.error:
                # Create empty vectors for documents in error batches
                batch_size_actual = min(self.batch_size, len(output) - doc_idx)
                log.warning(f"Creating empty vectors for {batch_size_actual} documents in batch {batch_idx}")

                for i in range(batch_size_actual):
                    if doc_idx < len(output):
                        output[doc_idx].vector = []
                        doc_idx += 1
            else:
                # Assign normal embedding vectors
                for embedding in batch_output.data:
                    if doc_idx < len(output):
                        if hasattr(embedding, 'embedding'):
                            output[doc_idx].vector = embedding.embedding
                        else:
                            log.warning(f"Invalid embedding format for document {doc_idx}")
                            output[doc_idx].vector = []
                        doc_idx += 1

        # Validate results
        valid_count = 0
        empty_count = 0

        for doc in output:
            if hasattr(doc, 'vector') and doc.vector and len(doc.vector) > 0:
                valid_count += 1
            else:
                empty_count += 1

        log.info(f"Embedding results: {valid_count} valid vectors, {empty_count} empty vectors")

        if valid_count == 0:
            log.error("❌ All documents have empty embedding vectors!")
        elif empty_count > 0:
            log.warning(f"⚠️ Found {empty_count} empty embedding vectors")
        else:
            log.info("✅ All documents successfully generated embedding vectors")

        return output

    def _extra_repr(self) -> str:
        return f"batch_size={self.batch_size}"


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
