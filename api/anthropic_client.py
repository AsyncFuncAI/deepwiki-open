"""Anthropic Claude ModelClient integration."""

import os
import logging
import re
from typing import Dict, Optional, Any

from adalflow.core.model_client import ModelClient
from adalflow.core.types import ModelType, GeneratorOutput, CompletionUsage

log = logging.getLogger(__name__)


class AnthropicClient(ModelClient):
    """AdalFlow ModelClient wrapper for the Anthropic Messages API."""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__()
        self._api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self._api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable must be set")
        self.sync_client = self._init_client()

    def _init_client(self):
        import anthropic
        return anthropic.Anthropic(api_key=self._api_key)

    def convert_inputs_to_api_kwargs(
        self,
        input: Optional[Any] = None,
        model_kwargs: Dict = {},
        model_type: ModelType = ModelType.UNDEFINED,
    ) -> Dict:
        if model_type != ModelType.LLM:
            raise ValueError(f"AnthropicClient only supports LLM model type, got {model_type}")

        kwargs = model_kwargs.copy()
        kwargs.setdefault("max_tokens", 8096)

        # Split system prompt from user content if AdalFlow injected the tags
        system_tag_start = "<START_OF_SYSTEM_PROMPT>"
        system_tag_end = "<END_OF_SYSTEM_PROMPT>"
        user_tag_start = "<START_OF_USER_PROMPT>"
        user_tag_end = "<END_OF_USER_PROMPT>"

        system_prompt = None
        user_content = input

        if isinstance(input, str) and system_tag_start in input:
            pattern = (
                rf"{system_tag_start}\s*(.*?)\s*{system_tag_end}\s*"
                rf"{user_tag_start}\s*(.*?)\s*{user_tag_end}"
            )
            match = re.search(pattern, input, re.DOTALL)
            if match:
                system_prompt = match.group(1).strip()
                user_content = match.group(2).strip()

        kwargs["messages"] = [{"role": "user", "content": user_content}]
        if system_prompt:
            kwargs["system"] = system_prompt

        return kwargs

    def parse_chat_completion(self, completion) -> GeneratorOutput:
        try:
            content = completion.content[0].text
            usage = CompletionUsage(
                prompt_tokens=completion.usage.input_tokens,
                completion_tokens=completion.usage.output_tokens,
                total_tokens=completion.usage.input_tokens + completion.usage.output_tokens,
            )
            return GeneratorOutput(data=None, error=None, raw_response=content, usage=usage)
        except Exception as e:
            log.error(f"Error parsing Anthropic completion: {e}")
            return GeneratorOutput(data=None, error=str(e), raw_response=str(completion))

    def call(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        if model_type != ModelType.LLM:
            raise ValueError(f"AnthropicClient only supports LLM, got {model_type}")

        api_kwargs.pop("stream", None)  # Anthropic streaming not used in sync path
        return self.sync_client.messages.create(**api_kwargs)

    async def acall(self, api_kwargs: Dict = {}, model_type: ModelType = ModelType.UNDEFINED):
        import anthropic
        async_client = anthropic.AsyncAnthropic(api_key=self._api_key)
        if model_type != ModelType.LLM:
            raise ValueError(f"AnthropicClient only supports LLM, got {model_type}")
        api_kwargs.pop("stream", None)
        return await async_client.messages.create(**api_kwargs)
