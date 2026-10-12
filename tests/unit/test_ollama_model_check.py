from types import SimpleNamespace

import ollama
import pytest

from api.rag.rag import check_ollama_model_exists


def _fake_list(monkeypatch, names):
    response = SimpleNamespace(models=[SimpleNamespace(model=name) for name in names])
    monkeypatch.setattr(ollama.Client, "list", lambda self: response)


@pytest.mark.parametrize(
    "configured, installed, expected",
    [
        # Ollama reports untagged pulls as ':latest' (issue #579).
        ("nomic-embed-text", ["nomic-embed-text:latest"], True),
        ("nomic-embed-text:latest", ["nomic-embed-text:latest"], True),
        ("qwen3:8b", ["qwen3:8b"], True),
        ("qwen3:8b", ["qwen3:1.7b"], False),
        ("nomic-embed-text", ["nomic-embed-text:v1.5"], False),
        ("nomic-embed-text:v1.5", ["nomic-embed-text:latest"], False),
        ("localhost:5000/embed", ["localhost:5000/embed:latest"], True),
        ("nomic-embed-text", [], False),
    ],
)
def test_check_ollama_model_exists(monkeypatch, configured, installed, expected):
    _fake_list(monkeypatch, installed)
    assert check_ollama_model_exists(configured, "http://localhost:11434") is expected
