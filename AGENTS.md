# DeepWiki-Open Configuration

Full-stack RAG application for generating documentation (wikis) and interacting with codebases via AI.

## Build & Test Commands
- **Backend Setup**: `cd api && pip install -r requirements.txt`
- **Backend Run**: `python api/main.py` (Starts FastAPI on port 8001)
- **Frontend Setup**: `npm install`
- **Frontend Run**: `npm run dev` (Starts Next.js on port 3000)
- **Testing**: `pytest` (Backend), `npm test` (Frontend)
- **Linting**: `flake8 api/` (Python), `npm run lint` (TypeScript)

## Architecture Overview
- **Frontend**: Next.js (App Router), React 19, Tailwind CSS, Mermaid.js for diagrams.
- **Backend**: FastAPI (Python) orchestrating the RAG pipeline.
- **RAG Framework**: `adalflow` for modular data processing and retrieval.
- **Vector Store**: Local FAISS index managed via `DatabaseManager`.
- **Communication**: REST for config/metadata; WebSockets (`/ws/chat`) for streaming chat.
- **Storage**: Local filesystem at `~/.adalflow/` (repos, databases, wikicache).

## Code Style Conventions
- **Python**: PEP8, type hints, Pydantic models for all API schemas.
- **TypeScript**: Strict typing, functional components, mirrored interfaces from Pydantic.
- **Naming**: PascalCase for components/classes, camelCase for TS variables, snake_case for Python.
- **Error Handling**: `HTTPException` in FastAPI; try-catch with UI feedback in React.

## Key Conventions
- **Data Models**: Keep `api/api.py` Pydantic models and `src/types/` TS interfaces in sync.
- **RAG Pipeline**: Logic resides in `api/rag.py` using Adalflow components.
- **Provider Agnostic**: Support for OpenAI, Google Gemini, Ollama, etc., via `api/config.py`.
- **Caching**: Wikis are cached as JSON in `~/.adalflow/wikicache/`.
- **Auth**: Sensitive operations require `WIKI_AUTH_CODE` if `WIKI_AUTH_MODE` is enabled.

## Git Workflow
- **Commits**: Conventional Commits (feat, fix, docs, refactor).
- **Branches**: `main` for stable releases, feature branches for development.
- **PRs**: Ensure both frontend and backend tests pass before merging.
