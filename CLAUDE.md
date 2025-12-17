# CLAUDE.md - DeepWiki-Open Configuration

DeepWiki-Open is a full-stack RAG (Retrieval-Augmented Generation) application designed to generate comprehensive wikis and provide interactive chat capabilities for software repositories.

## 🛠 Common Commands

### Backend (FastAPI)
- **Install Dependencies**: `pip install -r requirements.txt` (inside `api/` directory)
- **Run Server**: `python api/main.py` (Runs on port 8001 by default)
- **Run Tests**: `pytest`
- **Linting**: `flake8 api/` or `black api/`

### Frontend (Next.js)
- **Install Dependencies**: `npm install`
- **Run Development**: `npm run dev` (Runs on port 3000)
- **Build Production**: `npm run build`
- **Linting**: `npm run lint`

## 🏗 Architecture Overview

The project follows a modular monolith pattern split into a Next.js frontend and a Python FastAPI backend.

### Backend (`api/`)
- **`api.py`**: Main FastAPI application and REST endpoints.
- **`rag.py`**: Core RAG pipeline using the `adalflow` library.
- **`data_pipeline.py`**: Repository lifecycle (clone, parse, index) and FAISS management.
- **`websocket_wiki.py`**: Real-time WebSocket handler for streaming chat.
- **`config.py`**: Centralized configuration and LLM provider mapping.
- **`tools/embedder.py`**: Factory for embedding models (OpenAI, Google, Ollama).

### Frontend (`src/`)
- **App Router**: Dynamic routes in `src/app/[owner]/[repo]` for repository views.
- **Components**: Reusable UI in `src/components` (e.g., `Ask.tsx` for chat, `WikiTreeView.tsx`).
- **WebSocket Client**: `src/utils/websocketClient.ts` manages real-time backend communication.

## 📏 Code Style & Conventions

### Python (Backend)
- **Type Hinting**: Use Python type hints for all function signatures.
- **Validation**: Use Pydantic models for all request/response bodies.
- **Documentation**: Use Google-style docstrings for complex logic.
- **Framework**: Leverage `adalflow` components (`adal.Component`) for RAG logic.

### TypeScript/React (Frontend)
- **Typing**: Maintain strict TypeScript interfaces that mirror backend Pydantic models.
- **Components**: Use functional components with Tailwind CSS for styling.
- **State**: Use React Context for global state (e.g., `LanguageContext`) and local state for UI.
- **Icons**: Use `lucide-react` for iconography.

## 📦 Data & Storage
- **Local Storage**: The system stores data in `~/.adalflow/`:
    - `/repos/`: Cloned source code.
    - `/databases/`: FAISS vector indices and metadata (.pkl).
    - `/wikicache/`: Generated wiki structures (JSON).
- **Client Cache**: The frontend uses `localStorage` to cache wiki pages for instant loading.

## ⚠️ Development Gotchas
- **WebSocket vs REST**: Chat uses WebSockets (`/ws/chat`) for streaming. Ensure the frontend client handles connection lifecycle and errors.
- **Token Limits**: Be mindful of the `MAX_INPUT_TOKENS` (approx. 7500-8000). The system uses `tiktoken` for counting.
- **Environment Variables**: Ensure `OPENAI_API_KEY` or `GOOGLE_API_KEY` are set. Check `api/config/generator.json` for provider settings.
- **Auth**: If `WIKI_AUTH_MODE` is enabled, the `WIKI_AUTH_CODE` must be passed in headers/payloads for sensitive operations.
- **Git Dependencies**: The backend requires the `git` CLI to be installed on the host system for repository cloning.

## 🔗 Key Components
- **`RAG` (api/rag.py)**: Orchestrates retrieval and generation.
- **`DatabaseManager` (api/data_pipeline.py)**: Handles the FAISS vector store.
- **`Ask` (src/components/Ask.tsx)**: The primary chat interface component.
- **`WikiStructureModel`**: The core data contract for the generated documentation hierarchy.
