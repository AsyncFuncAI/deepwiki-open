"""Integration tests for MiniMax client with real API calls.

These tests require the MINIMAX_API_KEY environment variable to be set.
They are skipped if the key is not available.
"""
import os
import pytest

# Try to load API key from .env.local
try:
    from dotenv import load_dotenv
    env_path = os.path.expanduser("~/.env.local")
    if os.path.exists(env_path):
        load_dotenv(env_path)
    env_path2 = os.path.expanduser("/home/ximi/github_pr/.env.local")
    if os.path.exists(env_path2):
        load_dotenv(env_path2)
except ImportError:
    pass

MINIMAX_API_KEY = os.environ.get("MINIMAX_API_KEY")
pytestmark = pytest.mark.skipif(not MINIMAX_API_KEY, reason="MINIMAX_API_KEY not set")


class TestMiniMaxChatIntegration:
    """Integration tests for MiniMax chat completions."""

    def test_basic_chat_completion(self):
        """Should complete a basic chat request with MiniMax-M2.5."""
        from api.minimax_client import MiniMaxClient
        from adalflow.core.types import ModelType

        client = MiniMaxClient(api_key=MINIMAX_API_KEY)
        api_kwargs = client.convert_inputs_to_api_kwargs(
            input="Say 'hello' and nothing else.",
            model_kwargs={"model": "MiniMax-M2.5", "max_tokens": 20, "temperature": 1.0},
            model_type=ModelType.LLM,
        )
        response = client.call(api_kwargs=api_kwargs, model_type=ModelType.LLM)
        assert response is not None

        # Parse the response
        output = client.parse_chat_completion(response)
        assert output is not None
        assert output.raw_response is not None
        content = str(output.raw_response).lower()
        assert "hello" in content

    def test_highspeed_model(self):
        """Should work with MiniMax-M2.5-highspeed model."""
        from api.minimax_client import MiniMaxClient
        from adalflow.core.types import ModelType

        client = MiniMaxClient(api_key=MINIMAX_API_KEY)
        api_kwargs = client.convert_inputs_to_api_kwargs(
            input="What is 2+2? Reply with just the number.",
            model_kwargs={"model": "MiniMax-M2.5-highspeed", "max_tokens": 100, "temperature": 1.0},
            model_type=ModelType.LLM,
        )
        response = client.call(api_kwargs=api_kwargs, model_type=ModelType.LLM)
        assert response is not None

        output = client.parse_chat_completion(response)
        assert output is not None
        assert output.raw_response is not None
        # Model may include thinking tags, just verify we got a response
        assert len(str(output.raw_response)) > 0

    def test_temperature_clamping_works(self):
        """Should handle temperature=0 by clamping to 0.01."""
        from api.minimax_client import MiniMaxClient
        from adalflow.core.types import ModelType

        client = MiniMaxClient(api_key=MINIMAX_API_KEY)
        api_kwargs = client.convert_inputs_to_api_kwargs(
            input="Say 'test passed'",
            model_kwargs={"model": "MiniMax-M2.5", "max_tokens": 20, "temperature": 0},
            model_type=ModelType.LLM,
        )
        # Temperature should be clamped to 0.01
        assert api_kwargs["temperature"] == 0.01

        response = client.call(api_kwargs=api_kwargs, model_type=ModelType.LLM)
        assert response is not None
