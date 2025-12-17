# Request Flow Analysis

## Entry Points Overview
The system exposes two primary layers of entry points: the Next.js frontend and the FastAPI backend.

- **Frontend Entry Points (Next.js - Port 3000)**:
    - **Web UI**: The main application interface served at the root and dynamic repository routes (e.g., `/[owner]/[repo]`).
    - **API Proxy Routes**: Located in `src/app/api/`, these routes act as proxies to the backend:
        - `POST /api/chat/stream`: Fallback HTTP streaming for chat.
        - `GET /api/models/config`: Fetches available LLM providers and models.
        - `GET /api/wiki/projects`: Lists processed repositories.
        - `GET /api/auth/status` & `POST /api/auth/validate`: Authentication checks.

- **Backend Entry Points (FastAPI - Port 8001)**:
    - **WebSocket**: `WS /ws/chat` - The primary entry point for real-time, streaming RAG chat.
    - **REST API**:
        - `POST /chat/completions/stream`: HTTP streaming chat endpoint.
        - `GET /models/config`: Returns the system's LLM configuration.
        - `GET/POST/DELETE /api/wiki_cache`: Manages the server-side JSON cache for generated wikis.
        - `GET /api/processed_projects`: Scans the cache directory to list all indexed repositories.
        - `POST /export/wiki`: Generates downloadable Markdown or JSON exports.
        - `GET /local_repo/structure`: Analyzes local directories for the "Local Path" feature.

## Request Routing Map
- **Client-to-Proxy**: The frontend UI components (like `Ask.tsx` or `ProcessedProjects.tsx`) typically call the Next.js `/api/*` routes.
- **Proxy-to-Backend**: Next.js routes (e.g., `src/app/api/chat/stream/route.ts`) use the `fetch` API to forward requests to the `TARGET_SERVER_BASE_URL` (defaulting to `http://localhost:8001`).
- **Direct WebSocket**: For the core chat functionality, `src/utils/websocketClient.ts` bypasses the Next.js proxy and establishes a direct `WebSocket` connection to the backend's `/ws/chat` endpoint.
- **Backend Internal Routing**: FastAPI routes requests based on the path and method defined in `api/api.py`. It uses `app.add_api_route` and `app.add_websocket_route` to link paths to handler functions in `api/simple_chat.py` and `api/websocket_wiki.py`.

## Middleware Pipeline
- **CORS Middleware**: The FastAPI application in `api/api.py` uses `CORSMiddleware` configured with `allow_origins=["*"]`. This is critical for allowing the Next.js frontend (on port 3000) to communicate with the backend (on port 8001) and for direct WebSocket connections.
- **Next.js Request Handling**: While no custom `middleware.ts` is present, Next.js handles standard request preprocessing, including environment variable injection and route matching.
- **Logging Middleware**: A custom logging configuration in `api/logging_config.py` sets up a `RotatingFileHandler`. It includes a filter (`IgnoreLogChangeDetectedFilter`) to suppress development-time noise from file watchers.

## Controller/Handler Analysis
- **`api/api.py`**: The main controller for administrative and metadata operations. It handles Pydantic model validation for wiki structures and manages the filesystem-based cache in `~/.adalflow/wikicache`.
- **`api/websocket_wiki.py`**: The primary handler for the chat lifecycle. It:
    1. Accepts the WebSocket connection.
    2. Parses the `ChatCompletionRequest`.
    3. Initializes the `RAG` component.
    4. Streams LLM chunks back to the client.
- **`api/rag.py`**: The core logic controller for the RAG pipeline. It orchestrates the `DatabaseManager` for retrieval and manages conversation `Memory`.
- **`api/data_pipeline.py`**: The low-level handler for data operations. It manages `git clone` operations, file parsing, and interacts with the vector database (FAISS).

## Authentication & Authorization Flow
- **System-Level Auth**: Controlled by `WIKI_AUTH_MODE`. If enabled, the `WIKI_AUTH_CODE` must be provided for sensitive operations like deleting a wiki cache (`DELETE /api/wiki_cache`).
- **Repository-Level Auth**: The `ChatCompletionRequest` and `WikiCacheRequest` models include an optional `token` field. This Personal Access Token is used by `download_repo` in `api/data_pipeline.py` to authenticate Git clones for private GitHub, GitLab, or Bitbucket repositories.
- **Provider Auth**: LLM provider authentication (e.g., OpenAI, Google Gemini) is handled server-side via environment variables (`OPENAI_API_KEY`, `GOOGLE_API_KEY`) which are used to initialize the respective AI clients.

## Error Handling Pathways
- **REST API Errors**: Handled via FastAPI's `HTTPException`. Errors are returned as JSON objects with a `detail` field and appropriate HTTP status codes (e.g., 401 for unauthorized, 404 for missing cache).
- **WebSocket Errors**: If an error occurs during the WebSocket session (e.g., "No valid documents with embeddings found"), the backend sends a descriptive text message to the client and then calls `websocket.close()`.
- **Proxy Errors**: The Next.js proxy routes include `try-catch` blocks that capture backend failures or network issues, returning a 500 status with the error message to the frontend.
- **Validation Errors**: Pydantic models in the backend automatically catch and return 422 Unprocessable Entity errors if the request body does not match the expected schema.

## Request Lifecycle Diagram
1. **User Action**: User enters a repository URL and a question in the `Ask` component.
2. **Connection**: The frontend `websocketClient` initiates a connection to `ws://localhost:8001/ws/chat`.
3. **Handshake**: FastAPI accepts the connection and the client sends the `ChatCompletionRequest` JSON.
4. **Retrieval Preparation**:
    - Backend checks if the repository is already cloned and indexed.
    - If not, `data_pipeline.py` clones the repo and `RAG.prepare_retriever` builds the vector index.
5. **Context Retrieval**: The `RAG` component searches the index for documents relevant to the user's query.
6. **Prompt Construction**: A system prompt is generated, combining the user's query, conversation history from `Memory`, and the retrieved code context.
7. **Streaming Response**:
    - The backend calls the configured LLM provider (e.g., Google Gemini).
    - As chunks of text arrive from the LLM, they are immediately sent over the WebSocket to the frontend.
8. **Termination**: Once the LLM finishes the response, the backend closes the WebSocket, and the frontend updates the UI with the complete message.