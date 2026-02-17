# Deep Documentation

AI-powered documentation generator that turns any code repository into an interactive wiki with architecture diagrams, cross-references, and a chat interface.

## What it does

1. Analyzes code structure from GitHub, GitLab, Bitbucket, or a local directory
2. Generates comprehensive documentation with AI
3. Creates Mermaid diagrams to visualize architecture and data flow
4. Organizes everything into a navigable wiki with table of contents
5. Lets you chat with your codebase using RAG-powered Q&A

## Quick Start

### 1. Set up API keys

Create a `.env` file in the project root:

```
# At least one model provider is required
GOOGLE_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_api_key

# Embedder — choose one: openai (default), google, ollama
DEEPWIKI_EMBEDDER_TYPE=google
```

### 2. Start the backend

```bash
python -m pip install poetry==2.0.1 && poetry install -C api
python -m api.main
```

### 3. Start the frontend

```bash
npm install && npm run dev
```

### 4. Open [http://localhost:3000](http://localhost:3000)

Enter a repository URL, a local folder path, or click the folder icon to browse. Click "Generate Wiki".

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Google Gemini API key | If using Google models/embeddings |
| `OPENAI_API_KEY` | OpenAI API key | If using OpenAI models/embeddings |
| `OPENROUTER_API_KEY` | OpenRouter API key | If using OpenRouter models |
| `OLLAMA_HOST` | Ollama server URL (default: `http://localhost:11434`) | If using remote Ollama |
| `DEEPWIKI_EMBEDDER_TYPE` | `openai`, `google`, or `ollama` (default: `openai`) | No |
| `PORT` | API server port (default: `8001`) | No |
| `SERVER_BASE_URL` | API server URL (default: `http://localhost:8001`) | No |

## Model Providers

Configured in `api/config/generator.json`. Supported providers:

- **Google** — Gemini 2.5/3 models (default)
- **OpenAI** — GPT-4o, GPT-5, etc.
- **OpenRouter** — Access to Claude, Llama, Mistral, and more via unified API
- **Ollama** — Local open-source models

## Project Structure

```
api/                  # Python backend (FastAPI)
  main.py             # Entry point
  api.py              # API routes
  rag.py              # Retrieval Augmented Generation
  data_pipeline.py    # Repository processing & embeddings
  config/             # Model and embedder configuration
src/                  # Next.js frontend
  app/                # Pages and API routes
  components/         # React components
  utils/              # Utilities (heading extraction, page ordering)
```
