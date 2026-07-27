"""
Tests for the dynamic model discovery feature.

When OPENAI_BASE_URL is set, the /models/config endpoint should query
the custom endpoint's /v1/models API to discover available models instead
of using the static generator.json configuration.
"""

import os
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from contextlib import asynccontextmanager

# We test the helper function directly
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


@pytest.fixture
def mock_openai_models_response():
    """Typical response from an OpenAI-compatible /v1/models endpoint."""
    return {
        "object": "list",
        "data": [
            {
                "id": "my-local-model",
                "object": "model",
                "created": 1700000000,
                "owned_by": "system"
            },
            {
                "id": "another-model-7b",
                "object": "model",
                "created": 1700000001,
                "owned_by": "system"
            }
        ]
    }


@pytest.mark.asyncio
async def test_discover_models_success(mock_openai_models_response):
    """Test successful model discovery from a custom endpoint."""
    from api.api import _discover_openai_models, Model

    mock_response = AsyncMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json = AsyncMock(return_value=mock_openai_models_response)

    @asynccontextmanager
    async def mock_get(*args, **kwargs):
        yield mock_response

    mock_session = AsyncMock()
    mock_session.get = mock_get

    @asynccontextmanager
    async def mock_client_session(*args, **kwargs):
        yield mock_session

    with patch('api.api.aiohttp.ClientSession', mock_client_session):
        models = await _discover_openai_models("http://localhost:8000/v1")

    assert len(models) == 2
    assert models[0].id == "my-local-model"
    assert models[1].id == "another-model-7b"


@pytest.mark.asyncio
async def test_discover_models_failure_returns_empty():
    """Test that discovery failure returns empty list (graceful fallback)."""
    from api.api import _discover_openai_models

    @asynccontextmanager
    async def mock_client_session(*args, **kwargs):
        raise ConnectionError("Connection refused")
        yield  # noqa: unreachable

    with patch('api.api.aiohttp.ClientSession', mock_client_session):
        models = await _discover_openai_models("http://unreachable:8000/v1")

    assert models == []


@pytest.mark.asyncio
async def test_discover_models_empty_data():
    """Test that an empty model list from the endpoint returns empty."""
    from api.api import _discover_openai_models

    mock_response = AsyncMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json = AsyncMock(return_value={"data": []})

    @asynccontextmanager
    async def mock_get(*args, **kwargs):
        yield mock_response

    mock_session = AsyncMock()
    mock_session.get = mock_get

    @asynccontextmanager
    async def mock_client_session(*args, **kwargs):
        yield mock_session

    with patch('api.api.aiohttp.ClientSession', mock_client_session):
        models = await _discover_openai_models("http://localhost:8000/v1")

    assert models == []


@pytest.mark.asyncio
async def test_discover_models_url_construction():
    """Test that the /models URL is correctly constructed from base_url."""
    from api.api import _discover_openai_models

    called_urls = []

    mock_response = AsyncMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json = AsyncMock(return_value={"data": [{"id": "test"}]})

    @asynccontextmanager
    async def mock_get(url, *args, **kwargs):
        called_urls.append(url)
        yield mock_response

    mock_session = AsyncMock()
    mock_session.get = mock_get

    @asynccontextmanager
    async def mock_client_session(*args, **kwargs):
        yield mock_session

    with patch('api.api.aiohttp.ClientSession', mock_client_session):
        # With trailing slash
        await _discover_openai_models("http://localhost:8000/v1/")
        # Without trailing slash
        await _discover_openai_models("http://localhost:8000/v1")

    assert called_urls[0] == "http://localhost:8000/v1/models"
    assert called_urls[1] == "http://localhost:8000/v1/models"
