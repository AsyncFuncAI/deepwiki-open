"""xAI ModelClient integration."""

import os
import logging
import asyncio
from typing import Dict, Optional, Any, Callable, Literal, List
import backoff

from adalflow.core.model_client import ModelClient
from adalflow.core.types import ModelType, GeneratorOutput

log = logging.getLogger(__name__)

def get_first_message_content(response) -> str:
    """Extract content from xAI response."""
    if hasattr(response, 'content'):
        return response.content
    return str(response)

def handle_streaming_response(response):
    """Handle streaming response from xAI API."""
    try:
        # For streaming responses, we need to collect all chunks
        collected_content = ""
        for chunk in response:
            if hasattr(chunk, 'content') and chunk.content:
                collected_content += chunk.content
                yield chunk.content
        
        # Return the final collected content
        if collected_content:
            return collected_content
    except Exception as e:
        log.error(f"Error handling streaming response: {e}")
        yield f"Error: {str(e)}"

class XAIClient(ModelClient):
    __doc__ = r"""A component wrapper for the xAI API client.

    Supports chat completion APIs using xAI's Grok models.

    Users can:
    1. Simplify use of ``Generator`` components by passing `XAIClient()` as the `model_client`.
    2. Use this as a reference to create their own API client or extend this class by copying and modifying the code.

    To use xAI API, you need to set the XAI_API_KEY environment variable.

    Example:
        ```python
        from api.xai_client import XAIClient
        import adalflow as adal

        client = XAIClient()
        generator = adal.Generator(
            model_client=client,
            model_kwargs={"model": "grok-4-0709"}
        )
        ```

    References:
        - xAI API Documentation: https://docs.x.ai/
        - xAI SDK: https://github.com/xai-org/xai-sdk
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_host: Optional[str] = None,
        chat_completion_parser: Callable = None,
        input_type: Literal["text", "messages"] = "text",
        env_api_key_name: str = "XAI_API_KEY",
        env_api_host_name: str = "XAI_API_HOST",
    ):
        r"""Initialize the xAI client.

        Args:
            api_key (Optional[str], optional): xAI API key. Defaults to None.
            api_host (Optional[str], optional): xAI API host. Defaults to "api.x.ai".
            chat_completion_parser: Function to parse chat completions.
            input_type: Input format, either "text" or "messages".
            env_api_key_name (str): The environment variable name for the API key.
            env_api_host_name (str): The environment variable name for the API host.
        """
        super().__init__()
        self._api_key = api_key
        self._env_api_key_name = env_api_key_name
        self._env_api_host_name = env_api_host_name
        self.api_host = api_host or os.getenv(self._env_api_host_name, "api.x.ai")
        self.sync_client = self.init_sync_client()
        self.async_client = None  # only initialize if the async call is called
        self.chat_completion_parser = (
            chat_completion_parser or get_first_message_content
        )
        self._input_type = input_type

    def init_sync_client(self):
        """Initialize the synchronous xAI client."""
        try:
            from xai_sdk import Client
        except ImportError:
            raise ImportError(
                "xai_sdk is required to use XAIClient. Install it with: pip install xai-sdk"
            )

        api_key = self._api_key or os.getenv(self._env_api_key_name)
        if not api_key:
            log.warning("XAI_API_KEY not configured")
            # Return a dummy client that will fail gracefully when used
            return None

        return Client(
            api_host=self.api_host,
            api_key=api_key
        )

    def init_async_client(self):
        """Initialize the asynchronous xAI client."""
        # For now, we'll use the sync client for async operations
        # This can be improved when xAI SDK provides native async support
        return self.init_sync_client()

    def convert_inputs_to_api_kwargs(
        self, input: Any, model_kwargs: Dict = None, model_type: ModelType = None
    ) -> Dict:
        """Convert AdalFlow inputs to xAI API format."""
        model_kwargs = model_kwargs or {}
        
        if model_type == ModelType.LLM:
            # Handle different input types
            if self._input_type == "messages":
                if isinstance(input, list):
                    messages = input
                else:
                    messages = [{"role": "user", "content": str(input)}]
            else:
                # Convert text input to messages format
                if isinstance(input, str):
                    messages = [{"role": "user", "content": input}]
                else:
                    messages = [{"role": "user", "content": str(input)}]

            # Prepare API kwargs
            api_kwargs = {
                "messages": messages,
                **model_kwargs
            }
            
            return api_kwargs
        else:
            raise ValueError(f"model_type {model_type} is not supported by XAIClient")

    def parse_chat_completion(self, response) -> GeneratorOutput:
        """Parse the chat completion response into a GeneratorOutput."""
        try:
            if hasattr(response, 'content'):
                # Direct response with content
                return GeneratorOutput(
                    data=response.content,
                    raw_response=str(response),
                )
            else:
                # Handle other response formats
                return GeneratorOutput(
                    data=str(response),
                    raw_response=str(response),
                )
        except Exception as e:
            log.error(f"Error parsing chat completion response: {e}")
            return GeneratorOutput(data=None, error=str(e), raw_response=str(response))

    @backoff.on_exception(
        backoff.expo,
        (Exception,),  # xAI SDK might have specific exceptions, but we'll catch all for now
        max_time=5,
    )
    def call(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        """
        Make a synchronous call to the xAI API.
        """
        log.info(f"api_kwargs: {api_kwargs}")
        self._api_kwargs = api_kwargs
        
        if model_type == ModelType.LLM:
            # Check if client is properly initialized
            if not self.sync_client:
                raise ValueError("XAI client not properly initialized. Please set XAI_API_KEY environment variable.")

            try:
                from xai_sdk.chat import user, system

                # Create a new chat instance
                chat = self.sync_client.chat.create(
                    model=api_kwargs.get("model", "grok-4-0709"),
                    temperature=api_kwargs.get("temperature", 0.7)
                )
                
                # Add messages to the chat
                messages = api_kwargs.get("messages", [])
                for message in messages:
                    role = message.get("role", "user")
                    content = message.get("content", "")
                    
                    if role == "system":
                        chat.append(system(content))
                    else:  # user or assistant
                        chat.append(user(content))
                
                # Get the response
                response = chat.sample()
                
                # Handle streaming if requested
                if api_kwargs.get("stream", False):
                    # For streaming, we'll simulate by yielding the content
                    async def async_stream_generator():
                        yield response.content
                    return async_stream_generator()
                else:
                    return response
                    
            except Exception as e:
                log.error(f"Error in xAI API call: {e}")
                raise
        else:
            raise ValueError(f"model_type {model_type} is not supported by XAIClient")

    async def acall(
        self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED
    ):
        """
        Make an asynchronous call to the xAI API.
        """
        # Check if client is properly initialized
        if not self.sync_client:
            raise ValueError("XAI client not properly initialized. Please set XAI_API_KEY environment variable.")

        if model_type == ModelType.LLM:
            try:
                from xai_sdk.chat import user, system

                # Create a new chat instance in a thread pool
                loop = asyncio.get_event_loop()

                def create_chat_and_get_response():
                    chat = self.sync_client.chat.create(
                        model=api_kwargs.get("model", "grok-4-0709"),
                        temperature=api_kwargs.get("temperature", 0.7)
                    )

                    # Add messages to the chat
                    messages = api_kwargs.get("messages", [])
                    for message in messages:
                        role = message.get("role", "user")
                        content = message.get("content", "")

                        if role == "system":
                            chat.append(system(content))
                        else:  # user or assistant
                            chat.append(user(content))

                    # Get the response
                    return chat.sample()

                response = await loop.run_in_executor(None, create_chat_and_get_response)

                # Handle streaming if requested
                if api_kwargs.get("stream", False):
                    # For streaming, we'll simulate by yielding the content
                    async def async_stream_generator():
                        yield response.content
                    return async_stream_generator()
                else:
                    return response

            except Exception as e:
                log.error(f"Error in xAI API call: {e}")
                raise
        else:
            raise ValueError(f"model_type {model_type} is not supported by XAIClient")


# Example usage:
if __name__ == "__main__":
    from adalflow.core import Generator
    from adalflow.utils import setup_env

    setup_env()
    prompt_kwargs = {"input_str": "What is the meaning of life?"}

    gen = Generator(
        model_client=XAIClient(),
        model_kwargs={"model": "grok-4-0709", "stream": False},
    )
    gen_response = gen(prompt_kwargs)
    print(f"gen_response: {gen_response}")
