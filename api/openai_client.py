"""OpenAI ModelClient integration."""

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


# completion parsing functions and you can combine them into one singple chat completion parser
def get_first_message_content(completion: ChatCompletion) -> str:
    """
    Extracts the content of the first message from an OpenAI ChatCompletion object.

    This is often used as a default parser when only the primary response text
    from the assistant is needed.

    Args:
        completion (ChatCompletion): The ChatCompletion object returned by the
                                     OpenAI API.

    Returns:
        str: The content string of the first choice's message.
    """
    log.debug(f"raw completion: {completion}")
    return completion.choices[0].message.content


# def _get_chat_completion_usage(completion: ChatCompletion) -> OpenAICompletionUsage:
#     return completion.usage


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


def parse_stream_response(completion: ChatCompletionChunk) -> Optional[str]:
    """
    Parses a single chunk from an OpenAI chat completion stream.

    Extracts the content from the 'delta' of the first choice in the chunk.

    Args:
        completion (ChatCompletionChunk): A chunk object from the streaming API response.

    Returns:
        Optional[str]: The text content of the chunk, or None if not present.
    """
    choice = completion.choices[0] if completion.choices else None
    if choice and choice.delta:
        return choice.delta.content
    return None


def handle_streaming_response(generator: Stream[ChatCompletionChunk]) -> Generator[str, None, None]:
    """
    Handles a streaming response from OpenAI's chat completion API.

    Iterates through the generator of `ChatCompletionChunk` objects, parses
    each chunk to extract the content, and yields the content.

    Args:
        generator (Stream[ChatCompletionChunk]): An iterator yielding
                                                       `ChatCompletionChunk` objects.

    Yields:
        str: The text content from each chunk of the streaming response.
    """
    for completion_chunk in generator:
        log.debug(f"Raw chunk completion: {completion_chunk}")
        parsed_content = parse_stream_response(completion_chunk)
        if parsed_content is not None:
            yield parsed_content


def get_all_messages_content(completion: ChatCompletion) -> List[str]:
    """
    Extracts the content of all messages when `n > 1` in ChatCompletion.

    If multiple completion choices were requested (by setting `n` > 1 in the API
    call), this function collects the content from each choice's message.

    Args:
        completion (ChatCompletion): The ChatCompletion object.

    Returns:
        List[str]: A list of content strings, one for each choice.
    """
    return [c.message.content for c in completion.choices if c.message and c.message.content is not None]


def get_probabilities(completion: ChatCompletion) -> List[List[TokenLogProb]]:
    """
    Extracts token log probabilities from a ChatCompletion object.

    Iterates through each choice in the completion and then through the log
    probabilities for each token in the content of that choice.

    Args:
        completion (ChatCompletion): The ChatCompletion object, which must have
                                     logprobs enabled in the request.

    Returns:
        List[List[TokenLogProb]]: A list of lists, where each inner list contains
                                  `TokenLogProb` objects (token and its log probability)
                                  for a corresponding choice in the completion.
                                  Returns an empty list if logprobs are not available.
    """
    log_probs: List[List[TokenLogProb]] = []
    for c in completion.choices:
        if c.logprobs and c.logprobs.content:
            content = c.logprobs.content
        print(content)
        log_probs_for_choice = []
        for openai_token_logprob in content:
            token = openai_token_logprob.token
            logprob = openai_token_logprob.logprob
            log_probs_for_choice.append(TokenLogProb(token=token, logprob=logprob))
        log_probs.append(log_probs_for_choice)
    return log_probs


