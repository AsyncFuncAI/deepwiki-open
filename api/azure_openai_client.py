"""Azure OpenAI ModelClient integration."""

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
from azure.core.credentials import AzureKeyCredential

# Import OpenAI modules directly
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
    Image,
)
from openai.types.chat import ChatCompletionChunk, ChatCompletion, ChatCompletionMessage
from openai.types.chat.chat_completion import Choice

from adalflow.core.model_client import ModelClient
from adalflow.core.types import (
    ModelType,
    EmbedderOutput,
    TokenLogProb,
    CompletionUsage,
    GeneratorOutput,
)
from adalflow.components.model_client.utils import parse_embedding_response

# Import OpenAI client functions for reuse
from api.openai_client import (
    get_first_message_content,
    estimate_token_count,
    parse_stream_response,
    handle_streaming_response,
    get_all_messages_content,
    get_probabilities,
)

log = logging.getLogger(__name__)
T = TypeVar("T")


class AzureOpenAIClient(ModelClient):
    """A component wrapper for the Azure OpenAI API client.

    Supports both embedding and chat completion APIs, including multimodal capabilities.

    Users can:
    1. Simplify use of ``Embedder`` and ``Generator`` components by passing `AzureOpenAIClient()` as the `model_client`.
    2. Use this as a reference to create their own API client or extend this class by copying and modifying the code.

    Note:
        We recommend avoiding `response_format` to enforce output data type or `tools` and `tool_choice` in `model_kwargs` when calling the API.
        OpenAI's internal formatting and added prompts are unknown. Instead:
        - Use :ref:`OutputParser<components-output_parsers>` for response parsing and formatting.

        For multimodal inputs, provide images in `model_kwargs["images"]` as a path, URL, or list of them.
        The model must support vision capabilities (e.g., `gpt-4o`, `gpt-4-vision`).

    Args:
        api_key (Optional[str], optional): Azure OpenAI API key. Defaults to `None`.
        api_version (str, optional): Azure OpenAI API version. Defaults to `"2024-02-01"`.
        chat_completion_parser (Callable[[Completion], Any], optional): A function to parse the chat completion into a `str`. Defaults to `None`.
            The default parser is `get_first_message_content`.
        base_url (str): The API base URL to use when initializing the client.
        env_api_key_name (str): The environment variable name for the API key. Defaults to `"AZURE_OPENAI_API_KEY"`.
        env_base_url_name (str): The environment variable name for the base URL. Defaults to `"AZURE_OPENAI_API_BASE"`.

    References:
        - Azure OpenAI API Overview: https://learn.microsoft.com/en-us/azure/ai-services/openai/
        - Embeddings Guide: https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/understand-embeddings
        - Chat Completion Models: https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models
    """

    def __init__(
            self,
            api_key: Optional[str] = None,
            api_version: str = "2024-12-01-preview",  # Updated to latest API version
            chat_completion_parser: Callable[[Completion], Any] = None,
            input_type: Literal["text", "messages"] = "text",
            base_url: Optional[str] = None,
            env_base_url_name: str = "AZURE_OPENAI_ENDPOINT",
            env_api_key_name: str = "AZURE_OPENAI_API_KEY",
            model_api_versions: Optional[Dict[str, str]] = None,
        ):
        """It is recommended to set the AZURE_OPENAI_API_KEY environment variable instead of passing it as an argument.

        Args:
            api_key (Optional[str], optional): Azure OpenAI API key. Defaults to None.
            api_version (str, optional): Azure OpenAI API version. Defaults to "2024-02-01".
            base_url (str): The API base URL to use when initializing the client.
            env_api_key_name (str): The environment variable name for the API key. Defaults to `"AZURE_OPENAI_API_KEY"`.
            env_base_url_name (str): The environment variable name for the base URL. Defaults to `"AZURE_OPENAI_API_BASE"`.
        """
        super().__init__()
        self._api_key = api_key
        self._api_version = api_version
        self._env_api_key_name = env_api_key_name
        self._env_base_url_name = env_base_url_name
        self.base_url = base_url or os.getenv(self._env_base_url_name)
        
        # Store model-specific API versions
        self._model_api_versions = model_api_versions or {}
        
        self.sync_client = self.init_sync_client()
        self.async_client = None  # only initialize if the async call is called
        self.chat_completion_parser = (
            chat_completion_parser or get_first_message_content
        )
        self._input_type = input_type
        self._api_kwargs = {}  # add api kwargs when the Azure OpenAI Client is called

    def init_sync_client(self):
        """Initialize the synchronous Azure OpenAI client."""
        api_key = self._api_key or os.getenv(self._env_api_key_name)
        if not api_key:
            raise ValueError(
                f"API key must be provided either as an argument or as an environment variable {self._env_api_key_name}"
            )
        if not self.base_url:
            raise ValueError(
                f"Base URL must be provided either as an argument or as an environment variable {self._env_base_url_name}"
            )
        
        # Use the Azure OpenAI client format compatible with the installed version
        return AzureOpenAI(
            api_key=api_key,
            api_version=self._api_version,
            azure_endpoint=self.base_url
        )

    def init_async_client(self):
        """Initialize the asynchronous Azure OpenAI client."""
        api_key = self._api_key or os.getenv(self._env_api_key_name)
        if not api_key:
            raise ValueError(
                f"API key must be provided either as an argument or as an environment variable {self._env_api_key_name}"
            )
        if not self.base_url:
            raise ValueError(
                f"Base URL must be provided either as an argument or as an environment variable {self._env_base_url_name}"
            )
        
        # Use the Azure OpenAI client format compatible with the installed version
        return AsyncAzureOpenAI(
            api_key=api_key,
            api_version=self._api_version,
            azure_endpoint=self.base_url
        )

    def parse_chat_completion(
            self,
            completion: Union[ChatCompletion, Generator[ChatCompletionChunk, None, None]],
        ):
        """Parse the completion, and put it into the raw_response."""
        if isinstance(completion, Generator):
            # Handle streaming response
            text = ""
            for chunk in completion:
                content = parse_stream_response(chunk)
                if content is not None:
                    text += content
            return text
        else:
            # Handle non-streaming response
            return self.chat_completion_parser(completion)

    def track_completion_usage(
            self,
            completion: Union[ChatCompletion, Generator[ChatCompletionChunk, None, None]],
        ):
        """Track the completion usage."""
        if isinstance(completion, Generator):
            # For streaming responses, we can't get the usage directly
            # We'll estimate it based on the response
            text = ""
            for chunk in completion:
                content = parse_stream_response(chunk)
                if content is not None:
                    text += content
            return CompletionUsage(
                prompt_tokens=0,  # We don't know
                completion_tokens=estimate_token_count(text),
                total_tokens=0,  # We don't know
            )
        else:
            # For non-streaming responses, we can get the usage directly
            return CompletionUsage(
                prompt_tokens=completion.usage.prompt_tokens,
                completion_tokens=completion.usage.completion_tokens,
                total_tokens=completion.usage.total_tokens,
            )

    def parse_embedding_response(
            self, response: CreateEmbeddingResponse
        ) -> EmbedderOutput:
        """Parse the embedding response to a structure Adalflow components can understand.

        Should be called in ``Embedder``.
        """
        return parse_embedding_response(response)

    def convert_inputs_to_api_kwargs(
            self,
            input: Optional[Any] = None,
            model_kwargs: Dict = {},
            model_type: ModelType = ModelType.UNDEFINED,
        ) -> Dict:
        """
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
        api_kwargs = model_kwargs.copy()

        # Handle different model types
        if model_type == ModelType.EMBEDDER:
            if isinstance(input, list):
                api_kwargs["input"] = input
            else:
                api_kwargs["input"] = [input]
            
            # Azure OpenAI requires a deployment_id instead of model
            if "model" in api_kwargs:
                api_kwargs["deployment_id"] = api_kwargs.pop("model")
            
            return api_kwargs
        
        elif model_type == ModelType.LLM:
            # Azure OpenAI requires a deployment_id instead of model
            if "model" in api_kwargs:
                api_kwargs["deployment_id"] = api_kwargs.pop("model")
            
            # Handle multimodal inputs (images)
            images = api_kwargs.pop("images", None)
            detail = api_kwargs.pop("detail", "auto")
            
            if self._input_type == "text" and input is not None:
                # Convert text input to messages format
                if images:
                    # For multimodal, we need to format with content list
                    content = [{"type": "text", "text": input}]
                    
                    # Process images
                    if isinstance(images, str):
                        images = [images]
                    
                    for img in images:
                        img_content = self._prepare_image_content(img, detail)
                        content.append(img_content)
                    
                    api_kwargs["messages"] = [{"role": "user", "content": content}]
                else:
                    # For text-only, we can use simple format
                    api_kwargs["messages"] = [{"role": "user", "content": input}]
            
            elif self._input_type == "messages" and input is not None:
                # Input is already in messages format
                api_kwargs["messages"] = input
            
            return api_kwargs
        
        # For other model types, just pass through the kwargs
        return api_kwargs

    def call(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        """
        kwargs is the combined input and model_kwargs. Support streaming call.
        """
        self._api_kwargs = api_kwargs.copy()
        
        # Check if we need to use a model-specific API version
        deployment_id = api_kwargs.get("deployment_id")
        if deployment_id and deployment_id in self._model_api_versions:
            # Create a new client with the model-specific API version
            api_key = self._api_key or os.getenv(self._env_api_key_name)
            model_specific_client = AzureOpenAI(
                api_key=api_key,
                api_version=self._model_api_versions[deployment_id],
                azure_endpoint=self.base_url,
            )
            log.info(f"Using model-specific API version {self._model_api_versions[deployment_id]} for model {deployment_id}")
            client = model_specific_client
        else:
            # Use the default client
            client = self.sync_client
        
        # Handle different model types
        if model_type == ModelType.EMBEDDER:
            # Prepare the embeddings API call
            embedding_api_kwargs = api_kwargs.copy()
            
            # Handle model parameter for Azure OpenAI
            # The installed version doesn't support deployment_id, so we need to use model
            deployment_id = embedding_api_kwargs.pop('deployment_id', None)
            if deployment_id and not embedding_api_kwargs.get('model'):
                # Use deployment_id as the model name
                embedding_api_kwargs['model'] = deployment_id
                log.info(f"Using deployment_id {deployment_id} as model for embeddings")
                
            # Ensure we have a model parameter
            model = embedding_api_kwargs.get('model')
            if not model:
                model = "text-embedding-ada-002"  # Default model
                embedding_api_kwargs['model'] = model
                log.info(f"Using default model {model} for embeddings")
                
            # Remove dimensions parameter if it exists - not supported by text-embedding-ada-002
            if 'dimensions' in embedding_api_kwargs:
                dimensions = embedding_api_kwargs.pop('dimensions')
                log.info(f"Removed dimensions parameter ({dimensions}) as it's not supported by {model}")
            
            # Ensure we're using the correct API version for text-embedding-3 models
            if model and ('text-embedding-3' in model):
                # Create a client with the correct API version for text-embedding-3 models
                api_key = self._api_key or os.getenv(self._env_api_key_name)
                embedding_client = AzureOpenAI(
                    api_key=api_key,
                    api_version="2024-02-01",  # API version compatible with text-embedding-3 models
                    azure_endpoint=self.base_url
                )
                log.info(f"Using API version 2024-02-01 for {model} embeddings")
                # Call the embeddings API with the specialized client
                response = embedding_client.embeddings.create(**embedding_api_kwargs)
            else:
                # Use the standard client for other embedding models
                response = client.embeddings.create(**embedding_api_kwargs)
                
            return self.parse_embedding_response(response)
        
        elif model_type == ModelType.LLM:
            # Handle streaming if requested
            stream = api_kwargs.pop("stream", False)
            
            if stream:
                # Handle streaming response
                response = client.chat.completions.create(
                    **api_kwargs, stream=True
                )
                return self.parse_chat_completion(response)
            else:
                # Handle non-streaming response
                response = client.chat.completions.create(**api_kwargs)
                return self.parse_chat_completion(response)
        
        # For other model types, raise an error
        raise ValueError(f"Unsupported model type: {model_type}")

    async def acall(
            self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED
        ):
        """
        kwargs is the combined input and model_kwargs
        """
        if self.async_client is None:
            self.async_client = self.init_async_client()
        
        self._api_kwargs = api_kwargs.copy()
        
        # Check if we need to use a model-specific API version
        deployment_id = api_kwargs.get("deployment_id")
        if deployment_id and deployment_id in self._model_api_versions:
            # Create a new client with the model-specific API version
            api_key = self._api_key or os.getenv(self._env_api_key_name)
            model_specific_client = AsyncAzureOpenAI(
                api_key=api_key,
                api_version=self._model_api_versions[deployment_id],
                azure_endpoint=self.base_url,
            )
            log.info(f"Using model-specific API version {self._model_api_versions[deployment_id]} for model {deployment_id}")
            client = model_specific_client
        else:
            # Use the default client
            client = self.async_client
        
        # Handle different model types
        if model_type == ModelType.EMBEDDER:
            # Prepare the embeddings API call
            embedding_api_kwargs = api_kwargs.copy()
            
            # Handle model parameter for Azure OpenAI
            # The installed version doesn't support deployment_id, so we need to use model
            deployment_id = embedding_api_kwargs.pop('deployment_id', None)
            if deployment_id and not embedding_api_kwargs.get('model'):
                # Use deployment_id as the model name
                embedding_api_kwargs['model'] = deployment_id
                log.info(f"Using deployment_id {deployment_id} as model for embeddings")
                
            # Ensure we have a model parameter
            model = embedding_api_kwargs.get('model')
            if not model:
                model = "text-embedding-ada-002"  # Default model
                embedding_api_kwargs['model'] = model
                log.info(f"Using default model {model} for embeddings")
                
            # Remove dimensions parameter if it exists - not supported by text-embedding-ada-002
            if 'dimensions' in embedding_api_kwargs:
                dimensions = embedding_api_kwargs.pop('dimensions')
                log.info(f"Removed dimensions parameter ({dimensions}) as it's not supported by {model}")
            
            # Ensure we're using the correct API version for text-embedding-3 models
            if model and ('text-embedding-3' in model):
                # Create a client with the correct API version for text-embedding-3 models
                api_key = self._api_key or os.getenv(self._env_api_key_name)
                embedding_client = AsyncAzureOpenAI(
                    api_key=api_key,
                    api_version="2024-02-01",  # API version compatible with text-embedding-3 models
                    azure_endpoint=self.base_url
                )
                log.info(f"Using API version 2024-02-01 for {model} embeddings")
                # Call the embeddings API with the specialized client
                response = await embedding_client.embeddings.create(**embedding_api_kwargs)
            else:
                # Use the standard client for other embedding models
                response = await client.embeddings.create(**embedding_api_kwargs)
                
            return self.parse_embedding_response(response)
        
        elif model_type == ModelType.LLM:
            # Handle streaming if requested
            stream = api_kwargs.pop("stream", False)
            
            if stream:
                # Handle streaming response
                response = await client.chat.completions.create(
                    **api_kwargs, stream=True
                )
                # For streaming, return the raw response so it can be iterated over
                # This allows the caller to handle the streaming directly
                log.info("Returning raw streaming response")
                return response
            else:
                # Handle non-streaming response
                response = await client.chat.completions.create(**api_kwargs)
                return self.parse_chat_completion(response)
        
        # For other model types, raise an error
        raise ValueError(f"Unsupported model type: {model_type}")

    @classmethod
    def from_dict(cls: type[T], data: Dict[str, Any]) -> T:
        """Create a client from a dictionary."""
        return cls(**data)

    def to_dict(self) -> Dict[str, Any]:
        """Convert the component to a dictionary."""
        return {
            "api_key": self._api_key,
            "api_version": self._api_version,
            "base_url": self.base_url,
            "env_base_url_name": self._env_base_url_name,
            "env_api_key_name": self._env_api_key_name,
            "input_type": self._input_type,
            "model_api_versions": self._model_api_versions,
        }

    def _encode_image(self, image_path: str) -> str:
        """Encode image to base64 string.

        Args:
            image_path: Path to image file.

        Returns:
            Base64 encoded image string.

        Raises:
            ValueError: If the file cannot be read or doesn't exist.
        """
        try:
            with open(image_path, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode("utf-8")
        except Exception as e:
            raise ValueError(f"Error encoding image: {str(e)}")

    def _prepare_image_content(
            self, image_source: Union[str, Dict[str, Any]], detail: str = "auto"
        ) -> Dict[str, Any]:
        """Prepare image content for API request.

        Args:
            image_source: Either a path to local image or a URL.
            detail: Image detail level ('auto', 'low', or 'high').

        Returns:
            Formatted image content for API request.
        """
        # If image_source is already a formatted dictionary, return it
        if isinstance(image_source, dict) and "type" in image_source:
            return image_source

        # Check if the source is a URL or a local file path
        is_url = image_source.startswith(("http://", "https://"))
        
        # Format the image content
        if is_url:
            return {
                "type": "image_url",
                "image_url": {
                    "url": image_source,
                    "detail": detail
                }
            }
        else:
            # Local file path, encode it to base64
            return {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{self._encode_image(image_source)}",
                    "detail": detail
                }
            }
