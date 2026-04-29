"""LiteLLM ModelClient integration.

Routes to 100+ LLM providers via litellm.completion().
Provider API keys are read from environment variables automatically
(OPENAI_API_KEY, ANTHROPIC_API_KEY, AWS_ACCESS_KEY_ID, GEMINI_API_KEY, etc.).

Model names use LiteLLM format: "provider/model-name", e.g.:
    anthropic/claude-sonnet-4-20250514, openai/gpt-4o,
    bedrock/anthropic.claude-3-5-sonnet-20241022-v2:0

See https://docs.litellm.ai/docs/providers for the full list.
"""

import logging
from typing import (
    Any,
    Callable,
    Dict,
    List,
    Optional,
    Sequence,
    TypeVar,
    Union,
)

import backoff

from adalflow.core.model_client import ModelClient
from adalflow.core.types import (
    CompletionUsage,
    EmbedderOutput,
    GeneratorOutput,
    ModelType,
)
from adalflow.components.model_client.utils import parse_embedding_response

log = logging.getLogger(__name__)
T = TypeVar("T")


def get_first_message_content(completion) -> str:
    return completion.choices[0].message.content


class LiteLLMClient(ModelClient):
    __doc__ = r"""A component wrapper for the LiteLLM AI gateway.

    LiteLLM routes to 100+ LLM providers (OpenAI, Anthropic, Google, AWS Bedrock,
    Azure, Ollama, etc.) through a single unified interface. Provider API keys are
    read from environment variables automatically.

    Model names use LiteLLM format: ``provider/model-name``.

    Example:
        ```python
        from api.litellm_client import LiteLLMClient
        import adalflow as adal

        client = LiteLLMClient()
        generator = adal.Generator(
            model_client=client,
            model_kwargs={"model": "anthropic/claude-sonnet-4-20250514"}
        )
        response = generator(prompt_kwargs={"input_str": "What is LLM?"})
        ```

    Args:
        api_key (Optional[str]): API key for the provider. If not provided,
            LiteLLM reads from the provider's standard env var (e.g. ANTHROPIC_API_KEY).
        base_url (Optional[str]): Custom API base URL (e.g. for LiteLLM proxy server).
        chat_completion_parser: A function to parse the chat completion response.
            Defaults to extracting the first message content.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        chat_completion_parser: Callable = None,
    ):
        super().__init__()
        self._api_key = api_key
        self._base_url = base_url
        self.chat_completion_parser = (
            chat_completion_parser or get_first_message_content
        )
        self.sync_client = self.init_sync_client()
        self.async_client = None

    def init_sync_client(self):
        return {"api_key": self._api_key, "base_url": self._base_url}

    def init_async_client(self):
        return {"api_key": self._api_key, "base_url": self._base_url}

    def convert_inputs_to_api_kwargs(
        self,
        input: Optional[Any] = None,
        model_kwargs: Dict = {},
        model_type: ModelType = ModelType.UNDEFINED,
    ) -> Dict:
        final_model_kwargs = model_kwargs.copy()

        if model_type == ModelType.EMBEDDER:
            if isinstance(input, str):
                input = [input]
            if not isinstance(input, Sequence):
                raise TypeError("input must be a sequence of text")
            final_model_kwargs["input"] = input
        elif model_type == ModelType.LLM:
            messages: List[Dict[str, str]] = []
            if isinstance(input, str):
                messages.append({"role": "user", "content": input})
            elif isinstance(input, list) and all(isinstance(m, dict) for m in input):
                messages = input
            else:
                messages.append({"role": "user", "content": str(input)})
            final_model_kwargs["messages"] = messages
        else:
            raise ValueError(f"model_type {model_type} is not supported")

        return final_model_kwargs

    def parse_chat_completion(self, completion) -> GeneratorOutput:
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

    def track_completion_usage(self, completion) -> CompletionUsage:
        try:
            return CompletionUsage(
                completion_tokens=completion.usage.completion_tokens,
                prompt_tokens=completion.usage.prompt_tokens,
                total_tokens=completion.usage.total_tokens,
            )
        except Exception as e:
            log.error(f"Error tracking the completion usage: {e}")
            return CompletionUsage(
                completion_tokens=None, prompt_tokens=None, total_tokens=None
            )

    def parse_embedding_response(self, response) -> EmbedderOutput:
        try:
            return parse_embedding_response(response)
        except Exception as e:
            log.error(f"Error parsing the embedding response: {e}")
            return EmbedderOutput(data=[], error=str(e), raw_response=response)

    @backoff.on_exception(backoff.expo, Exception, max_time=5)
    def call(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        import litellm

        log.info(f"api_kwargs: {api_kwargs}")

        extra = {}
        if self._api_key:
            extra["api_key"] = self._api_key
        if self._base_url:
            extra["api_base"] = self._base_url

        if model_type == ModelType.EMBEDDER:
            return litellm.embedding(
                drop_params=True,
                **api_kwargs,
                **extra,
            )
        elif model_type == ModelType.LLM:
            if api_kwargs.get("stream", False):
                self.chat_completion_parser = _handle_streaming_response
                return litellm.completion(
                    drop_params=True,
                    **api_kwargs,
                    **extra,
                )
            else:
                return litellm.completion(
                    drop_params=True,
                    **api_kwargs,
                    **extra,
                )
        else:
            raise ValueError(f"model_type {model_type} is not supported")

    async def acall(
        self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED
    ):
        import litellm

        extra = {}
        if self._api_key:
            extra["api_key"] = self._api_key
        if self._base_url:
            extra["api_base"] = self._base_url

        if model_type == ModelType.EMBEDDER:
            return await litellm.aembedding(
                drop_params=True,
                **api_kwargs,
                **extra,
            )
        elif model_type == ModelType.LLM:
            return await litellm.acompletion(
                drop_params=True,
                **api_kwargs,
                **extra,
            )
        else:
            raise ValueError(f"model_type {model_type} is not supported")

    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        return cls(**data)

    def to_dict(self) -> Dict[str, Any]:
        exclude = ["sync_client", "async_client"]
        output = super().to_dict(exclude=exclude)
        return output


def _handle_streaming_response(generator):
    for completion in generator:
        if completion.choices and completion.choices[0].delta.content:
            yield completion.choices[0].delta.content
