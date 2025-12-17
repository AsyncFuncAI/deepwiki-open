# API Documentation

This document provides a comprehensive overview of the APIs exposed and consumed by the `deepwiki-open` project. The project consists of a Next.js frontend and a Python FastAPI backend.

## APIs Served by This Project

The primary API is served by a Python FastAPI backend (default port 8001). The Next.js application (default port 3000) provides proxy routes to this backend for frontend consumption.

### Endpoints

#### 1. Chat Completion (Streaming)
- **Method and Path**: `POST /chat/completions/stream` (HTTP) or `WS /ws/chat` (WebSocket)
- **Description**: Generates a streaming chat response using RAG (Retrieval-Augmented Generation) based on a repository's content.
- **Request (Body)**:
    ```json
    {
      "repo_url": "string",
      "messages": [
        {"role": "user", "content": "string"}
      ],
      "filePath": "string (optional)",
      "token": "string (optional, for private repos)",
      "type": "github | gitlab | bitbucket (default: github)",
      "provider": "google | openai | openrouter | ollama | bedrock | azure | dashscope",
      "model": "string (optional)",
      "language": "en | ja | zh | es | kr | vi (default: en)",
      "excluded_dirs": "string (newline separated)",
      "excluded_files": "string (newline separated)",
      "included_dirs": "string (newline separated)",
      "included_files": "string (newline separated)"
    }
    ```
- **Response**:
    - **HTTP**: `text/event-stream` containing chunks of the generated text.
    - **WebSocket**: Text messages containing chunks of the generated text.
- **Authentication**: Requires valid LLM provider API keys configured on the server.
- **Example**:
    ```bash
    curl -X POST http://localhost:8001/chat/completions/stream \
      -H "Content-Type: application/json" \
      -d '{"repo_url": "https://github.com/user/repo", "messages": [{"role": "user", "content": "Explain this project"}]}'
    ```

#### 2. Model Configuration
- **Method and Path**: `GET /models/config`
- **Description**: Retrieves available LLM providers and their supported models.
- **Response**:
    ```json
    {
      "providers": [
        {
          "id": "google",
          "name": "Google",
          "supportsCustomModel": true,
          "models": [{"id": "gemini-2.5-flash", "name": "gemini-2.5-flash"}]
        }
      ],
      "defaultProvider": "google"
    }
    ```

#### 3. Wiki Cache Management
- **GET /api/wiki_cache**: Retrieves cached wiki data for a repository.
    - **Params**: `owner`, `repo`, `repo_type`, `language`.
- **POST /api/wiki_cache**: Stores generated wiki data in the server-side cache.
- **DELETE /api/wiki_cache**: Deletes a specific wiki cache.
    - **Params**: `owner`, `repo`, `repo_type`, `language`, `authorization_code` (if auth enabled).

#### 4. Processed Projects
- **Method and Path**: `GET /api/processed_projects`
- **Description**: Lists all projects that have been processed and cached on the server.
- **Response**: A list of project entries including `owner`, `repo`, `language`, and `submittedAt`.

#### 5. Wiki Export
- **Method and Path**: `POST /export/wiki`
- **Description**: Exports wiki content as a downloadable Markdown or JSON file.
- **Request**:
    ```json
    {
      "repo_url": "string",
      "pages": [...],
      "format": "markdown | json"
    }
    ```

#### 6. Authentication & Status
- **GET /auth/status**: Checks if the application requires an authorization code (`DEEPWIKI_AUTH_MODE`).
- **POST /auth/validate**: Validates the provided authorization code.
- **GET /health**: Returns the health status of the API service.

---

### Authentication & Security

- **Internal Authentication**: Controlled by `DEEPWIKI_AUTH_MODE` and `DEEPWIKI_AUTH_CODE` environment variables. If enabled, certain operations (like deleting cache) require the code.
- **External API Keys**: The backend requires API keys for the LLM providers (e.g., `OPENAI_API_KEY`, `GOOGLE_API_KEY`). These are stored as environment variables on the server.
- **Repository Access**: For private repositories, users can provide a Personal Access Token (`token` in request body), which is used by the backend to clone the repository via HTTPS.

### Rate Limiting & Constraints

- **Token Limits**: The backend includes a token counter (`tiktoken`). Requests exceeding ~8000 tokens trigger a warning or may be truncated depending on the provider.
- **Concurrency**: The Python backend uses FastAPI with `uvicorn`, supporting asynchronous request handling.

---

## External API Dependencies

### Services Consumed

| Service Name | Purpose | Configuration | Authentication |
| :--- | :--- | :--- | :--- |
| **Google Generative AI** | Default LLM provider (Gemini) | `GOOGLE_API_KEY` | API Key |
| **OpenAI** | LLM and Embeddings | `OPENAI_API_KEY` | API Key |
| **OpenRouter** | Unified LLM access | `OPENROUTER_API_KEY` | API Key |
| **AWS Bedrock** | Enterprise LLM access | `AWS_ACCESS_KEY_ID`, `AWS_REGION`, etc. | IAM Credentials |
| **Azure AI** | Enterprise LLM access | `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT` | API Key |
| **Alibaba Dashscope** | Qwen models | `DASHSCOPE_API_KEY` | API Key |
| **Ollama** | Local LLM execution | `OLLAMA_HOST` (default: localhost:11434) | None (Local) |
| **GitHub/GitLab/Bitbucket** | Source code retrieval | `git clone` via subprocess | Optional PAT |

### Integration Patterns

- **RAG Pipeline**: The project uses `adalflow` to manage the RAG pipeline. It clones repositories, splits text, generates embeddings, and stores them in a local vector database for retrieval during chat.
- **Streaming**: Both HTTP (Server-Sent Events) and WebSockets are used to provide real-time streaming of LLM responses to the frontend.
- **Proxying**: The Next.js frontend proxies requests to the Python backend to avoid CORS issues and centralize API management.

---

## Available Documentation

- **API Analysis**: Located at `/.ai/docs/api_analysis.md`.
- **Structure Analysis**: Located at `/.ai/docs/structure_analysis.md`.
- **OpenAPI Spec**: FastAPI automatically generates an OpenAPI spec at `/openapi.json` and interactive docs at `/docs` (Swagger UI) when the backend is running.
- **Quality**: The internal documentation in `.ai/docs/` provides a high-level overview of the system architecture and data flow. The code itself is well-structured with Pydantic models defining request/response contracts.