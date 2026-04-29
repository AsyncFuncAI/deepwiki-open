"""Tests for the LiteLLM ModelClient integration."""

import sys
import types
from unittest import mock

import pytest

sys.path.insert(0, ".")
from api.litellm_client import LiteLLMClient
from adalflow.core.types import ModelType, CompletionUsage


def _make_mock_response(content="OK", prompt_tokens=10, completion_tokens=5):
    """Build a mock LiteLLM ModelResponse."""
    msg = mock.MagicMock()
    msg.content = content
    msg.role = "assistant"

    choice = mock.MagicMock()
    choice.message = msg
    choice.index = 0
    choice.finish_reason = "stop"

    usage = mock.MagicMock()
    usage.prompt_tokens = prompt_tokens
    usage.completion_tokens = completion_tokens
    usage.total_tokens = prompt_tokens + completion_tokens

    resp = mock.MagicMock()
    resp.choices = [choice]
    resp.usage = usage
    return resp


def _make_mock_embedding_response(dims=1536):
    """Build a mock LiteLLM EmbeddingResponse."""
    emb_data = mock.MagicMock()
    emb_data.embedding = [0.1] * dims
    emb_data.index = 0

    resp = mock.MagicMock()
    resp.data = [emb_data]
    return resp


class TestLiteLLMClientInit:
    def test_default_init(self):
        client = LiteLLMClient()
        assert client._api_key is None
        assert client._base_url is None
        assert client.sync_client is not None

    def test_init_with_params(self):
        client = LiteLLMClient(api_key="test-key", base_url="https://proxy.example.com")
        assert client._api_key == "test-key"
        assert client._base_url == "https://proxy.example.com"


class TestConvertInputs:
    def test_llm_string_input(self):
        client = LiteLLMClient()
        kwargs = client.convert_inputs_to_api_kwargs(
            input="Hello",
            model_kwargs={"model": "openai/gpt-4o"},
            model_type=ModelType.LLM,
        )
        assert kwargs["messages"] == [{"role": "user", "content": "Hello"}]
        assert kwargs["model"] == "openai/gpt-4o"

    def test_llm_message_list_input(self):
        client = LiteLLMClient()
        msgs = [
            {"role": "system", "content": "You are helpful."},
            {"role": "user", "content": "Hi"},
        ]
        kwargs = client.convert_inputs_to_api_kwargs(
            input=msgs,
            model_kwargs={"model": "anthropic/claude-sonnet-4-20250514"},
            model_type=ModelType.LLM,
        )
        assert kwargs["messages"] == msgs
        assert kwargs["model"] == "anthropic/claude-sonnet-4-20250514"

    def test_embedder_string_input(self):
        client = LiteLLMClient()
        kwargs = client.convert_inputs_to_api_kwargs(
            input="hello",
            model_kwargs={"model": "text-embedding-3-small"},
            model_type=ModelType.EMBEDDER,
        )
        assert kwargs["input"] == ["hello"]

    def test_embedder_list_input(self):
        client = LiteLLMClient()
        kwargs = client.convert_inputs_to_api_kwargs(
            input=["hello", "world"],
            model_kwargs={"model": "text-embedding-3-small"},
            model_type=ModelType.EMBEDDER,
        )
        assert kwargs["input"] == ["hello", "world"]

    def test_unsupported_model_type(self):
        client = LiteLLMClient()
        with pytest.raises(ValueError, match="not supported"):
            client.convert_inputs_to_api_kwargs(
                input="x", model_kwargs={}, model_type=ModelType.IMAGE_GENERATION
            )


