import json
from pathlib import Path

from api.clients.llmtr import DEFAULT_BASE_URL, LLMTRClient
from api.config import CLIENT_CLASSES, _DEFAULT_PROVIDER_MAP, load_json_config


def test_llmtr_client_defaults_to_public_endpoint(monkeypatch):
    monkeypatch.delenv("LLMTR_BASE_URL", raising=False)
    monkeypatch.setenv("LLMTR_API_KEY", "test-key")
    client = LLMTRClient(api_key="test-key")
    assert client.base_url == DEFAULT_BASE_URL
    assert DEFAULT_BASE_URL == "https://llmtr.com/v1"


def test_llmtr_is_a_bundled_generator_provider():
    bundled = load_json_config("generator.json")
    provider = bundled["providers"]["llmtr"]
    assert provider["client_class"] == "LLMTRClient"
    assert provider["default_model"] == "qwen/qwen3.8-27b-free"
    assert "qwen/qwen3.8-27b-free" in provider["models"]
    assert "minimax/minimax-m3.1-flash" in provider["models"]
    assert CLIENT_CLASSES["LLMTRClient"].__name__ == "LLMTRClient"
    assert _DEFAULT_PROVIDER_MAP["llmtr"].__name__ == "LLMTRClient"


def test_generator_json_is_valid():
    path = Path("api/config/generator.json")
    data = json.loads(path.read_text())
    assert "llmtr" in data["providers"]
