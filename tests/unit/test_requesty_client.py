from adalflow.core.types import ModelType

from api.clients import RequestyClient


def test_requesty_client_uses_default_base_url(monkeypatch):
    monkeypatch.delenv("REQUESTY_BASE_URL", raising=False)
    monkeypatch.setenv("REQUESTY_API_KEY", "test-key")
    client = RequestyClient()
    assert client.base_url == "https://router.requesty.ai/v1"
    assert str(client.sync_client.base_url).startswith("https://router.requesty.ai/v1")


def test_requesty_client_base_url_override(monkeypatch):
    monkeypatch.setenv("REQUESTY_BASE_URL", "https://router.eu.requesty.ai/v1")
    monkeypatch.setenv("REQUESTY_API_KEY", "test-key")
    client = RequestyClient()
    assert client.base_url == "https://router.eu.requesty.ai/v1"


def test_requesty_client_sends_text_prompt_as_user_message(monkeypatch):
    monkeypatch.setenv("REQUESTY_API_KEY", "test-key")
    client = RequestyClient()
    api_kwargs = client.convert_inputs_to_api_kwargs(
        input="hello",
        model_kwargs={"model": "openai/gpt-4o-mini"},
        model_type=ModelType.LLM,
    )
    assert api_kwargs["messages"] == [{"role": "user", "content": "hello"}]
    assert api_kwargs["model"] == "openai/gpt-4o-mini"
