"""Tests for the LiteLLM ModelClient integration."""

import asyncio
import json
import sys
import types
from pathlib import Path
from unittest import mock

import pytest

sys.path.insert(0, ".")
from api.litellm_client import LiteLLMClient, _is_retryable, handle_streaming_response
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


def _make_mock_stream_chunks(text="Hello"):
    """Build mock streaming chunks."""
    chunks = []
    for char in text:
        delta = mock.MagicMock()
        delta.content = char
        choice = mock.MagicMock()
        choice.delta = delta
        choice.finish_reason = None
        chunk = mock.MagicMock()
        chunk.choices = [choice]
        chunks.append(chunk)

    delta_final = mock.MagicMock()
    delta_final.content = None
    choice_final = mock.MagicMock()
    choice_final.delta = delta_final
    choice_final.finish_reason = "stop"
    chunk_final = mock.MagicMock()
    chunk_final.choices = [choice_final]
    chunks.append(chunk_final)
    return chunks


class TestLiteLLMClientInit:
    def test_default_init(self):
        client = LiteLLMClient()
        assert client._api_key is None
        assert client._base_url is None
        assert client._input_type == "text"
        assert client.sync_client is not None

    def test_init_with_params(self):
        client = LiteLLMClient(api_key="test-key", base_url="https://proxy.example.com")
        assert client._api_key == "test-key"
        assert client._base_url == "https://proxy.example.com"

    def test_init_with_messages_input_type(self):
        client = LiteLLMClient(input_type="messages")
        assert client._input_type == "messages"


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

    def test_llm_tagged_messages_input(self):
        client = LiteLLMClient(input_type="messages")
        tagged = (
            "<START_OF_SYSTEM_PROMPT>\nYou are helpful.\n<END_OF_SYSTEM_PROMPT>\n"
            "<START_OF_USER_PROMPT>\nWhat is 2+2?\n<END_OF_USER_PROMPT>"
        )
        kwargs = client.convert_inputs_to_api_kwargs(
            input=tagged,
            model_kwargs={"model": "openai/gpt-4o"},
            model_type=ModelType.LLM,
        )
        assert len(kwargs["messages"]) == 2
        assert kwargs["messages"][0]["role"] == "system"
        assert "helpful" in kwargs["messages"][0]["content"]
        assert kwargs["messages"][1]["role"] == "user"
        assert "2+2" in kwargs["messages"][1]["content"]

    def test_llm_tagged_messages_no_match_falls_back(self):
        client = LiteLLMClient(input_type="messages")
        kwargs = client.convert_inputs_to_api_kwargs(
            input="plain text no tags",
            model_kwargs={"model": "openai/gpt-4o"},
            model_type=ModelType.LLM,
        )
        assert kwargs["messages"] == [{"role": "user", "content": "plain text no tags"}]

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

    def test_none_model_kwargs_handled(self):
        client = LiteLLMClient()
        kwargs = client.convert_inputs_to_api_kwargs(
            input="hello", model_kwargs=None, model_type=ModelType.LLM
        )
        assert kwargs["messages"] == [{"role": "user", "content": "hello"}]


class TestCallMocked:
    def test_completion_dispatches_correctly(self):
        client = LiteLLMClient()
        mock_resp = _make_mock_response("test response")

        fake_litellm = types.ModuleType("litellm")
        fake_litellm.completion = mock.MagicMock(return_value=mock_resp)
        fake_litellm.embedding = mock.MagicMock()

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
        fake_litellm.embedding = mock.MagicMock(return_value=mock_resp)

        with mock.patch.dict(sys.modules, {"litellm": fake_litellm}):
            kwargs = {"model": "text-embedding-3-small", "input": ["hello"]}
            result = client.call(api_kwargs=kwargs, model_type=ModelType.EMBEDDER)

            fake_litellm.embedding.assert_called_once()
            assert fake_litellm.embedding.call_args.kwargs["drop_params"] is True

    def test_api_key_forwarded_when_set(self):
        client = LiteLLMClient(api_key="sk-test123")
        mock_resp = _make_mock_response()
        fake_litellm = types.ModuleType("litellm")
        fake_litellm.completion = mock.MagicMock(return_value=mock_resp)

        with mock.patch.dict(sys.modules, {"litellm": fake_litellm}):
            client.call(
                api_kwargs={"model": "x", "messages": [{"role": "user", "content": "hi"}]},
                model_type=ModelType.LLM,
            )
            assert fake_litellm.completion.call_args.kwargs["api_key"] == "sk-test123"

    def test_api_key_omitted_when_blank(self):
        client = LiteLLMClient()
        mock_resp = _make_mock_response()
        fake_litellm = types.ModuleType("litellm")
        fake_litellm.completion = mock.MagicMock(return_value=mock_resp)

        with mock.patch.dict(sys.modules, {"litellm": fake_litellm}):
            client.call(
                api_kwargs={"model": "x", "messages": [{"role": "user", "content": "hi"}]},
                model_type=ModelType.LLM,
            )
            assert "api_key" not in fake_litellm.completion.call_args.kwargs

    def test_base_url_forwarded_when_set(self):
        client = LiteLLMClient(base_url="https://proxy.local")
        mock_resp = _make_mock_response()
        fake_litellm = types.ModuleType("litellm")
        fake_litellm.completion = mock.MagicMock(return_value=mock_resp)

        with mock.patch.dict(sys.modules, {"litellm": fake_litellm}):
            client.call(
                api_kwargs={"model": "x", "messages": [{"role": "user", "content": "hi"}]},
                model_type=ModelType.LLM,
            )
            assert fake_litellm.completion.call_args.kwargs["api_base"] == "https://proxy.local"

    def test_unsupported_model_type_in_call(self):
        client = LiteLLMClient()
        fake_litellm = types.ModuleType("litellm")
        with mock.patch.dict(sys.modules, {"litellm": fake_litellm}):
            with pytest.raises(ValueError, match="not supported"):
                client.call(api_kwargs={}, model_type=ModelType.IMAGE_GENERATION)

    def test_streaming_call(self):
        client = LiteLLMClient()
        chunks = _make_mock_stream_chunks("Hi")
        fake_litellm = types.ModuleType("litellm")
        fake_litellm.completion = mock.MagicMock(return_value=iter(chunks))

        with mock.patch.dict(sys.modules, {"litellm": fake_litellm}):
            result = client.call(
                api_kwargs={"model": "x", "messages": [{"role": "user", "content": "hi"}], "stream": True},
                model_type=ModelType.LLM,
            )
            assert fake_litellm.completion.call_args.kwargs["stream"] is True