class OpenAIClient(ModelClient):
    """
    A component wrapper for the OpenAI API client.

    This class provides a standardized interface for interacting with OpenAI's
    APIs, including embeddings, chat completions (text generation), and image
    generation. It handles synchronous and asynchronous calls, API key management,
    input/output parsing, and error handling with backoff/retry mechanisms.

    Users can:
    1. Simplify use of ``Embedder`` and ``Generator`` components by passing `OpenAIClient()` as the `model_client`.
    2. Use this as a reference to create their own API client or extend this class by copying and modifying the code.

    Note:
        We recommend avoiding `response_format` to enforce output data type or `tools` and `tool_choice` in `model_kwargs` when calling the API.
        OpenAI's internal formatting and added prompts are unknown. Instead:
        - Use :ref:`OutputParser<components-output_parsers>` for response parsing and formatting.

        For multimodal inputs, provide images in `model_kwargs["images"]` as a path, URL, or list of them.
        The model must support vision capabilities (e.g., `gpt-4o`, `gpt-4o-mini`, `o1`, `o1-mini`).

        For image generation, use `model_type=ModelType.IMAGE_GENERATION` and provide:
        - model: `"dall-e-3"` or `"dall-e-2"`
        - prompt: Text description of the image to generate
        - size: `"1024x1024"`, `"1024x1792"`, or `"1792x1024"` for DALL-E 3; `"256x256"`, `"512x512"`, or `"1024x1024"` for DALL-E 2
        - quality: `"standard"` or `"hd"` (DALL-E 3 only)
        - n: Number of images to generate (1 for DALL-E 3, 1-10 for DALL-E 2)
        - response_format: `"url"` or `"b64_json"`

    It is recommended to set the necessary API key (e.g., `OPENAI_API_KEY`)
    as an environment variable rather than passing it directly as an argument.

    Attributes:
        sync_client (OpenAI): The synchronous OpenAI API client.
        async_client (Optional[AsyncOpenAI]): The asynchronous OpenAI API client,
            initialized on first async call.
        chat_completion_parser (Callable): A function to parse chat completion
            responses. Defaults to `get_first_message_content`.
        base_url (str): The base URL for the OpenAI API.
        _input_type (Literal["text", "messages"]): Specifies how input to LLMs
            should be formatted. "text" wraps plain string input as a user message,
            while "messages" expects a pre-formatted message structure (used with
            system prompts).
        _api_kwargs (Dict): Stores API arguments for the most recent call.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        chat_completion_parser: Optional[Callable[[Union[ChatCompletion, Stream[ChatCompletionChunk]]], Any]] = None,
        input_type: Literal["text", "messages"] = "text",
        base_url: Optional[str] = None,
        env_base_url_name: str = "OPENAI_API_BASE",
        env_api_key_name: str = "OPENAI_API_KEY",
    ):
        """
        Initializes the OpenAIClient.

        Args:
            api_key (Optional[str]): The OpenAI API key. If None, it's sourced from
                the environment variable specified by `env_api_key_name`.
                Defaults to None.
            chat_completion_parser (Optional[Callable]): A function to parse chat
                completion results. If None, `get_first_message_content` is used
                for non-streaming and `handle_streaming_response` for streaming.
                Defaults to None.
            input_type (Literal["text", "messages"]): Determines how input is
                processed for LLM calls. "text" assumes raw string input,
                "messages" expects a structured format (often including a system
                prompt). Defaults to "text".
            base_url (Optional[str]): The base URL for the OpenAI API. If None,
                it's sourced from the environment variable `env_base_url_name` or
                defaults to "https://api.openai.com/v1". Defaults to None.
            env_base_url_name (str): The name of the environment variable for the
                API base URL. Defaults to "OPENAI_API_BASE".
            env_api_key_name (str): The name of the environment variable for the
                API key. Defaults to "OPENAI_API_KEY".
        """
        super().__init__()
        self._api_key = api_key
        self._env_api_key_name = env_api_key_name
        self._env_base_url_name = env_base_url_name
        self.base_url = base_url or os.getenv(self._env_base_url_name, "https://api.openai.com/v1")
        self.sync_client = self.init_sync_client()
        self.async_client = None  # only initialize if the async call is called
        self.chat_completion_parser = (
            chat_completion_parser or get_first_message_content
        )
        self._input_type = input_type
        self._api_kwargs = {}  # add api kwargs when the OpenAI Client is called

    def init_sync_client(self) -> OpenAI:
        """
        Initializes and returns a synchronous OpenAI API client.

        Retrieves the API key from instance variable or environment.

        Returns:
            OpenAI: An instance of the synchronous OpenAI client.

        Raises:
            ValueError: If the API key is not found.
        """
        api_key = self._api_key or os.getenv(self._env_api_key_name)
        if not api_key:
            raise ValueError(
                f"Environment variable {self._env_api_key_name} must be set for OpenAIClient."
            )
        return OpenAI(api_key=api_key, base_url=self.base_url)

    def init_async_client(self) -> AsyncOpenAI:
        """
        Initializes and returns an asynchronous OpenAI API client.

        Retrieves the API key from instance variable or environment.

        Returns:
            AsyncOpenAI: An instance of the asynchronous OpenAI client.

        Raises:
            ValueError: If the API key is not found.
        """
        api_key = self._api_key or os.getenv(self._env_api_key_name)
        if not api_key:
            raise ValueError(
                f"Environment variable {self._env_api_key_name} must be set for OpenAIClient."
            )
        return AsyncOpenAI(api_key=api_key, base_url=self.base_url)

    def parse_chat_completion(
        self,
        completion: Union[ChatCompletion, Stream[ChatCompletionChunk]],
    ) -> GeneratorOutput:
        """
        Parses the raw chat completion response from the OpenAI API.

        This method uses the `self.chat_completion_parser` (which defaults to
        `get_first_message_content` for non-streaming or
        `handle_streaming_response` for streaming) to extract the primary data.
        It also attempts to track token usage.

        Args:
            completion (Union[ChatCompletion, Stream[ChatCompletionChunk]]):
                The raw response object from the OpenAI API. This can be a
                `ChatCompletion` object for non-streaming calls or a
                `Stream[ChatCompletionChunk]` for streaming calls.

        Returns:
            GeneratorOutput: An Adalflow `GeneratorOutput` object containing the
                             parsed data (or error information) and usage statistics.
                             The `raw_response` field of `GeneratorOutput` will contain
                             the parsed data string or the stream handler's output.
        """
        log.debug(f"completion: {completion}, parser: {self.chat_completion_parser}")
        parsed_data: Any
        try:
            # For streaming, chat_completion_parser is handle_streaming_response,
            # which returns a generator. For non-streaming, it's get_first_message_content.
            parsed_data = self.chat_completion_parser(completion)
        except Exception as e:
            log.error(f"Error parsing the completion: {e}", exc_info=True)
            return GeneratorOutput(data=None, error=str(e), raw_response=str(completion))

        # For streaming, parsed_data is a generator. For non-streaming, it's a string.
        # The raw_response should ideally be the string or the stream content.
        # Token usage tracking might be difficult for streams until fully consumed.
        usage: Optional[CompletionUsage] = None
        if isinstance(completion, ChatCompletion) and hasattr(completion, 'usage') and completion.usage:
            try:
                usage = self.track_completion_usage(completion)
            except Exception as e:
                log.error(f"Error tracking completion usage: {e}", exc_info=True)
                # Proceed without usage if tracking fails for some reason
        
        # If it's a stream, the actual content is in parsed_data (the generator)
        # If not streaming, parsed_data is the string content.
        return GeneratorOutput(
            data=parsed_data, # This will be the generator for streams, or string for non-streams
            error=None,
            raw_response=str(parsed_data) if not isinstance(parsed_data, Generator) else "streaming_content", # Represent stream
            usage=usage
        )


    def track_completion_usage(
        self,
        completion: ChatCompletion, # Streaming usage is harder to track accurately here
    ) -> Optional[CompletionUsage]:
        """
        Tracks token usage from a non-streaming ChatCompletion response.

        Args:
            completion (ChatCompletion): The ChatCompletion object.

        Returns:
            Optional[CompletionUsage]: A `CompletionUsage` object if usage data
                                       is available, otherwise None.
        """
        if hasattr(completion, 'usage') and completion.usage:
            try:
                usage = CompletionUsage(
                    completion_tokens=completion.usage.completion_tokens,
                    prompt_tokens=completion.usage.prompt_tokens,
                    total_tokens=completion.usage.total_tokens,
                )
                return usage
            except Exception as e:
                log.error(f"Error processing completion.usage object: {e}", exc_info=True)
        return None


    def parse_embedding_response(
        self, response: CreateEmbeddingResponse
    ) -> EmbedderOutput:
        """
        Parses the embedding API response into Adalflow's `EmbedderOutput`.

        This method should be called within an `Embedder` component that uses
        this `OpenAIClient`.

        Args:
            response (CreateEmbeddingResponse): The raw response object from
                                                OpenAI's embeddings API.
        Returns:
            EmbedderOutput: An Adalflow `EmbedderOutput` object containing the
                            embedding data or error information.
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
        For multimodal inputs, images can be provided in model_kwargs["images"] as a string path, URL, or list of them.
        The model specified in model_kwargs["model"] must support multimodal capabilities when using images.

        Args:
            input: The input text or messages to process
            model_kwargs: Additional parameters including:
                - images: Optional image source(s) as path, URL, or list of them
                - detail: Image detail level ('auto', 'low', or 'high'), defaults to 'auto'
                - model: The model to use (must support multimodal inputs if images are provided)
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
            images = final_model_kwargs.pop("images", None)
            detail = final_model_kwargs.pop("detail", "auto")

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
                    if images:
                        content = [{"type": "text", "text": input_str}]
                        if isinstance(images, (str, dict)):
                            images = [images]
                        for img in images:
                            content.append(self._prepare_image_content(img, detail))
                        messages.append({"role": "user", "content": content})
                    else:
                        messages.append({"role": "user", "content": input_str})
            if len(messages) == 0:
                if images:
                    content = [{"type": "text", "text": input}]
                    if isinstance(images, (str, dict)):
                        images = [images]
                    for img in images:
                        content.append(self._prepare_image_content(img, detail))
                    messages.append({"role": "user", "content": content})
                else:
                    messages.append({"role": "user", "content": input})
            final_model_kwargs["messages"] = messages
        elif model_type == ModelType.IMAGE_GENERATION:
            # For image generation, input is the prompt
            final_model_kwargs["prompt"] = input
            # Ensure model is specified
            if "model" not in final_model_kwargs:
                raise ValueError("model must be specified for image generation")
            # Set defaults for DALL-E 3 if not specified
            final_model_kwargs["size"] = final_model_kwargs.get("size", "1024x1024")
            final_model_kwargs["quality"] = final_model_kwargs.get(
                "quality", "standard"
            )
            final_model_kwargs["n"] = final_model_kwargs.get("n", 1)
            final_model_kwargs["response_format"] = final_model_kwargs.get(
                "response_format", "url"
            )

            # Handle image edits and variations
            image = final_model_kwargs.get("image")
            if isinstance(image, str) and os.path.isfile(image):
                final_model_kwargs["image"] = self._encode_image(image)

            mask = final_model_kwargs.get("mask")
            if isinstance(mask, str) and os.path.isfile(mask):
                final_model_kwargs["mask"] = self._encode_image(mask)
        else:
            raise ValueError(f"model_type {model_type} is not supported")

        return final_model_kwargs

    def parse_image_generation_response(self, response_data: List[Image]) -> GeneratorOutput:
        """
        Parses the response from OpenAI's image generation API.

        Extracts image URLs or Base64 encoded JSON data from the list of `Image`
        objects returned by the API.

        Args:
            response_data (List[Image]): A list of `Image` objects from the
                                         OpenAI image generation API response.

        Returns:
            GeneratorOutput: An Adalflow `GeneratorOutput` object. The `data`
                             attribute contains a list of image URLs/Base64 strings,
                             or a single URL/string if only one image was generated.
                             `raw_response` contains the string representation of the
                             original API response.
        """
        try:
            # Extract URLs or base64 data from the response
            data = [img.url or img.b64_json for img in response_data]
            # For single image responses, unwrap from list
            if len(data) == 1:
                data = data[0]
            return GeneratorOutput(
                data=data, # This will be List[str] or str
                raw_response=str(response_data), # String representation of List[Image]
            )
        except Exception as e:
            log.error(f"Error parsing image generation response: {e}", exc_info=True)
            return GeneratorOutput(data=None, error=str(e), raw_response=str(response_data))

    @backoff.on_exception(
        backoff.expo,
        (
            APITimeoutError,
            InternalServerError,
            RateLimitError,
            UnprocessableEntityError,
            BadRequestError,
        ),
        max_time=5, # Max time for backoff in seconds
    )
    def call(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED) -> Any:
        """
        Makes a synchronous call to the OpenAI API.

        This method routes the request to the appropriate OpenAI API endpoint
        (embeddings, chat completions, or image generation) based on `model_type`.
        It handles both streaming and non-streaming chat completions. For non-streaming
        chat completions, it simulates the behavior by accumulating chunks from a
        streaming call.

        Args:
            api_kwargs (Dict): A dictionary of arguments to be passed directly to the
                               OpenAI API. These are typically prepared by
                               `convert_inputs_to_api_kwargs`.
            model_type (ModelType): The type of model operation to perform
                                    (EMBEDDER, LLM, IMAGE_GENERATION).

        Returns:
            Any: The raw response from the OpenAI API. This could be:
                 - `CreateEmbeddingResponse` for embeddings.
                 - `Stream[ChatCompletionChunk]` for streaming LLM calls.
                 - `ChatCompletion` (mocked from stream) for non-streaming LLM calls.
                 - `List[Image]` for image generation calls.

        Raises:
            ValueError: If `model_type` is not supported.
            OpenAI API errors (e.g., APITimeoutError, RateLimitError) may be raised
            by the underlying `openai` library, subject to backoff/retry.
        """
        log.info(f"api_kwargs: {api_kwargs}")
        self._api_kwargs = api_kwargs # Store for potential later inspection or parsing
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
        elif model_type == ModelType.IMAGE_GENERATION:
            # Determine which image API to call based on the presence of image/mask
            if "image" in api_kwargs:
                if "mask" in api_kwargs:
                    # Image edit
                    response = self.sync_client.images.edit(**api_kwargs)
                else:
                    # Image variation
                    response = self.sync_client.images.create_variation(**api_kwargs)
            else:
                # Image generation
                response = self.sync_client.images.generate(**api_kwargs)
            return response.data
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
        max_time=5, # Max time for backoff in seconds
    )
    async def acall(
        self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED
    ) -> Any:
        """
        Makes an asynchronous call to the OpenAI API.

        Similar to `call`, this method routes requests to the appropriate API
        endpoint based on `model_type`. It initializes the asynchronous client
        (`self.async_client`) on its first invocation.

        Args:
            api_kwargs (Dict): Arguments for the OpenAI API call, prepared by
                               `convert_inputs_to_api_kwargs`.
            model_type (ModelType): The type of operation (EMBEDDER, LLM,
                                    IMAGE_GENERATION).

        Returns:
            Any: The raw asynchronous response from the OpenAI API. This could be:
                 - Coroutine resolving to `CreateEmbeddingResponse` for embeddings.
                 - AsyncGenerator (`AsyncStream[ChatCompletionChunk]`) for LLM calls
                   (OpenAI's async client returns an awaitable stream directly).
                 - Coroutine resolving to `List[Image]` for image generation calls.

        Raises:
            ValueError: If `model_type` is not supported.
            OpenAI API errors may be raised, subject to backoff/retry.
        """
        # store the api kwargs in the client
        self._api_kwargs = api_kwargs # Store for potential later inspection or parsing
        if self.async_client is None:
            self.async_client = self.init_async_client()
        if model_type == ModelType.EMBEDDER:
            return await self.async_client.embeddings.create(**api_kwargs)
        elif model_type == ModelType.LLM:
            return await self.async_client.chat.completions.create(**api_kwargs)
        elif model_type == ModelType.IMAGE_GENERATION:
            # Determine which image API to call based on the presence of image/mask
            if "image" in api_kwargs:
                if "mask" in api_kwargs:
                    # Image edit
                    response = await self.async_client.images.edit(**api_kwargs)
                else:
                    # Image variation
                    response = await self.async_client.images.create_variation(
                        **api_kwargs
                    )
            else:
                # Image generation
                response = await self.async_client.images.generate(**api_kwargs)
            return response.data
        else:
            raise ValueError(f"model_type {model_type} is not supported")

    @classmethod
    def from_dict(cls: Type[T], data: Dict[str, Any]) -> T:
        """
        Creates an `OpenAIClient` instance from a dictionary representation.

        Overrides the base `from_dict` to ensure that synchronous and asynchronous
        clients are re-initialized after object creation from the dictionary.

        Args:
            data (Dict[str, Any]): A dictionary containing the serialized state
                                   of an `OpenAIClient`.

        Returns:
            T: An instance of `OpenAIClient` (or a subclass).
        """
        obj = super().from_dict(data)
        # recreate the existing clients
        if isinstance(obj, OpenAIClient): # Ensure it's the correct type
            obj.sync_client = obj.init_sync_client()
            # Async client is typically lazy-loaded, but can be init'd here if needed
            # obj.async_client = obj.init_async_client() # Or keep it None to lazy load
        return obj

    def to_dict(self) -> Dict[str, Any]:
        """
        Serializes the `OpenAIClient` instance to a dictionary.

        Excludes non-serializable attributes like the actual client objects
        (`sync_client`, `async_client`) to prevent errors during serialization
        (e.g., with JSON). These clients will be re-initialized by `from_dict`.

        Returns:
            Dict[str, Any]: A dictionary representation of the component's state.
        """
        # TODO: not exclude but save yes or no for recreating the clients (Potentially save flags or config used to init them)
        exclude = [
            "sync_client",
            "async_client",
        ]  # unserializable object
        output = super().to_dict(exclude=exclude)
        return output

    def _encode_image(self, image_path: str) -> str:
        """
        Encodes an image file to a Base64 string.

        Args:
            image_path (str): The local file system path to the image.

        Returns:
            str: The Base64 encoded string representation of the image.

        Raises:
            ValueError: If the image file is not found, cannot be read due to
                        permission issues, or if any other error occurs during encoding.
        """
        try:
            with open(image_path, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode("utf-8")
        except FileNotFoundError:
            raise ValueError(f"Image file not found: {image_path}")
        except PermissionError:
            raise ValueError(f"Permission denied when reading image file: {image_path}")
        except Exception as e:
            raise ValueError(f"Error encoding image {image_path}: {str(e)}")

    def _prepare_image_content(
        self, image_source: Union[str, Dict[str, Any]], detail: str = "auto"
    ) -> Dict[str, Any]:
        """
        Prepares the image content structure for multimodal API requests.

        If `image_source` is a string, it's treated as either a URL (if it starts
        with "http://" or "https://") or a local file path. Local image files
        are Base64 encoded and formatted as a data URL. If `image_source` is
        already a dictionary (assumed to be correctly pre-formatted), it's
        returned as is.

        Args:
            image_source (Union[str, Dict[str, Any]]): The source of the image.
                Can be a URL string, a local file path string, or a dictionary
                already formatted for the API (e.g., `{"type": "image_url", ...}`).
            detail (str, optional): The level of detail for image processing,
                applicable if `image_source` is a URL or path.
                Can be 'auto', 'low', or 'high'. Defaults to "auto".

        Returns:
            Dict[str, Any]: A dictionary formatted for the OpenAI API's image
                            content block. For example:
                            `{"type": "image_url", "image_url": {"url": "...", "detail": "..."}}`
        """
        if isinstance(image_source, str):
            if image_source.startswith(("http://", "https://")):
                return {
                    "type": "image_url",
                    "image_url": {"url": image_source, "detail": detail},
                }
            else: # Assumed to be a local file path
                base64_image = self._encode_image(image_source)
                # Assuming JPEG, might need to determine actual image type for production
                return {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}",
                        "detail": detail,
                    },
                }
        # If image_source is already a dict, assume it's correctly formatted
        return image_source


# Example usage:
if __name__ == "__main__":
    from adalflow.core import Generator
    from adalflow.utils import setup_env

    # log = get_logger(level="DEBUG")

    setup_env()
    prompt_kwargs = {"input_str": "What is the meaning of life?"}

    gen = Generator(
        model_client=OpenAIClient(),
        model_kwargs={"model": "gpt-4o", "stream": False},
    )
    gen_response = gen(prompt_kwargs)
    print(f"gen_response: {gen_response}")

    # for genout in gen_response.data:
    #     print(f"genout: {genout}")

    # test that to_dict and from_dict works
    # model_client = OpenAIClient()
    # model_client_dict = model_client.to_dict()
    # from_dict_model_client = OpenAIClient.from_dict(model_client_dict)
    # assert model_client_dict == from_dict_model_client.to_dict()


if __name__ == "__main__":
    import adalflow as adal

    # setup env or pass the api_key
    from adalflow.utils import setup_env

    setup_env()

    openai_llm = adal.Generator(
        model_client=OpenAIClient(), model_kwargs={"model": "gpt-4o"}
    )
    resopnse = openai_llm(prompt_kwargs={"input_str": "What is LLM?"})
    print(resopnse)