class TestCallMocked:
    def test_completion_dispatches_correctly(self):
        client = LiteLLMClient()
        mock_resp = _make_mock_response("test response")

        fake_litellm = types.ModuleType("litellm")
        fake_litellm.completion = mock.MagicMock(return_value=mock_resp)
        fake_litellm.embedding = mock.MagicMock()
        fake_litellm.acompletion = mock.AsyncMock()
        fake_litellm.aembedding = mock.AsyncMock()

        with mock.patch.dict(sys.modules, {"litellm": fake_litellm}):
            kwargs = {
                "model": "openai/gpt-4o",
                "messages": [{"role": "user", "content": "hi"}],
            }
            result = client.call(api_kwargs=kwargs, model_type=ModelType.LLM)

            fake_litellm.completion.assert_called_once()
            call_kwargs = fake_litellm.completion.call_args
            assert call_kwargs.kwargs["drop_params"] is True
            assert call_kwargs.kwargs["model"] == "openai/gpt-4o"
            assert result.choices[0].message.content == "test response"

    def test_embedding_dispatches_correctly(self):
        client = LiteLLMClient()
        mock_resp = _make_mock_embedding_response()

        fake_litellm = types.ModuleType("litellm")
        fake_litellm.completion = mock.MagicMock()
        fake_litellm.embedding = mock.MagicMock(return_value=mock_resp)

        with mock.patch.dict(sys.modules, {"litellm": fake_litellm}):
            kwargs = {
                "model": "text-embedding-3-small",
                "input": ["hello"],
            }
            result = client.call(api_kwargs=kwargs, model_type=ModelType.EMBEDDER)

            fake_litellm.embedding.assert_called_once()
            emb_call_kwargs = fake_litellm.embedding.call_args
            assert emb_call_kwargs.kwargs["drop_params"] is True

    def test_api_key_forwarded_when_set(self):
        client = LiteLLMClient(api_key="sk-test123")
        mock_resp = _make_mock_response()

        fake_litellm = types.ModuleType("litellm")
        fake_litellm.completion = mock.MagicMock(return_value=mock_resp)

        with mock.patch.dict(sys.modules, {"litellm": fake_litellm}):
            kwargs = {
                "model": "openai/gpt-4o",
                "messages": [{"role": "user", "content": "hi"}],
            }
            client.call(api_kwargs=kwargs, model_type=ModelType.LLM)
            call_kwargs = fake_litellm.completion.call_args
            assert call_kwargs.kwargs["api_key"] == "sk-test123"

    def test_api_key_omitted_when_blank(self):
        client = LiteLLMClient()
        mock_resp = _make_mock_response()

        fake_litellm = types.ModuleType("litellm")
        fake_litellm.completion = mock.MagicMock(return_value=mock_resp)

        with mock.patch.dict(sys.modules, {"litellm": fake_litellm}):
            kwargs = {
                "model": "openai/gpt-4o",
                "messages": [{"role": "user", "content": "hi"}],
            }
            client.call(api_kwargs=kwargs, model_type=ModelType.LLM)
            call_kwargs = fake_litellm.completion.call_args
            assert "api_key" not in call_kwargs.kwargs

    def test_base_url_forwarded_when_set(self):
        client = LiteLLMClient(base_url="https://proxy.local")
        mock_resp = _make_mock_response()

        fake_litellm = types.ModuleType("litellm")
        fake_litellm.completion = mock.MagicMock(return_value=mock_resp)

        with mock.patch.dict(sys.modules, {"litellm": fake_litellm}):
            kwargs = {
                "model": "openai/gpt-4o",
                "messages": [{"role": "user", "content": "hi"}],
            }
            client.call(api_kwargs=kwargs, model_type=ModelType.LLM)
            call_kwargs = fake_litellm.completion.call_args
            assert call_kwargs.kwargs["api_base"] == "https://proxy.local"


class TestParseCompletion:
    def test_parse_chat_completion(self):
        client = LiteLLMClient()
        mock_resp = _make_mock_response("Hello world", 10, 5)

        output = client.parse_chat_completion(mock_resp)
        assert output.raw_response == "Hello world"
        assert output.usage.completion_tokens == 5
        assert output.usage.prompt_tokens == 10

    def test_track_usage(self):
        client = LiteLLMClient()
        mock_resp = _make_mock_response("x", 20, 30)

        usage = client.track_completion_usage(mock_resp)
        assert usage.prompt_tokens == 20
        assert usage.completion_tokens == 30
        assert usage.total_tokens == 50


class TestSerialization:
    def test_from_dict(self):
        client = LiteLLMClient.from_dict({"api_key": "test", "base_url": "http://x"})
        assert client._api_key == "test"
        assert client._base_url == "http://x"

    def test_to_dict_excludes_clients(self):
        client = LiteLLMClient()
        d = client.to_dict()
        assert "sync_client" not in str(d)


class TestConfigRegistration:
    def test_litellm_in_client_classes(self):
        pytest.importorskip("boto3")
        from api.config import CLIENT_CLASSES

        assert "LiteLLMClient" in CLIENT_CLASSES
        assert CLIENT_CLASSES["LiteLLMClient"] is LiteLLMClient

    def test_litellm_provider_in_generator_config(self):
        import json
        from pathlib import Path

        config_path = Path("api/config/generator.json")
        config = json.loads(config_path.read_text())
        assert "litellm" in config["providers"]
        assert config["providers"]["litellm"]["client_class"] == "LiteLLMClient"
        assert config["providers"]["litellm"]["supportsCustomModel"] is True
