# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DeepWiki-Open is a full-stack AI-powered documentation generator that automatically creates interactive wikis for GitHub, GitLab, and Bitbucket repositories. It uses Next.js 15 frontend with FastAPI Python backend to analyze code structure and generate comprehensive documentation with visual diagrams.

## Development Commands

### Frontend (Next.js)
```bash
npm install                    # Install dependencies
npm run dev                    # Start dev server with Turbopack on port 3000
npm run build                  # Build production application
npm run start                  # Start production server
npm run lint                   # Run ESLint code quality checks
```

### Backend (Python FastAPI)
```bash
pip install -r api/requirements.txt  # Install Python dependencies
python -m api.main                   # Start FastAPI server on port 8001
pytest                              # Run test suite
pytest -m unit                      # Run unit tests only
pytest -m integration               # Run integration tests only
```

### Full Stack Development
```bash
# Terminal 1: Start backend
python -m api.main

# Terminal 2: Start frontend
npm run dev

# Or use Docker Compose for full environment
docker-compose up
```

## Architecture Overview

### Frontend Structure (`src/`)
- **App Router**: Modern Next.js routing with server/client components in `src/app/`
- **Dynamic Routes**: Repository pages at `[owner]/[repo]/` with server-side rendering
- **Component Library**: Reusable UI components in `src/components/`
- **Context System**: Global state management for language, theme, and processed projects
- **Internationalization**: 8 language support via next-intl with files in `src/messages/`
- **TypeScript**: Full type safety with definitions in `src/types/`

### Backend Structure (`api/`)
- **FastAPI Application**: Main server in `api/main.py` and routes in `api/api.py`
- **Multi-Provider AI**: Supports Google Gemini, OpenAI, OpenRouter, Azure OpenAI, and Ollama
- **RAG System**: Vector embeddings with FAISS in `api/rag.py`
- **WebSocket Streaming**: Real-time AI responses via `api/websocket_wiki.py`
- **Configuration-Driven**: JSON configs in `api/config/` for models, embeddings, and repo processing

### Key Architectural Patterns
- **Provider Pattern**: Multiple AI model providers with unified interface
- **RAG Implementation**: Retrieval Augmented Generation for repository Q&A
- **Streaming Responses**: WebSocket-based real-time AI output
- **Configuration-Driven**: JSON-based model and provider configuration
- **Component-Based UI**: Modular React components with TypeScript

## Environment Configuration

### Required Environment Variables
```bash
# At minimum, need one AI provider API key
GOOGLE_API_KEY=your_google_api_key     # For Google Gemini models
OPENAI_API_KEY=your_openai_api_key     # For OpenAI models (also used for embeddings)
OPENROUTER_API_KEY=your_openrouter_api_key  # For OpenRouter models

# Azure OpenAI (optional)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
AZURE_OPENAI_VERSION=your_azure_openai_version

# Server configuration
PORT=8001                              # Backend port (default: 8001)
SERVER_BASE_URL=http://localhost:8001  # Backend URL for frontend API calls

# Optional features
OLLAMA_HOST=http://localhost:11434     # For local Ollama models
DEEPWIKI_AUTH_MODE=true                # Enable authorization mode
DEEPWIKI_AUTH_CODE=your_secret_code    # Required when auth mode enabled
LOG_LEVEL=INFO                         # Logging level (DEBUG, INFO, WARNING, ERROR)
LOG_FILE_PATH=api/logs/application.log # Log file location
```

## Development Workflows

### Adding New AI Providers
1. Create client in `api/{provider}_client.py` following existing patterns
2. Update `api/config/generator.json` with provider configuration
3. Add provider selection in frontend components
4. Update environment variable documentation

### Frontend Component Development
- Follow existing component patterns in `src/components/`
- Use TypeScript interfaces from `src/types/`
- Implement internationalization with next-intl
- Support both light/dark themes via next-themes
- Use Tailwind CSS for styling consistency

### Backend API Development
- Follow FastAPI patterns in `api/api.py`
- Use Pydantic models for request/response validation
- Implement proper error handling and logging
- Add WebSocket support for streaming responses when needed

### Configuration Management
- Model configurations: `api/config/generator.json`
- Embedding settings: `api/config/embedder.json`
- Repository processing: `api/config/repo.json`
- Custom config directory via `DEEPWIKI_CONFIG_DIR` environment variable

## Key Features Implementation

### Repository Processing Pipeline
1. Repository validation and cloning
2. Code structure analysis and file filtering
3. Embedding generation using FAISS vector storage
4. AI-powered documentation generation with provider selection
5. Mermaid diagram creation for visualization
6. Wiki structure organization and caching

### Multi-Language Support
- Language detection and switching via `src/contexts/LanguageContext.tsx`
- Translation files in `src/messages/{locale}.json`
- URL-based locale routing in Next.js App Router
- RTL language support preparation

### Real-Time Chat System
- WebSocket connections for streaming AI responses
- RAG-powered repository Q&A with context retrieval
- Conversation history management
- "DeepResearch" mode for multi-turn investigations

## Testing Strategy

### Frontend Testing
- ESLint configuration for code quality in `eslint.config.mjs`
- TypeScript strict mode enabled for type safety
- Component testing patterns (add tests in `__tests__/` directories)

### Backend Testing
- pytest configuration in `pytest.ini`
- Test markers: `unit`, `integration`, `slow`, `network`
- Test files in `test/` directory following `test_*.py` pattern
- Run specific test categories: `pytest -m unit`

## Common Development Patterns

### API Route Proxying
- Next.js rewrites in `next.config.ts` proxy API calls to FastAPI backend
- Frontend makes requests to `/api/*` which are forwarded to backend
- Handles CORS and development/production URL differences

### State Management
- React Context for global state (language, theme, processed projects)
- Local state for component-specific data
- WebSocket state management for real-time features

### Error Handling
- Frontend: Error boundaries and user-friendly error messages
- Backend: FastAPI exception handlers and structured error responses
- Logging: Centralized logging with configurable levels and file output

## Docker Development

### Development Environment
```bash
docker-compose up    # Full stack with hot reloading
```

### Production Deployment
```bash
docker build -t deepwiki-open .
docker run -p 8001:8001 -p 3000:3000 -v ~/.adalflow:/root/.adalflow deepwiki-open
```

## Important Notes

- **API Key Security**: Never commit API keys to version control
- **Data Persistence**: Repository clones, embeddings, and caches stored in `~/.adalflow/`
- **Memory Management**: Large repositories may require increased Node.js memory limits
- **Provider Fallbacks**: Implement graceful degradation when AI providers are unavailable
- **Rate Limiting**: Be aware of AI provider rate limits during development
- **WebSocket Connections**: Properly handle connection lifecycle and error states