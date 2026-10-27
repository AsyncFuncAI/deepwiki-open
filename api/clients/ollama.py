# This file exists to patch the adalflow OllamaClient to support ollama batch embedding api `embed`

from typing import Any, Dict, Optional

import backoff
from adalflow.components.model_client.ollama_client import (
    OllamaClient,
    RequestError,
    ResponseError,
    log,
)
from adalflow.core import ModelType
from adalflow.core.types import EmbedderOutput, Embedding


def convert_inputs_to_api_kwargs(
    self,
    input: Optional[Any] = None,
    model_kwargs: Dict = {},
    model_type: ModelType = ModelType.UNDEFINED,
) -> Dict:
    self.generate = False
    final_model_kwargs = model_kwargs.copy()
    if model_type == ModelType.EMBEDDER:
        final_model_kwargs["input"] = input
        return final_model_kwargs
    elif model_type == ModelType.LLM:
        if input is not None and input != "":
            # check if "generate" is in model_kwargs, and if it is set to True, then we use generate api
            if model_kwargs.get("generate", False):
                final_model_kwargs["prompt"] = input
                self.generate = True
            else:
                # for chat api, we need to convert the input to a message format
                # if the input is a string, we create a message with role "user"
                if isinstance(input, str):
                    input = [{"role": "user", "content": input}]
                    final_model_kwargs["messages"] = input
                elif not isinstance(input, list):
                    raise ValueError("Input must be a string or a list of messages")
            # if the input is a list of messages, we use it as is
            return final_model_kwargs
        else:
            raise ValueError("Input must be text")
    else:
        raise ValueError(f"model_type {model_type} is not supported")


@backoff.on_exception(
    backoff.expo,
    (RequestError, ResponseError),
    max_tries=5,
)
async def acall(
    self,
    api_kwargs: dict = None,
    model_type: ModelType = ModelType.UNDEFINED,
):
    if self.async_client is None:
        self.init_async_client()
        if self.async_client is None:
            raise RuntimeError("Async client is not initialized")
    api_kwargs = api_kwargs or {}
    if model_type == ModelType.EMBEDDER:
        return await self.async_client.embed(**api_kwargs)
    if model_type == ModelType.LLM:  # in default we use chat
        # create a message from the input
        if "generate" in api_kwargs and api_kwargs["generate"]:
            # remove generate from api_kwargs
            api_kwargs.pop("generate")
            return await self.async_client.generate(**api_kwargs)
        else:
            return await self.async_client.chat(**api_kwargs)
    else:
        raise ValueError(f"model_type {model_type} is not supported")


@backoff.on_exception(
    backoff.expo,
    (RequestError, ResponseError),
    max_tries=5,
)
def call(
    self,
    api_kwargs: dict = None,
    model_type: ModelType = ModelType.UNDEFINED,
):
    api_kwargs = api_kwargs or {}
    if not self.sync_client:
        self.init_sync_client()
        if self.sync_client is None:
            raise RuntimeError("Sync client is not initialized")

    if model_type == ModelType.EMBEDDER:
        return self.sync_client.embed(**api_kwargs)
    if model_type == ModelType.LLM:
        if "generate" in api_kwargs and api_kwargs["generate"]:
            # remove generate from api_kwargs
            api_kwargs.pop("generate")
            return self.sync_client.generate(**api_kwargs)
        else:
            return self.sync_client.chat(**api_kwargs)
    else:
        raise ValueError(f"model_type {model_type} is not supported")


def parse_embedding_response(self, response: Dict[str, list[float]]) -> EmbedderOutput:
    r"""Parse the embedding response to a structure AdalFlow components can understand.
    Pull the embedding from response['embedding'] and store it Embedding dataclass
    """
    try:
        return EmbedderOutput(
            data=[
                Embedding(embedding=emb, index=i)
                for i, emb in enumerate(response["embeddings"])
            ]
        )
    except Exception as e:
        log.error(f"Error parsing the embedding response: {e}")
        return EmbedderOutput(data=[], error=str(e), raw_response=response)


OllamaClient.convert_inputs_to_api_kwargs = convert_inputs_to_api_kwargs
OllamaClient.parse_embedding_response = parse_embedding_response
OllamaClient.call = call
OllamaClient.acall = acall
