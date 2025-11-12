# ADC Authentication Implementation Plan for DeepWiki

**Version:** 1.0
**Date:** 2025-11-11
**Author:** Implementation Planning Team
**Status:** Draft - Awaiting Approval

---

## Executive Summary

### Current State
DeepWiki currently uses API key-based authentication for Google AI services via the `google-generativeai` library (Google AI Studio API). The organization has disabled API key access and requires Application Default Credentials (ADC) for authentication with Google Cloud services.

### Problem Statement
1. **Embeddings**: Need to use Vertex AI's `text-embedding-004` model with ADC authentication
2. **LLM Models**: Have an OpenAI-compatible proxy running on `localhost:4001` that routes to Vertex AI Gemini models (e.g., `google-vertex/gemini-2.5-pro`)
3. **No Vertex AI Integration**: Current codebase lacks Vertex AI SDK integration and ADC support

### Proposed Solution
Implement a three-phase approach:
- **Phase 1**: Create new `VertexAIEmbedderClient` with ADC for embeddings
- **Phase 2**: Configure OpenAI client to use localhost proxy for LLM generation
- **Phase 3**: (Optional) Native Vertex AI client for LLMs as alternative to proxy

### Expected Outcomes
- ✅ Secure ADC-based authentication for all Google Cloud services
- ✅ Leverage existing OpenAI-compatible infrastructure (localhost:4001)
- ✅ Maintain backward compatibility with existing DeepWiki architecture
- ✅ No hardcoded credentials in code or configuration

---

## Table of Contents

