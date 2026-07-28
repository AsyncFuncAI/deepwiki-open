from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from typing import TYPE_CHECKING

from adalflow.core.types import ModelType

from api.config import (
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    GOOGLE_API_KEY,
    LITELLM_API_KEY,
    OPENAI_API_KEY,
    OPENROUTER_API_KEY,
)
from api.logger import get_logger

if TYPE_CHECKING:
    from ollama import ChatResponse
    from openai import AsyncStream
    from openai.types.chat import ChatCompletionChunk

    from api.clients import OpenAIClient

MODEL_CFG = dict[str, str | int | float]

logger = get_logger("chat")


class ChatStreamer(ABC):
    _registry: dict[str, type["ChatStreamer"]] = {}
    provider: str
    error_hint: str | None = None

    def __init_subclass__(cls, **kwargs) -> None:
        super().__init_subclass__(**kwargs)
        if provider := getattr(cls, "provider", None):
            ChatStreamer._registry[provider] = cls

    @classmethod
    def create(
        cls, *, provider: str, model: str | None = None, model_config: MODEL_CFG
    ) -> "ChatStreamer":
        model = model or model_config.get("model")
        logger.info("Using %s with model: %s", provider, model)
        registered = ChatStreamer._registry.get(provider, None)
        if registered:
            return registered(model=model, model_config=model_config)
        raise RuntimeError(f"Provider {provider} not registered")

    @abstractmethod
    def respond_stream(self, prompt: str) -> AsyncIterator[str]:
        raise NotImplementedError(
            f"{type(self).__name__} does not implement `respond_stream`"
        )


class OllamaChatStreamer(ChatStreamer):
    provider = "ollama"

    def __init__(self, *, model: str, model_config: MODEL_CFG):
        from adalflow.components.model_client.ollama_client import OllamaClient

        self.client = OllamaClient()
        self.model_kwargs = {
            "model": model,
            "stream": True,
            "options": {
                "temperature": model_config["temperature"],
                "top_p": model_config["top_p"],
                "num_ctx": model_config["num_ctx"],
            },
        }

        logger.debug(f"Prompting Ollama with kwargs: {self.model_kwargs}")

    async def respond_stream(self, prompt: str) -> AsyncIterator[str]:
        api_kwargs = self.client.convert_inputs_to_api_kwargs(
            input=prompt
            + " /no_think",  # todo I think this could be added into model kwargs?
            model_kwargs=self.model_kwargs,
            model_type=ModelType.LLM,
        )

        response: "AsyncIterator[ChatResponse]" = await self.client.acall(
            api_kwargs=api_kwargs,
            model_type=ModelType.LLM,
        )

        async for chunk in response:
            if not hasattr(chunk, "message"):
                raise RuntimeError(
                    "`message` field not found in response. Wrong ollama-python version probably.",
                )
            text = chunk.message.content
            if text:
                text = text.replace("<think>", "").replace("</think>", "")
                yield text


class OpenRouterChatStreamer(ChatStreamer):
    provider = "openrouter"
    error_hint = (
        "Please check that you have set the OPENROUTER_API_KEY "
        "environment variable with a valid API key."
    )

    def __init__(self, *, model: str, model_config: MODEL_CFG):
        if not OPENROUTER_API_KEY:
            logger.warning(
                "OPENROUTER_API_KEY not configured, but continuing with request"
            )
            # We'll let the OpenRouterClient handle this and return a friendly error message
        from api.clients import OpenRouterClient

        self.client = OpenRouterClient()
        self.model_kwargs = {
            "model": model,
            "stream": True,
            "temperature": model_config["temperature"],
        }
        if "top_k" in model_config:
            self.model_kwargs["top_k"] = model_config["top_k"]

    async def respond_stream(self, prompt: str) -> AsyncIterator[str]:
        api_kwargs = self.client.convert_inputs_to_api_kwargs(
            input=prompt,
            model_kwargs=self.model_kwargs,
            model_type=ModelType.LLM,
        )
        async for chunk in await self.client.acall(
            api_kwargs=api_kwargs,
            model_type=ModelType.LLM,
        ):
            yield chunk


class _OpenAICompatStreamer(ChatStreamer):
    client: "OpenAIClient"
    model_kwargs: dict

    def __init__(self, *, model: str, model_config: MODEL_CFG):
        self.client = self._build_client()
        self.model_kwargs = {
            "model": model,
            "stream": True,
            "temperature": model_config["temperature"],
        }
        # Only add top_p if it exists in the model config
        if "top_p" in model_config:
            self.model_kwargs["top_p"] = model_config["top_p"]

    @abstractmethod
    def _build_client(self) -> "OpenAIClient":
        raise NotImplementedError(
            f"{type(self).__name__} must return an `OpenAIClient` instance"
        )

    async def respond_stream(self, prompt: str) -> AsyncIterator[str]:
        api_kwargs = self.client.convert_inputs_to_api_kwargs(
            input=prompt, model_kwargs=self.model_kwargs, model_type=ModelType.LLM
        )
        response: "AsyncStream[ChatCompletionChunk]" = await self.client.acall(
            api_kwargs=api_kwargs,
            model_type=ModelType.LLM,
        )

        async for chunk in response:
            if (
                chunk.choices
                and chunk.choices[0].delta is not None
                and chunk.choices[0].delta.content is not None
            ):
                yield chunk.choices[0].delta.content


