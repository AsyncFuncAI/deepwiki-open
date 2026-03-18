"""Unit tests for MiniMax client."""
import os
import pytest
from unittest.mock import patch, MagicMock

# Ensure MINIMAX_API_KEY is set for tests
os.environ.setdefault("MINIMAX_API_KEY", "test-minimax-key")

from api.minimax_client import MiniMaxClient
from adalflow.core.types import ModelType


class TestMiniMaxClientInit:
    """Tests for MiniMaxClient initialization."""

    def test_creates_instance_with_api_key(self):
        """Should create a MiniMaxClient instance with explicit API key."""
        client = MiniMaxClient(api_key="test-key")
        assert client is not None
        assert client.base_url == "https://api.minimax.io/v1"

    def test_default_base_url(self):
        """Should use MiniMax default base URL when not specified."""
        client = MiniMaxClient(api_key="test-key")
        assert client.base_url == "https://api.minimax.io/v1"

    def test_custom_base_url(self):
        """Should use custom base URL when provided."""
        client = MiniMaxClient(api_key="test-key", base_url="https://api.minimaxi.com/v1")
        assert client.base_url == "https://api.minimaxi.com/v1"

    def test_env_base_url(self):
        """Should use base URL from environment variable."""
        with patch.dict(os.environ, {"MINIMAX_BASE_URL": "https://custom.minimax.io/v1"}):
            client = MiniMaxClient(api_key="test-key")
            assert client.base_url == "https://custom.minimax.io/v1"

    def test_api_key_from_env(self):
        """Should read API key from MINIMAX_API_KEY environment variable."""
        with patch.dict(os.environ, {"MINIMAX_API_KEY": "env-test-key"}):
            client = MiniMaxClient()
            assert client is not None

    def test_raises_without_api_key(self):
        """Should raise ValueError when no API key is available."""
        with patch.dict(os.environ, {}, clear=True):
            # Remove all potential API key sources
            env_clean = {k: v for k, v in os.environ.items() if "MINIMAX" not in k}
            with patch.dict(os.environ, env_clean, clear=True):
                with pytest.raises(ValueError, match="MINIMAX_API_KEY"):
                    MiniMaxClient()


class TestMiniMaxClientTemperature:
    """Tests for temperature clamping in MiniMaxClient."""

    def setup_method(self):
        self.client = MiniMaxClient(api_key="test-key")

    def test_temperature_zero_clamped(self):
        """Should clamp temperature=0 to 0.01 (MiniMax minimum)."""
        kwargs = self.client.convert_inputs_to_api_kwargs(
            input="test",
            model_kwargs={"model": "MiniMax-M2.5", "temperature": 0},
            model_type=ModelType.LLM,
        )
        assert kwargs["temperature"] == 0.01

    def test_temperature_negative_clamped(self):
        """Should clamp negative temperature to 0.01."""
        kwargs = self.client.convert_inputs_to_api_kwargs(
            input="test",
            model_kwargs={"model": "MiniMax-M2.5", "temperature": -0.5},
            model_type=ModelType.LLM,
        )
        assert kwargs["temperature"] == 0.01

    def test_temperature_above_max_clamped(self):
        """Should clamp temperature > 1.0 to 1.0."""
        kwargs = self.client.convert_inputs_to_api_kwargs(
            input="test",
            model_kwargs={"model": "MiniMax-M2.5", "temperature": 1.5},
            model_type=ModelType.LLM,
        )
        assert kwargs["temperature"] == 1.0

    def test_temperature_valid_passes_through(self):
        """Should pass through valid temperature values."""
        kwargs = self.client.convert_inputs_to_api_kwargs(
            input="test",
            model_kwargs={"model": "MiniMax-M2.5", "temperature": 0.7},
            model_type=ModelType.LLM,
        )
        assert kwargs["temperature"] == 0.7

    def test_temperature_one_passes_through(self):
        """Should pass through temperature=1.0 (MiniMax maximum)."""
        kwargs = self.client.convert_inputs_to_api_kwargs(
            input="test",
            model_kwargs={"model": "MiniMax-M2.5", "temperature": 1.0},
            model_type=ModelType.LLM,
        )
        assert kwargs["temperature"] == 1.0

    def test_no_temperature_no_change(self):
        """Should not add temperature if not provided."""
        kwargs = self.client.convert_inputs_to_api_kwargs(
            input="test",
            model_kwargs={"model": "MiniMax-M2.5"},
            model_type=ModelType.LLM,
        )
        assert "temperature" not in kwargs


