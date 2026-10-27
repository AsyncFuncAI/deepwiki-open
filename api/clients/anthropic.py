from typing import Any

import backoff
from adalflow.core.model_client import ModelClient
from adalflow.core.types import ModelType
from anthropic import (
    APITimeoutError,
    BadRequestError,
    InternalServerError,
    RateLimitError,
    UnprocessableEntityError,
)


class AnthropicBedrockClient(ModelClient):
    def __init__(
        self,
        aws_access_key_id: str | None = None,
        aws_secret_access_key: str | None = None,
        aws_session_token: str | None = None,
        aws_region: str | None = None,
        **kwargs,
    ):
        """A client wrapper for interacting with Anthropic Bedrock API.

        This class currently only provides chat completion API calls.

        Parameters
        ----------
        aws_access_key_id: str, optional.
            AWS access key ID. Defaults to None.
        aws_secret_access_key: str, optional.
            AWS secret access key. Defaults to None.
        aws_session_token: str, optional.
            AWS session token. Defaults to None.
        aws_region: str, optional.
            AWS region. Defaults to None.

        Examples
        --------
        .. code-block:: python

            from api.clients import AnthropicBedrockClient
            from adalflow.core.types import ModelType
            client = AnthropicBedrockClient()

            # chat completion API
            api_kwargs = client.convert_inputs_to_api_kwargs(
                inputs="Hello World!",
                model_kwargs={"max_tokens": 2048},
                model_type=ModelType.LLM,
            )

            # synchronous API call
            response = client.call(**api_kwargs, model_type=ModelType.LLM)

            # asynchronous API call
            response = await client.acall(**api_kwargs, model_type=ModelType.LLM)

        References
        ----------
        - [AWS Bedrock API Documentation](https://platform.claude.com/docs/zh-TW/build-with-claude/claude-in-amazon-bedrock#making-your-first-request)

        """
        super().__init__()
        self._aws_client_kwargs = dict(
            aws_access_key=aws_access_key_id,
            aws_secret_key=aws_secret_access_key,
            aws_session_token=aws_session_token,
            aws_region=aws_region,
        )

    def init_sync_client(self):
        from anthropic import AnthropicBedrock

        return AnthropicBedrock(**self._aws_client_kwargs)

    def init_async_client(self):
        from anthropic import AsyncAnthropicBedrock

        return AsyncAnthropicBedrock(**self._aws_client_kwargs)

    @property
    def async_client(self):
        if getattr(self, "_async_client", None) is None:
            self._async_client = self.init_async_client()
        return self._async_client

    @async_client.setter
    def async_client(self, value):
        from anthropic import AsyncAnthropicBedrock

        if value is None and isinstance(
            getattr(self, "_async_client", None), AsyncAnthropicBedrock
        ):
            self.async_client.close()
        self._async_client = value

    @property
    def sync_client(self):
        if getattr(self, "_sync_client", None) is None:
            self._sync_client = self.init_sync_client()
        return self._sync_client

    @sync_client.setter
    def sync_client(self, value):
        from anthropic import AnthropicBedrock

        if value is None and isinstance(
            getattr(self, "_sync_client", None), AnthropicBedrock
        ):
            self.sync_client.close()
        self._sync_client = value

    def convert_inputs_to_api_kwargs(
        self,
        input: Any = None,
        model_kwargs: dict | None = None,
        model_type: ModelType = ModelType.UNDEFINED,
    ) -> dict[str, Any]:
        final_model_kwargs = model_kwargs.copy() if model_kwargs else {}
        if model_type == ModelType.LLM:
            if isinstance(input, str):
                input = [{"role": "user", "content": input}]
            elif not isinstance(input, list):
                raise ValueError(
                    f"input must be a string or a list or messages, get {type(input).__name__}"
                )
            final_model_kwargs["messages"] = input
            return final_model_kwargs

        raise ValueError(f"model_type {model_type} is not supported")

    @backoff.on_exception(
        backoff.expo,
        (
            APITimeoutError,
            InternalServerError,
            RateLimitError,
        ),
        max_time=5,
    )
    def call(
        self, api_kwargs: dict | None = None, model_type: ModelType | None = None
    ) -> Any:
        api_kwargs = api_kwargs or {}
        if model_type != ModelType.LLM:
            raise ValueError(f"model_type {model_type} is not supported")

        if "model" not in api_kwargs:
            raise ValueError("must provide 'model' parameter in api_kwargs")

        return self.sync_client.messages.create(**api_kwargs)

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
        self, api_kwargs: dict | None = None, model_type: ModelType | None = None
    ) -> Any:
        api_kwargs = api_kwargs or {}
        if model_type != ModelType.LLM:
            raise ValueError(f"model_type {model_type} is not supported")

        if "model" not in api_kwargs:
            raise ValueError("must provide 'model' parameter in api_kwargs")

        return await self.async_client.messages.create(**api_kwargs)

    def to_dict(self, exclude: list[str] | None = None) -> dict[str, Any]:
        return self._aws_client_kwargs

    @classmethod
    def from_dict(cls, data: dict[str, Any]):
        return cls(**data)