class OpenAIChatStreamer(_OpenAICompatStreamer):
    provider = "openai"
    error_hint = (
        "Please check that you have set the OPENAI_API_KEY "
        "environment variable with a valid API key."
    )

    def __init__(self, *, model: str, model_config: MODEL_CFG):
        if not OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not configured, but continuing with request")

        super().__init__(model=model, model_config=model_config)

    def _build_client(self):
        from api.clients import OpenAIClient

        return OpenAIClient()


class AzureChatStreamer(_OpenAICompatStreamer):
    provider = "azure"
    error_hint = (
        "Please check that you have set the AZURE_OPENAI_API_KEY, "
        "AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_VERSION "
        "environment variables with valid values."
    )

    def _build_client(self):
        from api.clients import AzureAIClient

        return AzureAIClient()


class LiteLLMChatStreamer(_OpenAICompatStreamer):
    provider = "litellm"
    error_hint = (
        "Please check that you have set the LITELLM_API_KEY "
        "environment variable with a valid API key."
    )

    def __init__(self, *, model: str, model_config: MODEL_CFG):
        if not LITELLM_API_KEY:
            logger.warning(
                "LITELLM_API_KEY not configured, but continuing with request"
            )
            # We'll let the OpenAIClient handle this and return an error message

        super().__init__(model=model, model_config=model_config)

    def _build_client(self):
        from api.clients import LiteLLMClient

        return LiteLLMClient()


class BedrockChatStreamer(ChatStreamer):
    provider = "bedrock"
    error_hint = (
        "Please check that you have set the AWS_ACCESS_KEY_ID "
        "and AWS_SECRET_ACCESS_KEY environment variables with valid credentials."
    )

    def __init__(self, *, model: str, model_config: MODEL_CFG):
        if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
            logger.warning(
                "AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not configured, but continuing with request"
            )
            # We'll let the BedrockClient handle this and return an error message
        from api.clients import BedrockClient

        self.client = BedrockClient()
        self.model_kwargs = {"model": model}

        for key in (
            "temperature",
            "top_p",
        ):
            if key in model_config:
                self.model_kwargs[key] = model_config[key]

    async def respond_stream(self, prompt: str) -> AsyncIterator[str]:
        api_kwargs = self.client.convert_inputs_to_api_kwargs(
            input=prompt,
            model_kwargs=self.model_kwargs,
            model_type=ModelType.LLM,
        )
        response = await self.client.acall(
            api_kwargs=api_kwargs,
            model_type=ModelType.LLM,
        )
        if not isinstance(response, str):
            response = str(response)
        yield response


class DashScopeChatStreamer(ChatStreamer):
    provider = "dashscope"
    error_hint = (
        "Please check that you have set the DASHSCOPE_API_KEY (and optionally "
        "DASHSCOPE_WORKSPACE_ID) environment variables with valid values."
    )

    def __init__(self, *, model: str, model_config: MODEL_CFG):
        from api.clients import DashscopeClient

        self.client = DashscopeClient()
        self.model_kwargs = {
            "model": model,
            "stream": True,
            "temperature": model_config["temperature"],
            "top_p": model_config["top_p"],
        }

    async def respond_stream(self, prompt: str) -> AsyncIterator[str]:
        api_kwargs = self.client.convert_inputs_to_api_kwargs(
            input=prompt,
            model_kwargs=self.model_kwargs,
            model_type=ModelType.LLM,
        )
        response = await self.client.acall(
            api_kwargs=api_kwargs,
            model_type=ModelType.LLM,
        )
        async for text in response:
            if text:
                yield text


class GoogleGenerativeChatStreamer(ChatStreamer):
    provider = "google"

    def __init__(self, *, model: str, model_config: MODEL_CFG):
        import google.generativeai as genai
        from google.generativeai.types import GenerationConfig

        genai.configure(api_key=GOOGLE_API_KEY)

        self.client = genai.GenerativeModel(
            model_name=model,
            generation_config=GenerationConfig(
                temperature=model_config.get("temperature"),
                top_p=model_config.get("top_p"),
                top_k=model_config.get("top_k"),
            ),
        )

    async def respond_stream(self, prompt: str) -> AsyncIterator[str]:
        response = await self.client.generate_content_async(prompt, stream=True)
        async for chunk in response:
            if hasattr(chunk, "text"):
                yield chunk.text


class AnthropicChatStreamer(ChatStreamer):
    provider = "anthropic"

    def __init__(self, *, model: str, model_config: MODEL_CFG):
        from api.config import (
            AWS_ACCESS_KEY_ID,
            AWS_REGION,
            AWS_SECRET_ACCESS_KEY,
            AWS_SESSION_TOKEN,
        )

        from ..clients.anthropic import AnthropicBedrockClient

        self.client = AnthropicBedrockClient(
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_session_token=AWS_SESSION_TOKEN,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            aws_region=AWS_REGION,
        )

        self.model_kwargs = {
            "model": model,
            "stream": True,
            "max_tokens": model_config["max_tokens"],  # max_tokens must exist
        }
        for key in (
            "temperature",
            "top_p",
        ):
            if key in model_config:
                self.model_kwargs[key] = model_config[key]

    async def respond_stream(self, prompt: str) -> AsyncIterator[str]:
        api_kwargs = self.client.convert_inputs_to_api_kwargs(
            input=prompt,
            model_kwargs=self.model_kwargs,
            model_type=ModelType.LLM,
        )

        response = await self.client.acall(
            api_kwargs=api_kwargs,
            model_type=ModelType.LLM,
        )
        async for chunk in response:
            if chunk.type == "content_block_delta" and chunk.delta.type == "text_delta":
                yield chunk.delta.text