class TestMiniMaxClientResponseFormat:
    """Tests for response_format removal in MiniMaxClient."""

    def setup_method(self):
        self.client = MiniMaxClient(api_key="test-key")

    def test_response_format_removed(self):
        """Should remove response_format parameter (not supported by MiniMax)."""
        kwargs = self.client.convert_inputs_to_api_kwargs(
            input="test",
            model_kwargs={
                "model": "MiniMax-M2.5",
                "response_format": {"type": "json_object"},
            },
            model_type=ModelType.LLM,
        )
        assert "response_format" not in kwargs

    def test_other_params_preserved(self):
        """Should preserve other valid parameters when removing response_format."""
        kwargs = self.client.convert_inputs_to_api_kwargs(
            input="test",
            model_kwargs={
                "model": "MiniMax-M2.5",
                "temperature": 0.8,
                "response_format": {"type": "json_object"},
                "top_p": 0.9,
            },
            model_type=ModelType.LLM,
        )
        assert "response_format" not in kwargs
        assert kwargs["temperature"] == 0.8
        assert kwargs["top_p"] == 0.9
        assert kwargs["model"] == "MiniMax-M2.5"


class TestMiniMaxClientMessages:
    """Tests for message conversion in MiniMaxClient."""

    def setup_method(self):
        self.client = MiniMaxClient(api_key="test-key")

    def test_string_input_to_messages(self):
        """Should convert string input to messages format."""
        kwargs = self.client.convert_inputs_to_api_kwargs(
            input="Hello, MiniMax!",
            model_kwargs={"model": "MiniMax-M2.5"},
            model_type=ModelType.LLM,
        )
        assert "messages" in kwargs
        assert len(kwargs["messages"]) == 1
        assert kwargs["messages"][0]["role"] == "user"
        assert kwargs["messages"][0]["content"] == "Hello, MiniMax!"

    def test_model_preserved(self):
        """Should preserve model in kwargs."""
        kwargs = self.client.convert_inputs_to_api_kwargs(
            input="test",
            model_kwargs={"model": "MiniMax-M2.5-highspeed"},
            model_type=ModelType.LLM,
        )
        assert kwargs["model"] == "MiniMax-M2.5-highspeed"


class TestMiniMaxConfigIntegration:
    """Tests for MiniMax integration with config system."""

    def test_minimax_in_client_classes(self):
        """Should have MiniMaxClient registered in CLIENT_CLASSES."""
        from api.config import CLIENT_CLASSES
        assert "MiniMaxClient" in CLIENT_CLASSES
        assert CLIENT_CLASSES["MiniMaxClient"] == MiniMaxClient

    def test_minimax_provider_in_generator_config(self):
        """Should have minimax provider in generator config."""
        import json
        from pathlib import Path

        config_path = Path(__file__).parent.parent.parent / "api" / "config" / "generator.json"
        with open(config_path) as f:
            config = json.load(f)

        assert "minimax" in config["providers"]
        minimax_config = config["providers"]["minimax"]
        assert minimax_config["default_model"] == "MiniMax-M2.7"
        assert "MiniMax-M2.7" in minimax_config["models"]
        assert "MiniMax-M2.5" in minimax_config["models"]
        assert "MiniMax-M2.5-highspeed" in minimax_config["models"]
        assert minimax_config["client_class"] == "MiniMaxClient"
        assert minimax_config["supportsCustomModel"] is True

    def test_minimax_model_temperature(self):
        """Should have temperature=1.0 for MiniMax models in config."""
        import json
        from pathlib import Path

        config_path = Path(__file__).parent.parent.parent / "api" / "config" / "generator.json"
        with open(config_path) as f:
            config = json.load(f)

        for model_id in ["MiniMax-M2.7", "MiniMax-M2.5", "MiniMax-M2.5-highspeed"]:
            assert config["providers"]["minimax"]["models"][model_id]["temperature"] == 1.0

    def test_get_model_config_minimax(self):
        """Should be able to get model config for minimax provider."""
        from api.config import get_model_config
        config = get_model_config(provider="minimax", model="MiniMax-M2.7")
        assert config["model_client"] == MiniMaxClient
        assert config["model_kwargs"]["model"] == "MiniMax-M2.7"
