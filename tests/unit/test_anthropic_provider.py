"""Unit tests for the Anthropic provider integration."""

import os
import sys
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_client(api_key="test-key-123"):
    """Return an AnthropicClient with the real anthropic SDK (no network calls)."""
    from api.anthropic_client import AnthropicClient
    return AnthropicClient(api_key=api_key)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def set_anthropic_key(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key-123")


# ---------------------------------------------------------------------------
# AnthropicClient – initialisation
# ---------------------------------------------------------------------------

class TestAnthropicClientInit:
    def test_init_uses_env_key(self, monkeypatch):
        monkeypatch.setenv("ANTHROPIC_API_KEY", "from-env")
        from api.anthropic_client import AnthropicClient
        client = AnthropicClient()
        assert client._api_key == "from-env"

    def test_init_explicit_key_overrides_env(self, monkeypatch):
        monkeypatch.setenv("ANTHROPIC_API_KEY", "from-env")
        from api.anthropic_client import AnthropicClient
        client = AnthropicClient(api_key="explicit")
        assert client._api_key == "explicit"

    def test_init_raises_without_key(self, monkeypatch):
        monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
        from api.anthropic_client import AnthropicClient
        with pytest.raises(ValueError, match="ANTHROPIC_API_KEY"):
            AnthropicClient()


# ---------------------------------------------------------------------------
# AnthropicClient – convert_inputs_to_api_kwargs
# ---------------------------------------------------------------------------

class TestConvertInputs:
    @pytest.fixture(autouse=True)
    def client(self):
        self.client = _make_client()

    def test_plain_user_message(self):
        from adalflow.core.types import ModelType
        kwargs = self.client.convert_inputs_to_api_kwargs(
            input="Hello",
            model_kwargs={"model": "claude-sonnet-4-6"},
            model_type=ModelType.LLM,
        )
        assert kwargs["messages"] == [{"role": "user", "content": "Hello"}]
        assert "system" not in kwargs

    def test_system_and_user_tags_are_split(self):
        from adalflow.core.types import ModelType
        prompt = (
            "<START_OF_SYSTEM_PROMPT>You are helpful.<END_OF_SYSTEM_PROMPT>"
            "<START_OF_USER_PROMPT>Tell me a joke.<END_OF_USER_PROMPT>"
        )
        kwargs = self.client.convert_inputs_to_api_kwargs(
            input=prompt,
            model_kwargs={"model": "claude-sonnet-4-6"},
            model_type=ModelType.LLM,
        )
        assert kwargs["system"] == "You are helpful."
        assert kwargs["messages"] == [{"role": "user", "content": "Tell me a joke."}]

    def test_default_max_tokens_injected(self):
        from adalflow.core.types import ModelType
        kwargs = self.client.convert_inputs_to_api_kwargs(
            input="Hi",
            model_kwargs={},
            model_type=ModelType.LLM,
        )
        assert kwargs["max_tokens"] == 8096

    def test_explicit_max_tokens_respected(self):
        from adalflow.core.types import ModelType
        kwargs = self.client.convert_inputs_to_api_kwargs(
            input="Hi",
            model_kwargs={"max_tokens": 1024},
            model_type=ModelType.LLM,
        )
        assert kwargs["max_tokens"] == 1024

    def test_non_llm_model_type_raises(self):
        from adalflow.core.types import ModelType
        with pytest.raises(ValueError, match="only supports LLM"):
            self.client.convert_inputs_to_api_kwargs(
                input="Hi",
                model_kwargs={},
                model_type=ModelType.EMBEDDER,
            )


# ---------------------------------------------------------------------------
# AnthropicClient – parse_chat_completion
# ---------------------------------------------------------------------------

class TestParseChatCompletion:
    @pytest.fixture(autouse=True)
    def client(self):
        self.client = _make_client()

    def _make_completion(self, text, input_tokens=10, output_tokens=20):
        completion = MagicMock()
        completion.content = [MagicMock(text=text)]
        completion.usage.input_tokens = input_tokens
        completion.usage.output_tokens = output_tokens
        return completion

    def test_successful_parse(self):
        result = self.client.parse_chat_completion(self._make_completion("Hello!"))
        assert result.raw_response == "Hello!"
        assert result.error is None
        assert result.usage.prompt_tokens == 10
        assert result.usage.completion_tokens == 20
        assert result.usage.total_tokens == 30

    def test_parse_error_returns_error_output(self):
        bad = MagicMock()
        bad.content = None  # triggers AttributeError on [0].text
        result = self.client.parse_chat_completion(bad)
        assert result.error is not None


# ---------------------------------------------------------------------------
# AnthropicClient – call
# ---------------------------------------------------------------------------

class TestCall:
    @pytest.fixture(autouse=True)
    def client_with_mock(self):
        self.client = _make_client()
        # Replace the underlying sync client so no real HTTP calls are made
        self.mock_sync = MagicMock()
        self.mock_sync.messages.create.return_value = MagicMock(
            content=[MagicMock(text="ok")],
            usage=MagicMock(input_tokens=5, output_tokens=10),
        )
        self.client.sync_client = self.mock_sync

    def test_call_invokes_messages_create(self):
        from adalflow.core.types import ModelType
        self.client.call(
            {"model": "claude-sonnet-4-6", "messages": [{"role": "user", "content": "hi"}],
             "max_tokens": 100},
            model_type=ModelType.LLM,
        )
        self.mock_sync.messages.create.assert_called_once()

    def test_call_strips_stream_key(self):
        from adalflow.core.types import ModelType
        self.client.call(
            {"model": "claude-sonnet-4-6", "messages": [{"role": "user", "content": "hi"}],
             "max_tokens": 100, "stream": True},
            model_type=ModelType.LLM,
        )
        call_kwargs = self.mock_sync.messages.create.call_args[1]
        assert "stream" not in call_kwargs

    def test_call_non_llm_raises(self):
        from adalflow.core.types import ModelType
        with pytest.raises(ValueError, match="only supports LLM"):
            self.client.call({}, model_type=ModelType.EMBEDDER)


# ---------------------------------------------------------------------------
# Config – Anthropic provider is registered
# ---------------------------------------------------------------------------

class TestConfigAnthropicProvider:
    def test_anthropic_in_client_classes(self):
        from api.config import CLIENT_CLASSES
        assert "AnthropicClient" in CLIENT_CLASSES

    def test_anthropic_client_class_is_correct_type(self):
        from api.config import CLIENT_CLASSES
        from api.anthropic_client import AnthropicClient
        assert CLIENT_CLASSES["AnthropicClient"] is AnthropicClient

    def test_anthropic_provider_in_generator_config(self):
        from api.config import configs
        assert "anthropic" in configs.get("providers", {}), \
            "anthropic provider must be present in generator config"

    def test_anthropic_provider_has_model_client(self):
        from api.config import configs
        from api.anthropic_client import AnthropicClient
        provider = configs["providers"]["anthropic"]
        assert provider.get("model_client") is AnthropicClient

    def test_anthropic_provider_has_default_model(self):
        from api.config import configs
        provider = configs["providers"]["anthropic"]
        assert provider.get("default_model") is not None

    def test_get_model_config_anthropic(self):
        from api.config import get_model_config
        from api.anthropic_client import AnthropicClient
        config = get_model_config(provider="anthropic")
        assert config["model_client"] is AnthropicClient
        assert "model" in config["model_kwargs"]

    def test_get_model_config_anthropic_custom_model(self):
        from api.config import get_model_config
        config = get_model_config(provider="anthropic", model="claude-opus-4-6")
        assert config["model_kwargs"]["model"] == "claude-opus-4-6"
