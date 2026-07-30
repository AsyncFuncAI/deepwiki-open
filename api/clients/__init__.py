"""Unify Adalflow compatible clients to here.
Any patches and additional clients could be applied or imported in this module.
"""

from adalflow.components.model_client import (
    AzureAIClient,
    GoogleGenAIClient,
    OpenAIClient,
)

from .anthropic import AnthropicBedrockClient
from .bedrock import BedrockClient
from .dashscope import DashscopeClient
from .google_embedder import GoogleEmbedderClient
from .litellm import LiteLLMClient
from .ollama import OllamaClient
from .openrouter import OpenRouterClient

__all__ = [
    "AnthropicBedrockClient",
    "AzureAIClient",
    "BedrockClient",
    "DashscopeClient",
    "GoogleEmbedderClient",
    "GoogleGenAIClient",
    "LiteLLMClient",
    "OllamaClient",
    "OpenAIClient",
    "OpenRouterClient",
]
