"""Cline Chat Completions adapter, independent of AdalFlow's Responses API."""
import os

from adalflow.core.model_client import ModelClient
from adalflow.core.types import GeneratorOutput, ModelType
from openai import AsyncOpenAI, OpenAI


class ClineClient(ModelClient):
    def __init__(self, api_key=None, base_url=None):
        super().__init__()
        self._api_key = api_key or os.getenv("CLINE_API_KEY", "").strip()
        if not self._api_key:
            raise ValueError("Set CLINE_API_KEY in .env to use Cline")
        self.base_url = (base_url or os.getenv("CLINE_BASE_URL") or "https://api.cline.bot/api/v1").rstrip("/")
        self.sync_client = OpenAI(api_key=self._api_key, base_url=self.base_url)
        self.async_client = None

    def convert_inputs_to_api_kwargs(self, input, model_kwargs=None, model_type=ModelType.LLM):
        if model_type != ModelType.LLM:
            raise ValueError("Cline is configured for generation, not embeddings")
        messages = [{"role": "user", "content": input}] if isinstance(input, str) else input
        return {**(model_kwargs or {}), "messages": messages}

    def call(self, api_kwargs=None, model_type=ModelType.LLM):
        if model_type != ModelType.LLM:
            raise ValueError("Cline is configured for generation, not embeddings")
        return self.sync_client.chat.completions.create(**(api_kwargs or {}))

    async def acall(self, api_kwargs=None, model_type=ModelType.LLM):
        if model_type != ModelType.LLM:
            raise ValueError("Cline is configured for generation, not embeddings")
        if self.async_client is None:
            self.async_client = AsyncOpenAI(api_key=self._api_key, base_url=self.base_url,
                max_retries=int(os.getenv("CLINE_MAX_RETRIES","2")))
        return await self.async_client.chat.completions.create(**(api_kwargs or {}))

    def parse_chat_completion(self, completion):
        text = completion.choices[0].message.content or ""
        return GeneratorOutput(data=text, raw_response=text)
