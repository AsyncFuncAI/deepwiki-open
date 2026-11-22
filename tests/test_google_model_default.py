from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from api import config
from api.routers import system


@pytest.mark.parametrize(
    "filename", ["generator.json", "generator.litellm.json"]
)
def test_google_default_and_first_selection_use_flash_lite(monkeypatch, filename):
    monkeypatch.setattr(config, "CONFIG_DIR", None)
    bundled = config.load_json_config(filename)
    provider = bundled["providers"]["google"]
    provider["model_client"] = config.CLIENT_CLASSES["GoogleGenAIClient"]
    monkeypatch.setitem(config.configs, "providers", {"google": provider})

    assert config.get_model_config("google")["model_kwargs"] == {
        "model": "gemini-3.5-flash-lite",
    }
    assert config.get_model_config("google", "gemini-2.5-flash")["model_kwargs"] == {
        "model": "gemini-2.5-flash",
        "temperature": 1.0,
        "top_p": 0.8,
        "top_k": 20,
    }

    app = FastAPI()
    app.include_router(system.router)
    with TestClient(app) as client:
        response = client.get("/models/config")

    assert response.status_code == 200
    assert response.json()["providers"][0]["models"][0]["id"] == "gemini-3.5-flash-lite"


def test_fallback_model_config_uses_flash_lite(monkeypatch):
    monkeypatch.delitem(config.configs, "providers")
    app = FastAPI()
    app.include_router(system.router)
    with TestClient(app) as client:
        response = client.get("/models/config")

    assert response.status_code == 200
    assert response.json()["providers"][0]["models"][0]["id"] == "gemini-3.5-flash-lite"