class TestAcallMocked:
    def test_acall_completion(self):
        client = LiteLLMClient()
        mock_resp = _make_mock_response("async response")
        fake_litellm = types.ModuleType("litellm")
        fake_litellm.acompletion = mock.AsyncMock(return_value=mock_resp)
        fake_litellm.aembedding = mock.AsyncMock()

        with mock.patch.dict(sys.modules, {"litellm": fake_litellm}):
            result = asyncio.get_event_loop().run_until_complete(
                client.acall(
                    api_kwargs={"model": "x", "messages": [{"role": "user", "content": "hi"}]},
                    model_type=ModelType.LLM,
                )
            )
            fake_litellm.acompletion.assert_called_once()
            assert fake_litellm.acompletion.call_args.kwargs["drop_params"] is True
            assert result.choices[0].message.content == "async response"

    def test_acall_embedding(self):
        client = LiteLLMClient()
        mock_resp = _make_mock_embedding_response()
        fake_litellm = types.ModuleType("litellm")
        fake_litellm.aembedding = mock.AsyncMock(return_value=mock_resp)

        with mock.patch.dict(sys.modules, {"litellm": fake_litellm}):
            result = asyncio.get_event_loop().run_until_complete(
                client.acall(
                    api_kwargs={"model": "text-embedding-3-small", "input": ["hello"]},
                    model_type=ModelType.EMBEDDER,
                )
            )
            fake_litellm.aembedding.assert_called_once()

    def test_acall_api_key_forwarded(self):
        client = LiteLLMClient(api_key="sk-async-key")
        mock_resp = _make_mock_response()
        fake_litellm = types.ModuleType("litellm")
        fake_litellm.acompletion = mock.AsyncMock(return_value=mock_resp)

        with mock.patch.dict(sys.modules, {"litellm": fake_litellm}):
            asyncio.get_event_loop().run_until_complete(
                client.acall(
                    api_kwargs={"model": "x", "messages": [{"role": "user", "content": "hi"}]},
                    model_type=ModelType.LLM,
                )
            )
            assert fake_litellm.acompletion.call_args.kwargs["api_key"] == "sk-async-key"

    def test_acall_unsupported_model_type(self):
        client = LiteLLMClient()
        fake_litellm = types.ModuleType("litellm")
        with mock.patch.dict(sys.modules, {"litellm": fake_litellm}):
            with pytest.raises(ValueError, match="not supported"):
                asyncio.get_event_loop().run_until_complete(
                    client.acall(api_kwargs={}, model_type=ModelType.IMAGE_GENERATION)
                )


class TestStreamingHandler:
    def test_handle_streaming_response(self):
        chunks = _make_mock_stream_chunks("OK")
        result = list(handle_streaming_response(iter(chunks)))
        assert "".join(result) == "OK"

    def test_handle_streaming_with_none_content(self):
        delta = mock.MagicMock()
        delta.content = None
        choice = mock.MagicMock()
        choice.delta = delta
        chunk = mock.MagicMock()
        chunk.choices = [choice]
        result = list(handle_streaming_response(iter([chunk])))
        assert result == []

    def test_handle_streaming_with_empty_choices(self):
        chunk = mock.MagicMock()
        chunk.choices = []
        result = list(handle_streaming_response(iter([chunk])))
        assert result == []


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

    def test_track_usage_missing_usage(self):
        client = LiteLLMClient()
        mock_resp = mock.MagicMock(spec=[])
        usage = client.track_completion_usage(mock_resp)
        assert usage.completion_tokens is None

    def test_parse_error_in_parser(self):
        client = LiteLLMClient(chat_completion_parser=lambda c: 1 / 0)
        mock_resp = _make_mock_response()
        output = client.parse_chat_completion(mock_resp)
        assert output.error is not None
        assert "division by zero" in output.error


class TestRetryPredicate:
    def test_rate_limit_is_retryable(self):
        exc = type("RateLimitError", (Exception,), {})()
        exc.__class__.__module__ = "litellm.exceptions"
        exc.__class__.__qualname__ = "RateLimitError"
        assert _is_retryable(exc)

    def test_auth_error_is_not_retryable(self):
        exc = type("AuthenticationError", (Exception,), {})()
        exc.__class__.__module__ = "litellm.exceptions"
        exc.__class__.__qualname__ = "AuthenticationError"
        assert not _is_retryable(exc)

    def test_value_error_is_not_retryable(self):
        assert not _is_retryable(ValueError("bad model"))


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
        config_path = Path("api/config/generator.json")
        config = json.loads(config_path.read_text())
        assert "litellm" in config["providers"]
        assert config["providers"]["litellm"]["client_class"] == "LiteLLMClient"
        assert config["providers"]["litellm"]["supportsCustomModel"] is True