1. [Technical Analysis](#technical-analysis)
2. [Architecture Overview](#architecture-overview)
3. [Phase 1: Vertex AI Embeddings with ADC](#phase-1-vertex-ai-embeddings-with-adc)
4. [Phase 2: LLM Models via OpenAI-Compatible Proxy](#phase-2-llm-models-via-openai-compatible-proxy)
5. [Phase 3: Optional Direct Vertex AI Integration](#phase-3-optional-direct-vertex-ai-integration)
6. [Testing Strategy](#testing-strategy)
7. [Migration Guide](#migration-guide)
8. [Security Considerations](#security-considerations)
9. [Appendices](#appendices)

---

## Technical Analysis

### Current Authentication Architecture

#### Google AI Studio (Current)
**File**: `api/google_embedder_client.py`
```python
def _initialize_client(self):
    """Initialize the Google AI client with API key."""
    api_key = self._api_key or os.getenv(self._env_api_key_name)
    if not api_key:
        raise ValueError(f"Environment variable {self._env_api_key_name} must be set")
    genai.configure(api_key=api_key)
```

**Limitations**:
- Requires `GOOGLE_API_KEY` environment variable
- Uses Google AI Studio API (not Vertex AI)
- No ADC support
- Not compatible with organization's security requirements

#### OpenAI Client (For Reference)
**File**: `api/openai_client.py` (Lines 161-196)
```python
def __init__(
    self,
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    env_base_url_name: str = "OPENAI_BASE_URL",
    env_api_key_name: str = "OPENAI_API_KEY",
):
    self.base_url = base_url or os.getenv(self._env_base_url_name, "https://api.openai.com/v1")
    self.sync_client = OpenAI(api_key=api_key, base_url=self.base_url)
```

**Strengths**:
- Supports custom `base_url` (can point to localhost:4001)
- Environment variable configuration
- Compatible with OpenAI-compatible proxies

### Gap Analysis

| Component | Current State | Required State | Gap |
|-----------|--------------|----------------|-----|
| **Embeddings** | Google AI Studio + API Key | Vertex AI + ADC | Need new VertexAIEmbedderClient |
| **LLM Models** | Multiple providers (API key) | Vertex AI via proxy + ADC | Configure OpenAI client for proxy |
| **Dependencies** | `google-generativeai>=0.3.0` | `google-cloud-aiplatform` | Add Vertex AI SDK |
| **Auth Method** | API Keys only | ADC (Application Default Credentials) | Implement ADC support |
| **Configuration** | embedder.json supports 3 types | Need vertex type | Add embedder_vertex config |

### Your Environment Specifications

#### OpenAI-Compatible Proxy
- **Endpoint**: `http://localhost:4001/v1`
- **Model Format**: `google-vertex/gemini-2.5-pro`
- **Authentication**: Bearer token (`Authorization: Bearer test-token`)
- **Capabilities**: Chat completions (streaming and non-streaming)

**Test Results from Your Report**:
```bash
# Non-streaming works
curl -X POST http://localhost:4001/v1/chat/completions \
  -H "Authorization: Bearer test-token" \
  -d '{"model": "google-vertex/gemini-2.5-pro", "messages": [...]}'
# ✅ Response: used_provider: google-vertex

# Streaming works
curl -X POST http://localhost:4001/v1/chat/completions \
  -H "Authorization: Bearer test-token" \
  -d '{"model": "google-vertex/gemini-2.5-pro", "messages": [...], "stream": true}'
# ✅ SSE streaming with [DONE] marker
```

#### ADC Requirements
- Organization has **disabled API key access**
- Must use **Application Default Credentials** (ADC)
- Likely using service account or workload identity
- Need access to Vertex AI embedding endpoints

---

## Architecture Overview

### Proposed Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      DeepWiki Application                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐              ┌──────────────────┐      │
│  │   Text          │              │   LLM            │      │
│  │   Generation    │              │   Generation     │      │
│  └────────┬────────┘              └────────┬─────────┘      │
│           │                                 │                │
│           │ (1) Embeddings                  │ (2) Chat       │
│           │     via ADC                     │     via Proxy  │
│           ▼                                 ▼                │
│  ┌─────────────────┐              ┌──────────────────┐      │
│  │ VertexAI        │              │ OpenAI Client    │      │
│  │ EmbedderClient  │              │ (Custom BaseURL) │      │
│  │ (NEW)           │              │ (MODIFIED)       │      │
│  └────────┬────────┘              └────────┬─────────┘      │
└───────────┼──────────────────────────────────┼──────────────┘
            │                                  │
            │ ADC Auth                         │ Bearer: test-token
            │                                  │
            ▼                                  ▼
   ┌────────────────────┐           ┌─────────────────────┐
   │  Google Cloud      │           │  OpenAI-Compatible  │
   │  Vertex AI         │           │  Proxy              │
   │  (Embeddings)      │           │  localhost:4001     │
   │                    │           │                     │
   │  text-embedding-   │           │  Routes to:         │
   │  004               │           │  Vertex AI Gemini   │
   └────────────────────┘           │  gemini-2.5-pro     │
                                    └─────────────────────┘
```

### Component Responsibilities

**1. VertexAIEmbedderClient (New)**
- Authenticates using ADC
- Calls Vertex AI embedding endpoints
- Returns embeddings compatible with FAISS
- Implements `ModelClient` interface

**2. OpenAI Client (Modified Configuration)**
- Points to `localhost:4001` via `OPENAI_BASE_URL`
- Uses "test-token" for authentication
- Routes LLM requests to your proxy
- Proxy handles ADC authentication with Vertex AI

**3. Configuration Files**
- `api/config/embedder.json`: Add `embedder_vertex` section
- `api/config/generator.json`: May need `vertex` provider (Phase 3)
- `.env`: Environment variables for project ID, location, etc.

---

## Phase 1: Vertex AI Embeddings with ADC

### Objectives
✅ Create native Vertex AI embedding client with ADC authentication
✅ Integrate with existing embedder framework
✅ Support `text-embedding-004` model
✅ Maintain compatibility with FAISS and RAG pipeline

### Step 1.1: Add Dependencies

**File**: `api/pyproject.toml`

**Current**:
```toml
google-generativeai = ">=0.3.0"
```

**Add**:
```toml
google-generativeai = ">=0.3.0"
google-cloud-aiplatform = ">=1.38.0"
google-auth = ">=2.23.0"
```

**Installation Command**:
```bash
poetry add google-cloud-aiplatform google-auth -C api
```

### Step 1.2: Create VertexAIEmbedderClient

**File**: `api/vertexai_embedder_client.py` (NEW)

```python
"""
Vertex AI Embedder Client using Application Default Credentials (ADC).
Provides text embeddings via Google Cloud Vertex AI.
"""

import logging
import os
from typing import Any, Dict, List, Optional, Union

from google.auth import default
from google.cloud import aiplatform
from vertexai.language_models import TextEmbeddingModel, TextEmbeddingInput

from adalflow.core.model_client import ModelClient
from adalflow.core.types import ModelType, EmbedderOutput

logger = logging.getLogger(__name__)


class VertexAIEmbedderClient(ModelClient):
    """
    Google Cloud Vertex AI embedder client using ADC authentication.

    Supports:
    - text-embedding-004 (latest multilingual model)
    - text-embedding-005 (if available)
    - text-multilingual-embedding-002

    Authentication:
    - Uses Application Default Credentials (ADC)
    - No API keys required
    - Supports service accounts, workload identity, gcloud auth

    Environment Variables:
    - GOOGLE_CLOUD_PROJECT: GCP project ID (required)
    - GOOGLE_CLOUD_LOCATION: GCP region (default: us-central1)
    """

    def __init__(
        self,
        project_id: Optional[str] = None,
        location: Optional[str] = None,
    ):
        """
        Initialize Vertex AI embedder client with ADC.

        Args:
            project_id: GCP project ID. If None, reads from GOOGLE_CLOUD_PROJECT env var.
            location: GCP region. If None, reads from GOOGLE_CLOUD_LOCATION env var (default: us-central1).
        """
        super().__init__()

        # Get project and location
        self.project_id = project_id or os.getenv("GOOGLE_CLOUD_PROJECT")
        self.location = location or os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

        if not self.project_id:
            raise ValueError(
                "GOOGLE_CLOUD_PROJECT environment variable must be set, "
                "or project_id must be provided"
            )

        # Initialize Vertex AI with ADC
        self._initialize_vertex_ai()

        logger.info(
            f"Initialized VertexAIEmbedderClient with project={self.project_id}, "
            f"location={self.location}"
        )

    def _initialize_vertex_ai(self):
        """Initialize Vertex AI using Application Default Credentials."""
        try:
            # Verify ADC are available
            credentials, project = default()
            logger.info(f"ADC found for project: {project}")

            # Initialize Vertex AI SDK
            aiplatform.init(
                project=self.project_id,
                location=self.location,
                credentials=credentials
            )

            logger.info("Vertex AI initialized successfully with ADC")

        except Exception as e:
            logger.error(f"Failed to initialize Vertex AI with ADC: {e}")
            raise ValueError(
                f"Could not initialize Vertex AI with ADC. "
                f"Ensure you have valid credentials (gcloud auth application-default login). "
                f"Error: {e}"
            )

    def init_sync_client(self):
        """
        Initialize the synchronous Vertex AI embedding model.

        Returns:
            TextEmbeddingModel instance
        """
        # Model is initialized lazily in call() method
        return None

    def parse_embedding_response(
        self, response: Any
    ) -> EmbedderOutput:
        """
        Parse Vertex AI embedding response into EmbedderOutput format.

        Args:
            response: List of TextEmbedding objects from Vertex AI

        Returns:
            EmbedderOutput with embeddings and metadata
        """
        try:
            # Extract embeddings (response is a list of TextEmbedding objects)
            embeddings = []
            for embedding_obj in response:
                # TextEmbedding.values is the actual embedding vector
                embeddings.append(embedding_obj.values)

            # Create EmbedderOutput
            output = EmbedderOutput(
                data=embeddings,
                error=None,
                raw_response=response,
            )

            return output

        except Exception as e:
            logger.error(f"Error parsing embedding response: {e}")
            return EmbedderOutput(
                data=None,
                error=str(e),
                raw_response=response,
            )

    def call(
        self,
        input: Union[str, List[str]],
        model_kwargs: Dict[str, Any] = {},
    ) -> EmbedderOutput:
        """
        Generate embeddings for input text(s).

        Args:
            input: Single text string or list of text strings
            model_kwargs: Model parameters including:
                - model: Model name (default: "text-embedding-004")
                - task_type: Task type for embeddings (default: "SEMANTIC_SIMILARITY")
                - auto_truncate: Whether to auto-truncate long texts (default: True)

        Returns:
            EmbedderOutput with embeddings
        """
        try:
            # Get model parameters
            model_name = model_kwargs.get("model", "text-embedding-004")
            task_type = model_kwargs.get("task_type", "SEMANTIC_SIMILARITY")
            auto_truncate = model_kwargs.get("auto_truncate", True)

            # Load the embedding model
            model = TextEmbeddingModel.from_pretrained(model_name)

            # Convert input to list if single string
            texts = [input] if isinstance(input, str) else input

            # Create TextEmbeddingInput objects with task type
            embedding_inputs = [
                TextEmbeddingInput(text=text, task_type=task_type)
                for text in texts
            ]

            # Get embeddings
            logger.debug(f"Generating embeddings for {len(texts)} texts with model {model_name}")

            embeddings = model.get_embeddings(
                embedding_inputs,
                auto_truncate=auto_truncate
            )

            # Parse and return
            return self.parse_embedding_response(embeddings)

        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            return EmbedderOutput(
                data=None,
                error=str(e),
                raw_response=None,
            )

    async def acall(
        self,
        input: Union[str, List[str]],
        model_kwargs: Dict[str, Any] = {},
    ) -> EmbedderOutput:
        """
        Async version of call(). Vertex AI SDK doesn't have native async,
        so we just call the sync version.

        For production use, consider using asyncio.to_thread() to avoid blocking.
        """
        # For now, just call sync version
        # TODO: Implement proper async with asyncio.to_thread() if needed
        return self.call(input, model_kwargs)

    def convert_inputs_to_api_kwargs(
        self,
        input: Union[str, List[str]],
        model_kwargs: Dict[str, Any] = {},
    ) -> Dict[str, Any]:
        """
        Convert inputs to API kwargs format.

        This is a helper method for the ModelClient interface.
        """
        return {
            "input": input,
            "model_kwargs": model_kwargs,
        }
```

### Step 1.3: Register Client in Configuration System

**File**: `api/config.py`

**Modify Line 10** (add import):
```python
from api.openai_client import OpenAIClient
from api.openrouter_client import OpenRouterClient
from api.bedrock_client import BedrockClient
from api.google_embedder_client import GoogleEmbedderClient
from api.azureai_client import AzureAIClient
from api.dashscope_client import DashscopeClient
from api.vertexai_embedder_client import VertexAIEmbedderClient  # NEW
from adalflow import GoogleGenAIClient, OllamaClient
```

**Modify Lines 54-64** (add to CLIENT_CLASSES):
```python
CLIENT_CLASSES = {
    "GoogleGenAIClient": GoogleGenAIClient,
    "GoogleEmbedderClient": GoogleEmbedderClient,
    "VertexAIEmbedderClient": VertexAIEmbedderClient,  # NEW
    "OpenAIClient": OpenAIClient,
    "OpenRouterClient": OpenRouterClient,
    "OllamaClient": OllamaClient,
    "BedrockClient": BedrockClient,
    "AzureAIClient": AzureAIClient,
    "DashscopeClient": DashscopeClient
}
```

### Step 1.4: Add Embedder Configuration

**File**: `api/config/embedder.json`

**Add new section**:
```json
{
  "embedder": {
    "client_class": "OpenAIClient",
    "batch_size": 500,
    "model_kwargs": {
      "model": "text-embedding-3-small",
      "dimensions": 256,
      "encoding_format": "float"
    }
  },
  "embedder_ollama": {
    "client_class": "OllamaClient",
    "model_kwargs": {
      "model": "nomic-embed-text"
    }
  },
  "embedder_google": {
    "client_class": "GoogleEmbedderClient",
    "batch_size": 100,
    "model_kwargs": {
      "model": "text-embedding-004",
      "task_type": "SEMANTIC_SIMILARITY"
    }
  },
  "embedder_vertex": {
    "client_class": "VertexAIEmbedderClient",
    "initialize_kwargs": {
      "project_id": "${GOOGLE_CLOUD_PROJECT}",
      "location": "${GOOGLE_CLOUD_LOCATION}"
    },
    "batch_size": 100,
    "model_kwargs": {
      "model": "text-embedding-004",
      "task_type": "SEMANTIC_SIMILARITY",
      "auto_truncate": true
    }
  }
}
```

### Step 1.5: Update Embedder Selection Logic

**File**: `api/tools/embedder.py`

**Modify `get_embedder()` function** (around line 10):
```python
def get_embedder(is_local_ollama: bool = False, use_google_embedder: bool = False, embedder_type: str = None) -> adal.Embedder:
    """
    Get embedder based on configuration.

    Args:
        is_local_ollama: Legacy parameter for Ollama
        use_google_embedder: Legacy parameter for Google
        embedder_type: Explicit embedder type ('openai', 'google', 'ollama', 'vertex')
    """
    # Determine which embedder config to use
    if embedder_type:
        if embedder_type == 'ollama':
            embedder_config = configs["embedder_ollama"]
        elif embedder_type == 'google':
            embedder_config = configs["embedder_google"]
        elif embedder_type == 'vertex':  # NEW
            embedder_config = configs["embedder_vertex"]
        else:  # default to openai
            embedder_config = configs["embedder"]
    elif is_local_ollama:
        embedder_config = configs["embedder_ollama"]
    elif use_google_embedder:
        embedder_config = configs["embedder_google"]
    else:
        # Auto-detect from environment variable
        from api.config import get_embedder_type
        detected_type = get_embedder_type()

        if detected_type == 'ollama':
            embedder_config = configs["embedder_ollama"]
        elif detected_type == 'google':
            embedder_config = configs["embedder_google"]
        elif detected_type == 'vertex':  # NEW
            embedder_config = configs["embedder_vertex"]
        else:
            embedder_config = configs["embedder"]

    # Initialize Embedder
    model_client_class = embedder_config["model_client"]
    if "initialize_kwargs" in embedder_config:
        model_client = model_client_class(**embedder_config["initialize_kwargs"])
    else:
        model_client = model_client_class()

    embedder = adal.Embedder(model_client=model_client, model_kwargs=embedder_config["model_kwargs"])

    return embedder
```

### Step 1.6: Update Configuration Helpers

**File**: `api/config.py`

**Add helper function** (after line 227):
```python
def is_vertex_embedder():
    """Check if the current embedder configuration uses VertexAIEmbedderClient."""
    embedder_config = get_embedder_config()
    model_client = embedder_config.get("model_client")
    if model_client:
        return model_client.__name__ == "VertexAIEmbedderClient"
    return False

def get_embedder_type():
    """Get the current embedder type based on configuration."""
    if is_ollama_embedder():
        return 'ollama'
    elif is_vertex_embedder():  # Check vertex before google
        return 'vertex'
    elif is_google_embedder():
        return 'google'
    else:
        return 'openai'
```

### Step 1.7: Environment Variables Setup

**File**: `.env` (in project root)

**Add**:
```bash
# Vertex AI Embeddings with ADC
DEEPWIKI_EMBEDDER_TYPE=vertex
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# Optional: Keep existing keys for backward compatibility
# GOOGLE_API_KEY=your_google_api_key (not needed for Vertex)
# OPENAI_API_KEY=your_openai_api_key (not needed if using proxy)
```

### Step 1.8: ADC Authentication Setup

**On your local machine**:
```bash
# Option 1: User credentials (for development)
gcloud auth application-default login

# Option 2: Service account (for production)
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# Verify ADC is working
gcloud auth application-default print-access-token
```

**In Cloud environments** (GKE, Cloud Run, etc.):
- Use Workload Identity
- Service account automatically attached
- No explicit configuration needed

### Phase 1 Deliverables

✅ New file: `api/vertexai_embedder_client.py`
✅ Updated: `api/config.py` (import + CLIENT_CLASSES + helper functions)
✅ Updated: `api/tools/embedder.py` (add vertex type support)
✅ Updated: `api/config/embedder.json` (add embedder_vertex section)
✅ Updated: `api/pyproject.toml` (add dependencies)
✅ Updated: `.env` (environment variables)

---

## Phase 2: LLM Models via OpenAI-Compatible Proxy

### Objectives
✅ Configure OpenAI client to use localhost:4001 proxy
✅ Route LLM generation requests through your proxy
✅ Maintain compatibility with existing DeepWiki UI
✅ Support streaming and non-streaming modes

### Step 2.1: Configure OpenAI Client for Proxy

**File**: `.env`

**Add**:
```bash
# OpenAI-Compatible Proxy Configuration
OPENAI_BASE_URL=http://localhost:4001/v1
OPENAI_API_KEY=test-token

# Model selection (use in UI)
# Format: google-vertex/gemini-2.5-pro
```

### Step 2.2: Update Generator Configuration (Optional)

**File**: `api/config/generator.json`

You can add a dedicated provider for your proxy, or just use the existing OpenAI provider with custom base URL.

**Option A: Use existing OpenAI provider** (Recommended)
- No changes needed to generator.json
- Just set `OPENAI_BASE_URL` in .env
- Select "openai" provider in UI
- Enter model name: `google-vertex/gemini-2.5-pro`

**Option B: Add dedicated "vertex-proxy" provider** (More explicit)
```json
{
  "providers": {
    "google": { ... },
    "openai": { ... },
    "vertex-proxy": {
      "client_class": "OpenAIClient",
      "initialize_kwargs": {
        "base_url": "${OPENAI_BASE_URL}",
        "env_api_key_name": "OPENAI_API_KEY"
      },
      "default_model": "google-vertex/gemini-2.5-pro",
      "available_models": [
        "google-vertex/gemini-2.5-pro",
        "google-vertex/gemini-2.0-flash-exp",
        "google-vertex/gemini-1.5-pro"
      ],
      "model_params": {
        "temperature": 0.7,
        "top_p": 0.9,
        "stream": true
      }
    }
  }
}
```

### Step 2.3: Test Proxy Integration

**Test Script**: `test/test_vertex_proxy.py` (NEW)

```python
"""
Test script for Vertex AI proxy integration.
"""

import os
from api.openai_client import OpenAIClient

def test_proxy_connection():
    """Test basic connection to localhost:4001 proxy."""

    # Set up client
    client = OpenAIClient(
        api_key="test-token",
        base_url="http://localhost:4001/v1"
    )

    # Test non-streaming
    print("Testing non-streaming...")
    response = client.sync_client.chat.completions.create(
        model="google-vertex/gemini-2.5-pro",
        messages=[
            {"role": "user", "content": "Hello! Please respond with: Connection successful"}
        ]
    )

    print(f"Response: {response.choices[0].message.content}")
    print(f"Model: {response.model}")

    # Test streaming
    print("\nTesting streaming...")
    stream = client.sync_client.chat.completions.create(
        model="google-vertex/gemini-2.5-pro",
        messages=[
            {"role": "user", "content": "Count from 1 to 5"}
        ],
        stream=True
    )

    for chunk in stream:
        if chunk.choices[0].delta.content:
            print(chunk.choices[0].delta.content, end="", flush=True)

    print("\n\n✅ Proxy integration test passed!")

if __name__ == "__main__":
    test_proxy_connection()
```

**Run test**:
```bash
cd /Users/ehfaz.rezwan/Projects/deepwiki-open
python test/test_vertex_proxy.py
```

### Step 2.4: Update WebSocket Wiki Generator

**File**: `api/websocket_wiki.py`

The existing code should work without changes because:
1. It uses `OpenAIClient` which already supports custom `base_url`
2. The `OPENAI_BASE_URL` env var is automatically picked up
3. Model name is passed through from UI

**Verify at lines 43-44**:
```python
provider: str = Field("google", description="Model provider (google, openai, openrouter, ollama, azure)")
model: Optional[str] = Field(None, description="Model name for the specified provider")
```

**Usage**:
- Set `provider="openai"` in UI
- Set `model="google-vertex/gemini-2.5-pro"` in UI
- Client will use `localhost:4001` because of `OPENAI_BASE_URL`

### Step 2.5: Frontend Integration

**File**: `src/components/ConfigurationModal.tsx`

No code changes needed. Users will:
1. Select "OpenAI" as provider
2. Enable "Use Custom Model"
3. Enter model name: `google-vertex/gemini-2.5-pro`
4. Backend will route to your proxy via `OPENAI_BASE_URL`

**Alternative**: Add UI hint for proxy models
```tsx
{selectedProvider === 'openai' && (
  <p className="text-sm text-gray-500 mt-2">
    💡 Tip: Using localhost:4001 proxy. Enter model as: google-vertex/gemini-2.5-pro
  </p>
)}
```

### Phase 2 Deliverables

✅ Updated: `.env` (OPENAI_BASE_URL and OPENAI_API_KEY)
✅ Optional: Updated `api/config/generator.json` (vertex-proxy provider)
✅ New: `test/test_vertex_proxy.py` (integration test)
✅ Tested: WebSocket streaming through proxy
✅ Tested: Non-streaming through proxy

---

## Phase 3: Optional Direct Vertex AI Integration

### Objectives
⚠️ **This phase is OPTIONAL** - only needed if you want to bypass the proxy

✅ Create native Vertex AI client for LLM generation
✅ Support Gemini models directly via Vertex AI SDK
✅ Use ADC authentication

### Why You Might Want This

**Pros**:
- Direct integration, no proxy dependency
- Consistent ADC authentication for both embeddings and generation
- Access to all Vertex AI features (safety settings, grounding, etc.)

**Cons**:
- More code to maintain
- Your proxy already works well
- Vertex AI SDK is more complex than OpenAI client

### Implementation Overview

If you decide to implement this later:

1. **Create**: `api/vertexai_llm_client.py`
   - Similar structure to `vertexai_embedder_client.py`
   - Use `GenerativeModel.from_pretrained()`
   - Implement streaming via `generate_content(stream=True)`

2. **Update**: `api/config/generator.json`
   - Add "vertex" provider
   - Use `VertexAILLMClient` class

3. **Update**: `api/config.py`
   - Add to CLIENT_CLASSES

**Code skeleton** (for reference):
```python
from vertexai.generative_models import GenerativeModel

class VertexAILLMClient(ModelClient):
    def __init__(self, project_id: str = None, location: str = None):
        # Initialize with ADC (same as embedder)
        aiplatform.init(project=project_id, location=location)

    def call(self, input, model_kwargs):
        model = GenerativeModel(model_kwargs.get("model", "gemini-2.5-pro"))
        response = model.generate_content(input)
        return response.text

    async def acall(self, input, model_kwargs):
        # Streaming implementation
        model = GenerativeModel(model_kwargs.get("model"))
        stream = model.generate_content(input, stream=True)
        for chunk in stream:
            yield chunk.text
```

### Decision Point

**Recommendation**: Skip Phase 3 for now. Your proxy works well and provides:
- OpenAI-compatible API (familiar interface)
- Already tested and validated
- Easy to swap providers in the future
- Less code to maintain

**Revisit Phase 3 if**:
- Proxy becomes a bottleneck
- You need Vertex-specific features (grounding, function calling)
- You want to eliminate the proxy dependency

---

## Testing Strategy

### Unit Tests

#### Test 1: VertexAIEmbedderClient Initialization

**File**: `tests/unit/test_vertexai_embedder.py` (NEW)

```python
"""
Unit tests for VertexAIEmbedderClient.
"""

import os
import pytest
from unittest.mock import patch, MagicMock
from api.vertexai_embedder_client import VertexAIEmbedderClient


@pytest.fixture
def mock_env():
    """Mock environment variables."""
    with patch.dict(os.environ, {
        'GOOGLE_CLOUD_PROJECT': 'test-project',
        'GOOGLE_CLOUD_LOCATION': 'us-central1'
    }):
        yield


@pytest.fixture
def mock_vertexai():
    """Mock Vertex AI initialization."""
    with patch('api.vertexai_embedder_client.aiplatform.init') as mock_init, \
         patch('api.vertexai_embedder_client.default') as mock_default:

        # Mock ADC
        mock_credentials = MagicMock()
        mock_default.return_value = (mock_credentials, 'test-project')

        yield mock_init, mock_default


def test_initialization_with_env_vars(mock_env, mock_vertexai):
    """Test client initializes correctly with environment variables."""
    mock_init, mock_default = mock_vertexai

    client = VertexAIEmbedderClient()

    assert client.project_id == 'test-project'
    assert client.location == 'us-central1'
    mock_init.assert_called_once()


def test_initialization_with_params(mock_vertexai):
    """Test client initializes with explicit parameters."""
    mock_init, mock_default = mock_vertexai

    client = VertexAIEmbedderClient(
        project_id='custom-project',
        location='europe-west1'
    )

    assert client.project_id == 'custom-project'
    assert client.location == 'europe-west1'


def test_initialization_missing_project_id():
    """Test that missing project ID raises error."""
    with patch.dict(os.environ, {}, clear=True):
        with pytest.raises(ValueError, match="GOOGLE_CLOUD_PROJECT"):
            VertexAIEmbedderClient()


@pytest.mark.network
def test_embeddings_generation(mock_vertexai):
    """Test embedding generation (requires network)."""
    # This test would require actual ADC credentials
    # Mark as network test and skip in CI
    pytest.skip("Requires valid ADC credentials")
```

#### Test 2: Configuration System

**File**: `tests/unit/test_config_vertex.py` (NEW)

```python
"""
Test configuration system for Vertex AI integration.
"""

import pytest
from api.config import (
    load_embedder_config,
    is_vertex_embedder,
    get_embedder_type,
    CLIENT_CLASSES
)


def test_vertex_client_registered():
    """Test that VertexAIEmbedderClient is registered."""
    assert "VertexAIEmbedderClient" in CLIENT_CLASSES


def test_embedder_config_has_vertex():
    """Test that embedder.json includes vertex config."""
    config = load_embedder_config()
    assert "embedder_vertex" in config
    assert config["embedder_vertex"]["client_class"] == "VertexAIEmbedderClient"


def test_get_embedder_type_vertex(monkeypatch):
    """Test embedder type detection for vertex."""
    # Mock the config to return vertex embedder
    def mock_get_config():
        return {
            "model_client": CLIENT_CLASSES["VertexAIEmbedderClient"]
        }

    monkeypatch.setattr("api.config.get_embedder_config", mock_get_config)

    embedder_type = get_embedder_type()
    assert embedder_type == 'vertex'
```

### Integration Tests

#### Test 3: End-to-End Embedding Pipeline

**File**: `tests/integration/test_vertex_embeddings.py` (NEW)

```python
"""
Integration test for Vertex AI embeddings in RAG pipeline.
"""

import pytest
from api.rag import RAG
from api.config import configs


@pytest.mark.integration
@pytest.mark.network
def test_vertex_embeddings_in_rag():
    """Test that RAG can use Vertex AI embeddings."""
    # Set up RAG with vertex embeddings
    rag = RAG(provider="openai", model="google-vertex/gemini-2.5-pro")

    # Mock repo URL
    test_repo = "https://github.com/AsyncFuncAI/deepwiki-open"

    # This would require:
    # 1. Valid ADC credentials
    # 2. Actual repo cloning
    # 3. Embedding generation
    # Mark as integration test

    pytest.skip("Requires valid ADC credentials and network access")
```

### Manual Testing Checklist

#### Phase 1: Embeddings

- [ ] Set `DEEPWIKI_EMBEDDER_TYPE=vertex` in `.env`
- [ ] Set `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_LOCATION`
- [ ] Run `gcloud auth application-default login`
- [ ] Start backend: `python -m api.main`
- [ ] Check logs for "Initialized VertexAIEmbedderClient"
- [ ] Generate wiki for a test repo
- [ ] Verify embeddings are created in `~/.adalflow/databases/`
- [ ] Test Ask feature with RAG
- [ ] Verify responses use Vertex embeddings

#### Phase 2: LLM Proxy

- [ ] Set `OPENAI_BASE_URL=http://localhost:4001/v1` in `.env`
- [ ] Set `OPENAI_API_KEY=test-token`
- [ ] Ensure localhost:4001 proxy is running
- [ ] Start backend and frontend
- [ ] In UI, select "OpenAI" provider
- [ ] Enter custom model: `google-vertex/gemini-2.5-pro`
- [ ] Generate wiki - verify it uses proxy
- [ ] Test streaming in Ask feature
- [ ] Check browser console for any errors

#### Combined Testing

- [ ] Use Vertex embeddings + Proxy LLM together
- [ ] Generate wiki for medium-sized repo
- [ ] Verify end-to-end flow works
- [ ] Test DeepResearch feature
- [ ] Test with private repository (if applicable)

---

## Migration Guide

### For Development Environment

#### Step 1: Update Dependencies
```bash
cd /Users/ehfaz.rezwan/Projects/deepwiki-open
poetry add google-cloud-aiplatform google-auth -C api
```

#### Step 2: Set Up ADC
```bash
# Login with your GCP account
gcloud auth application-default login

# Verify ADC
gcloud auth application-default print-access-token
```

#### Step 3: Update Configuration Files

Create `.env` file:
```bash
# Phase 1: Vertex AI Embeddings
DEEPWIKI_EMBEDDER_TYPE=vertex
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# Phase 2: LLM via Proxy
OPENAI_BASE_URL=http://localhost:4001/v1
OPENAI_API_KEY=test-token

# Optional: Other settings
PORT=8001
SERVER_BASE_URL=http://localhost:8001
```

#### Step 4: Implement Code Changes

Follow Phase 1 and Phase 2 implementation steps above.

#### Step 5: Test
```bash
# Terminal 1: Start your proxy
# (your LLMGateway should be running on localhost:4001)

# Terminal 2: Start backend
python -m api.main

# Terminal 3: Start frontend
npm run dev

# Open browser: http://localhost:3000
```

### For Production Deployment

#### Docker Deployment

**Update `Dockerfile`** to include ADC:

```dockerfile
# ... existing Dockerfile content ...

# Install Google Cloud SDK (for ADC in container)
RUN apt-get update && apt-get install -y \
    google-cloud-sdk \
    && rm -rf /var/lib/apt/lists/*

# Copy service account key if using key file
# (Alternatively, use Workload Identity in GKE)
COPY service-account-key.json /app/service-account-key.json

# Set environment variable for ADC
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json

# ... rest of Dockerfile ...
```

**Update `docker-compose.yml`**:

```yaml
version: '3.8'
services:
  deepwiki:
    build: .
    ports:
      - "8001:8001"
      - "3000:3000"
    environment:
      # Vertex AI Embeddings
      - DEEPWIKI_EMBEDDER_TYPE=vertex
      - GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT}
      - GOOGLE_CLOUD_LOCATION=${GOOGLE_CLOUD_LOCATION}
      - GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json

      # LLM via Proxy
      - OPENAI_BASE_URL=http://host.docker.internal:4001/v1
      - OPENAI_API_KEY=test-token

    volumes:
      - ~/.adalflow:/root/.adalflow
      - ./service-account-key.json:/app/service-account-key.json:ro
```

**Note**: Use `host.docker.internal` to access localhost proxy from Docker container.

#### Kubernetes/GKE Deployment

**Use Workload Identity** (recommended):

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: deepwiki-sa
  annotations:
    iam.gke.io/gcp-service-account: deepwiki@your-project.iam.gserviceaccount.com

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deepwiki
spec:
  template:
    spec:
      serviceAccountName: deepwiki-sa
      containers:
      - name: deepwiki
        image: gcr.io/your-project/deepwiki:latest
        env:
        - name: DEEPWIKI_EMBEDDER_TYPE
          value: "vertex"
        - name: GOOGLE_CLOUD_PROJECT
          value: "your-gcp-project-id"
        - name: GOOGLE_CLOUD_LOCATION
          value: "us-central1"
        - name: OPENAI_BASE_URL
          value: "http://llmgateway-service:4001/v1"
        - name: OPENAI_API_KEY
          value: "test-token"
```

### Rollback Plan

If you need to rollback to the original system:

1. **Change embedder type**:
   ```bash
   DEEPWIKI_EMBEDDER_TYPE=google  # or openai
   ```

2. **Restore API key authentication**:
   ```bash
   GOOGLE_API_KEY=your_api_key
   OPENAI_API_KEY=your_openai_key
   unset OPENAI_BASE_URL  # Remove proxy
   ```

3. **Restart services**:
   ```bash
   docker-compose restart
   # or
   kubectl rollout restart deployment/deepwiki
   ```

4. **Clear cache** (optional):
   ```bash
   rm -rf ~/.adalflow/databases/*
   ```

---

## Security Considerations

### ADC Best Practices

#### 1. Credential Storage

**DO**:
- Use `gcloud auth application-default login` for local development
- Use Workload Identity in GKE/Cloud Run
- Use service account key files only when necessary
- Store key files outside repository (`.gitignore`)

**DON'T**:
- Commit service account keys to Git
- Share ADC credentials across environments
- Use personal credentials in production

#### 2. Least Privilege

Grant minimal permissions to service account:

```bash
# Create service account
gcloud iam service-accounts create deepwiki-sa \
    --display-name="DeepWiki Service Account"

# Grant only necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:deepwiki-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# For embeddings only (even more restrictive)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:deepwiki-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.featurestoreDataViewer"
```

#### 3. Proxy Security

**For localhost:4001 proxy**:

- **In Development**: Localhost is fine, no external access
- **In Production**:
  - Use internal network (not public internet)
  - Consider mutual TLS between DeepWiki and proxy
  - Rotate "test-token" to real authentication
  - Use Kubernetes NetworkPolicy to restrict access

**Example NetworkPolicy**:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deepwiki-to-proxy
spec:
  podSelector:
    matchLabels:
      app: deepwiki
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: llmgateway
    ports:
    - protocol: TCP
      port: 4001
```

#### 4. Environment Variable Security

**Sensitive variables**:
- `GOOGLE_APPLICATION_CREDENTIALS` (path to key file)
- `OPENAI_API_KEY` (even if just "test-token")
- `GOOGLE_CLOUD_PROJECT` (not secret, but sensitive)

**Use Secret Management**:

```yaml
# Kubernetes Secret
apiVersion: v1
kind: Secret
metadata:
  name: deepwiki-secrets
type: Opaque
data:
  openai-api-key: dGVzdC10b2tlbg==  # base64 encoded

# Reference in Deployment
env:
- name: OPENAI_API_KEY
  valueFrom:
    secretKeyRef:
      name: deepwiki-secrets
      key: openai-api-key
```

#### 5. Audit Logging

Enable audit logs for Vertex AI API calls:

```bash
# Enable Data Access logs
gcloud logging write your-log-name "DeepWiki accessed Vertex AI" \
  --severity=INFO \
  --resource=global
```

Monitor:
- Embedding API calls
- Authentication failures
- Unusual usage patterns

#### 6. Network Isolation

**Recommended architecture**:

```
Internet
    ↓
[Cloud Load Balancer]
    ↓
[DeepWiki Frontend] (Public)
    ↓
[DeepWiki Backend] (Private subnet)
    ↓ (ADC)                    ↓ (Internal)
[Vertex AI API]         [LLM Gateway Proxy]
                              ↓ (ADC)
                        [Vertex AI Gemini]
```

---

## Appendices

### Appendix A: Code References

All code references from the research phase:

1. **Current Google Embedder**: `api/google_embedder_client.py:69-76`
2. **Embedder Selection**: `api/tools/embedder.py:6-54`
3. **OpenAI Base URL**: `api/openai_client.py:161-196`
4. **Configuration Loading**: `api/config.py:66-94`
5. **Bedrock ADC Pattern**: `api/bedrock_client.py:66-104`
6. **RAG Initialization**: `api/rag.py:172-191`

### Appendix B: API Endpoint Mappings

#### Vertex AI Embedding API

**Endpoint**:
```
https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/{MODEL}:predict
```

**Authentication**: Bearer token from ADC

**Request**:
```json
{
  "instances": [
    {
      "task_type": "SEMANTIC_SIMILARITY",
      "content": "Your text here"
    }
  ]
}
```

**Response**:
```json
{
  "predictions": [
    {
      "embeddings": {
        "values": [0.1, 0.2, ..., 0.768]
      }
    }
  ]
}
```

#### Your OpenAI-Compatible Proxy

**Endpoint**: `http://localhost:4001/v1/chat/completions`

**Authentication**: `Authorization: Bearer test-token`

**Request**:
```json
{
  "model": "google-vertex/gemini-2.5-pro",
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "stream": true
}
```

**Response** (streaming):
```
data: {"id":"...", "choices":[{"delta":{"content":"Hello"}}]}
data: {"id":"...", "choices":[{"delta":{"content":"!"}}]}
data: [DONE]
```

### Appendix C: Environment Variable Reference

| Variable | Type | Default | Description | Required For |
|----------|------|---------|-------------|--------------|
| `DEEPWIKI_EMBEDDER_TYPE` | string | `openai` | Embedder type: `openai`, `google`, `ollama`, `vertex` | Phase 1 |
| `GOOGLE_CLOUD_PROJECT` | string | - | GCP project ID | Phase 1 (vertex) |
| `GOOGLE_CLOUD_LOCATION` | string | `us-central1` | GCP region for Vertex AI | Phase 1 (vertex) |
| `GOOGLE_APPLICATION_CREDENTIALS` | path | - | Path to service account key JSON | Phase 1 (production) |
| `OPENAI_BASE_URL` | URL | `https://api.openai.com/v1` | OpenAI API base URL | Phase 2 |
| `OPENAI_API_KEY` | string | - | OpenAI API key (or proxy token) | Phase 2 |
| `PORT` | number | `8001` | Backend API server port | Always |
| `SERVER_BASE_URL` | URL | `http://localhost:8001` | Backend API base URL | Always |

### Appendix D: Troubleshooting Guide

#### Issue 1: "GOOGLE_CLOUD_PROJECT must be set"

**Symptom**: Error on startup when embedder_type=vertex

**Solution**:
```bash
export GOOGLE_CLOUD_PROJECT=your-project-id
# or add to .env file
```

#### Issue 2: "Could not initialize Vertex AI with ADC"

**Symptoms**:
- Error: "Could not automatically determine credentials"
- ADC not found

**Solution**:
```bash
# For development
gcloud auth application-default login

# For production with service account
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json

# Verify
gcloud auth application-default print-access-token
```

#### Issue 3: "Connection refused to localhost:4001"

**Symptoms**:
- Cannot connect to proxy
- Timeouts on LLM generation

**Solution**:
```bash
# Check if proxy is running
curl http://localhost:4001/v1/models

# Check Docker network (if using Docker)
# Use host.docker.internal instead of localhost
OPENAI_BASE_URL=http://host.docker.internal:4001/v1
```

#### Issue 4: "Embedding dimension mismatch"

**Symptoms**:
- FAISS error about vector dimensions
- Index incompatible with new embeddings

**Solution**:
```bash
# Clear existing databases
rm -rf ~/.adalflow/databases/*

# Regenerate embeddings with new embedder
# Re-process repositories
```

#### Issue 5: "Quota exceeded" or "Permission denied"

**Symptoms**:
- Vertex AI API returns 429 or 403
- Rate limiting errors

**Solution**:
```bash
# Check quotas
gcloud compute project-info describe --project=YOUR_PROJECT

# Request quota increase via GCP Console
# Or add retry logic with exponential backoff

# Verify IAM permissions
gcloud projects get-iam-policy YOUR_PROJECT \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:YOUR_SA@YOUR_PROJECT.iam.gserviceaccount.com"
```

### Appendix E: Performance Benchmarks (Estimated)

#### Embedding Generation

| Embedder | Tokens/sec | Batch Size | Latency (avg) | Cost/1M tokens |
|----------|-----------|------------|---------------|----------------|
| OpenAI text-embedding-3-small | ~50,000 | 500 | 200ms | $0.02 |
| Google AI text-embedding-004 | ~40,000 | 100 | 250ms | Free (limited) |
| Vertex AI text-embedding-004 | ~40,000 | 100 | 250ms | $0.025 |
| Ollama nomic-embed-text | ~5,000 | N/A | 2000ms | Free (local) |

#### LLM Generation (via Proxy)

| Model | Tokens/sec | Latency (TTFT) | Cost/1M input tokens |
|-------|-----------|----------------|---------------------|
| gemini-2.5-pro | ~30-50 | 500-800ms | $3.50 |
| gemini-2.0-flash | ~80-120 | 200-400ms | $0.075 |

**Note**: Actual performance depends on:
- Network latency to GCP
- Proxy overhead
- Request batching
- Model availability

### Appendix F: Useful Commands

#### Development
```bash
# Install dependencies
poetry install -C api

# Start backend
python -m api.main

# Start frontend
npm run dev

# Run tests
pytest
pytest -m unit
pytest -m integration

# Check logs
tail -f api/logs/application.log
```

#### ADC Management
```bash
# Login (development)
gcloud auth application-default login

# Revoke (cleanup)
gcloud auth application-default revoke

# Print token (debugging)
gcloud auth application-default print-access-token

# Set quota project
gcloud auth application-default set-quota-project YOUR_PROJECT
```

#### GCP/Vertex AI
```bash
# List models
gcloud ai models list --region=us-central1

# Test embedding API
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT/locations/us-central1/publishers/google/models/text-embedding-004:predict \
  -d '{"instances":[{"task_type":"SEMANTIC_SIMILARITY","content":"test"}]}'

# Check API status
gcloud services list --enabled | grep aiplatform
```

#### Proxy Testing
```bash
# Test non-streaming
curl -X POST http://localhost:4001/v1/chat/completions \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"model":"google-vertex/gemini-2.5-pro","messages":[{"role":"user","content":"Hello"}]}'

# Test streaming
curl -X POST http://localhost:4001/v1/chat/completions \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"model":"google-vertex/gemini-2.5-pro","messages":[{"role":"user","content":"Count 1-5"}],"stream":true}'
```

---

## Next Steps

### Immediate Actions (Post-Approval)

1. **Review this plan** with your team
2. **Validate ADC access** to your GCP project
3. **Confirm proxy configuration** (localhost:4001 details)
4. **Set up development environment**:
   - Install `gcloud` CLI
   - Run `gcloud auth application-default login`
   - Set environment variables

### Implementation Timeline

| Phase | Tasks | Estimated Time | Priority |
|-------|-------|---------------|----------|
| **Phase 1** | Vertex AI Embeddings | 4-6 hours | HIGH |
| **Phase 2** | Proxy Configuration | 2-3 hours | HIGH |
| **Testing** | Unit + Integration | 3-4 hours | HIGH |
| **Documentation** | Update README, docs | 1-2 hours | MEDIUM |
| **Phase 3** | Direct Vertex AI (optional) | 6-8 hours | LOW |

**Total Estimated Time**: 1-2 days for Phases 1-2 + Testing

### Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| ADC credentials not working | HIGH | Set up test environment first, validate with gcloud CLI |
| Proxy incompatibility | MEDIUM | Thoroughly test with curl before integrating |
| Embedding dimension changes | MEDIUM | Clear cache, plan for migration |
| Performance degradation | LOW | Benchmark before/after, optimize batch sizes |

---

## Approval Checklist

Before proceeding with implementation:

- [ ] Architecture reviewed and approved
- [ ] ADC access confirmed for GCP project
- [ ] Proxy (localhost:4001) specifications validated
- [ ] Security considerations addressed
- [ ] Team members trained on ADC usage
- [ ] Development environment prepared
- [ ] Rollback plan understood
- [ ] Timeline and priorities agreed

---

**Document Control**
- **Last Updated**: 2025-11-11
- **Version**: 1.0
- **Next Review**: After Phase 1 implementation
- **Approvers**: [Your Team]

---

## Questions or Concerns?

Before implementation, please address:

1. Do you have the necessary IAM permissions for Vertex AI in your GCP project?
2. Is the proxy (localhost:4001) ready for production use, or development only?
3. Do you prefer Option A (use existing OpenAI provider) or Option B (dedicated vertex-proxy provider) for Phase 2?
4. Should we implement Phase 3 (direct Vertex AI), or is the proxy sufficient?
5. Any specific security requirements not covered in this plan?

Please review and approve before proceeding with implementation.
