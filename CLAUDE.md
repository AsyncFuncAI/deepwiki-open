# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Full app

```bash
# Run backend + frontend with Docker Compose
docker-compose up
```

Docker exposes the FastAPI backend on `${PORT:-8001}` and the Next.js frontend on `3000`. Runtime data, repository clones, embeddings, and wiki cache are persisted under `~/.adalflow`.

### Backend API

```bash
# Install backend dependencies from the repository root
python -m pip install poetry==2.0.1 && poetry install -C api

# Start the FastAPI server on PORT or 8001
python -m api.main

# Alternate helper used by run.sh
uv run -m api.main
```

The backend loads `.env` from the repository root. `GOOGLE_API_KEY` and `OPENAI_API_KEY` are the common baseline keys; other providers are enabled by their matching environment variables and `api/config/*.json` entries. `PORT` defaults to `8001`.

### Frontend

```bash
# Install JavaScript dependencies
npm install

# Start Next.js on port 3000
npm run dev

# Production build and start
npm run build
npm run start

# Lint
npm run lint
```

The frontend uses `SERVER_BASE_URL` to reach the backend, defaulting to `http://localhost:8001`.

### Tests

```bash
# All tests via the project runner
python tests/run_tests.py

# Test categories
python tests/run_tests.py --unit
python tests/run_tests.py --integration
python tests/run_tests.py --api

# Single test file examples
python tests/unit/test_google_embedder.py
python tests/api/test_api.py

# Pytest directly, when useful
pytest tests/unit/test_google_embedder.py
pytest tests/unit/test_google_embedder.py::test_name
```

Some tests require API keys (`GOOGLE_API_KEY`, `OPENAI_API_KEY`) or a running backend for API tests.

## Architecture Overview

DeepWiki is split into a Next.js frontend and a FastAPI backend. The frontend collects repository details, provider/model selection, tokens, language, and include/exclude filters, then calls backend endpoints to clone/index repositories, generate wiki content, and stream Ask responses.

### Frontend (`src/`)

- `src/app/page.tsx` is the landing/configuration flow. It parses GitHub/GitLab/Bitbucket/local inputs, stores per-repository UI settings in `localStorage`, and routes to repository wiki pages.
- `src/app/[owner]/[repo]/page.tsx` is the main wiki UI. It builds request bodies with repo credentials, provider/model selection, language, and file filters, then renders generated wiki pages and Ask interactions.
- `src/app/api/*/route.ts` files are Next.js proxy/fallback routes. `next.config.ts` also rewrites selected frontend API paths to the backend using `SERVER_BASE_URL`.
- `src/utils/websocketClient.ts` is the primary chat streaming client for Ask; `src/app/api/chat/stream/route.ts` keeps an HTTP streaming fallback.
- `src/contexts/LanguageContext.tsx` and `src/messages/*.json` provide localized UI strings.

### Backend (`api/`)

- `api/main.py` loads environment variables, configures logging, patches development file watching, checks common API keys, and starts Uvicorn with `api.api:app`.
- `api/api.py` defines FastAPI models and routes for auth, model config, wiki cache, export, repository processing, local repository structure, health, and streaming/chat endpoints.
- `api/config.py` loads `api/config/generator.json`, `embedder.json`, `repo.json`, and `lang.json`, replaces `${ENV_VAR}` placeholders, and maps provider/client names to implementation classes.
- `api/data_pipeline.py` clones repositories, reads source/doc files with include/exclude filters, splits content, creates embeddings, and stores indexes in AdalFlow local databases.
- `api/rag.py` builds the retrieval-augmented Ask pipeline using AdalFlow retrievers, the configured embedder, provider-specific generator clients, and a small in-memory conversation history wrapper.
- Provider clients (`openai_client.py`, `openrouter_client.py`, `bedrock_client.py`, `azureai_client.py`, `dashscope_client.py`, Google/Ollama integration) adapt each LLM provider to the generator/embedder config model.

### Configuration and storage

- `api/config/generator.json` defines generation providers, model lists, client classes, defaults, and model kwargs.
- `api/config/embedder.json` defines the active embedding backend; `DEEPWIKI_EMBEDDER_TYPE` selects between OpenAI, Google, Ollama, and Bedrock-style embedder configs.
- `api/config/repo.json` controls repository limits and file filters.
- `DEEPWIKI_CONFIG_DIR` can point the backend at an alternate config directory without changing code.
- Local runtime state is under `~/.adalflow`: cloned repositories, vector databases, and wiki cache. Docker Compose mounts this path into the container.

### Data flow

1. The user enters a repository URL/path and options in the Next.js UI.
2. The backend clones or reads the repository, applying file filters from the request and `repo.json`.
3. The data pipeline chunks files and creates embeddings via the configured embedder.
4. Wiki generation and Ask responses use the selected provider/model through `api/config.py` and provider client classes.
5. Generated wiki structures are cached locally and exposed back to the frontend for navigation, export, and subsequent Ask requests.

## Notes for Future Agents

- Keep frontend proxy behavior in sync between `next.config.ts`, `src/app/api/*/route.ts`, and backend route names in `api/api.py`.
- When changing model/provider behavior, update `api/config/generator.json` or `api/config/embedder.json` first, then verify the matching client class and environment variables in `api/config.py`.
- Be careful with tokens in repository clone paths and logs; `api/data_pipeline.py` sanitizes clone errors and logs the original repository URL instead of tokenized URLs.
- Backend tests and integration flows may call external LLM/embedding services. Prefer focused unit tests or mocked clients when changing pure parsing/configuration behavior.