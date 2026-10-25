"""Cline configuration tests using installed SDKs without network calls."""
import importlib.util
import os
from pathlib import Path
import sys
from types import ModuleType
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


def load_module(name, relative):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class CapturingClient:
    def __init__(self, **kwargs):
        self.options = kwargs


class ClineConfigTests(unittest.TestCase):
    def client_class(self):
        return load_module("tested_cline_client", "api/clients/cline.py").ClineClient

    @patch.dict(os.environ, {}, clear=True)
    def test_missing_key_fails_clearly(self):
        with self.assertRaisesRegex(ValueError, "CLINE_API_KEY"):
            self.client_class()()

    @patch.dict(os.environ, {"CLINE_API_KEY": "test-key", "OPENAI_API_KEY": "separate-key"}, clear=True)
    def test_client_uses_cline_endpoint_and_credential_namespace(self):
        client = self.client_class()()
        self.assertEqual(str(client.sync_client.base_url).rstrip("/"), "https://api.cline.bot/api/v1")
        self.assertEqual(client._api_key, "test-key")
        self.assertEqual(os.environ["OPENAI_API_KEY"], "separate-key")

    @patch.dict(os.environ, {"CLINE_API_KEY": "test-key", "CLINE_BASE_URL": "https://custom.example/v1"}, clear=True)
    def test_explicit_client_endpoint_wins(self):
        cls = self.client_class()
        self.assertEqual(str(cls().sync_client.base_url).rstrip("/"), "https://custom.example/v1")
        self.assertEqual(str(cls(base_url="https://explicit.example/v1").sync_client.base_url).rstrip("/"), "https://explicit.example/v1")

    def config_module(self):
        clients = ModuleType("api.clients")
        for name in ("AnthropicBedrockClient", "AzureAIClient", "BedrockClient", "DashscopeClient",
                     "GoogleEmbedderClient", "GoogleGenAIClient", "LiteLLMClient", "ClineClient",
                     "OllamaClient", "OpenAIClient", "OpenRouterClient"):
            setattr(clients, name, type(name, (), {}))
        with patch.dict(sys.modules, {"api.clients": clients}):
            return load_module("tested_cline_config", "api/config.py")

    @patch.dict(os.environ, {"DEEPWIKI_PROVIDER": "cline", "CLINE_MODEL": "vendor/chosen-model"}, clear=True)
    def test_env_model_default_and_explicit_model_override(self):
        config = self.config_module()
        self.assertEqual(config.configs["default_provider"], "cline")
        self.assertEqual(config.get_model_config()["model_kwargs"]["model"], "vendor/chosen-model")
        self.assertEqual(config.get_model_config("cline", "vendor/other-model")["model_kwargs"]["model"], "vendor/other-model")
        self.assertEqual(config.get_model_config("google")["model_client"].__name__, "GoogleGenAIClient")

    @patch.dict(os.environ, {"DEEPWIKI_PROVIDER": "cline"}, clear=True)
    def test_model_must_be_chosen(self):
        with self.assertRaisesRegex(ValueError, "CLINE_MODEL"):
            self.config_module().get_model_config()
