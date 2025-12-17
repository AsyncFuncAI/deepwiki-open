# Code Structure Analysis

## Architectural Overview
The **DeepWiki-Open** project is a full-stack application designed to generate and interact with documentation (wikis) for software repositories using Retrieval-Augmented Generation (RAG). The architecture is split into two main parts:

1.  **Frontend (Next.js)**: A React-based web interface using the App Router. It provides a dynamic UI for exploring repository structures and a chat interface for querying the codebase. It communicates with the backend via REST APIs for configuration and WebSockets for real-time, streaming chat completions.
2.  **Backend (FastAPI)**: A Python-based API that orchestrates the RAG pipeline. It leverages the `adalflow` library to build modular data processing and retrieval components. The backend is provider-agnostic, supporting multiple LLM and embedding providers (OpenAI, Google Gemini, Ollama, Azure, OpenRouter, etc.).

The system follows a **modular monolith** pattern where core responsibilities (data ingestion, retrieval, generation, and API serving) are separated into distinct modules within the `api/` directory.

## Core Components
### Backend (`/api`)
-   **`api.py`**: The central FastAPI application defining REST endpoints for wiki management, configuration retrieval, and authentication.
-   **`rag.py`**: Implements the RAG pipeline using `adalflow`. It defines the `RAG` component, `Memory` for conversation history, and custom data classes for structured answers.
-   **`data_pipeline.py`**: Handles repository lifecycle management, including cloning (GitHub, GitLab, Bitbucket), document parsing, token counting, and vector database management via the `DatabaseManager`.
-   **`websocket_wiki.py`**: Manages real-time WebSocket connections for chat, handling the orchestration between user queries, RAG retrieval, and LLM generation.
-   **`config.py`**: A centralized configuration manager that loads JSON settings from `/api/config/` and handles environment variable substitution.
-   **`prompts.py`**: Contains all system prompts and templates for RAG, simple chat, and the "Deep Research" multi-turn process.

### Frontend (`/src`)
-   **`src/app`**: Contains the page routes, including dynamic routes for specific repositories (`[owner]/[repo]`) and specialized views like `slides` and `workshop`.
-   **`src/components`**: Reusable UI components such as `WikiTreeView`, `Ask` (chat interface), `Markdown` (rendering), and `ModelSelectionModal`.
-   **`src/utils/websocketClient.ts`**: A dedicated client for managing WebSocket communication with the backend.

## Service Definitions
-   **Wiki Service**: Managed through `api.py`, it handles the creation, caching, and exporting (Markdown/JSON) of wiki structures.
-   **Chat Service**: Implemented in `websocket_wiki.py` (WebSocket) and `simple_chat.py` (HTTP Stream), providing a stateful, streaming chat experience.
-   **Data Pipeline Service**: Encapsulated in `data_pipeline.py`, responsible for transforming raw repository files into searchable embeddings stored in a local FAISS index.
-   **Model Configuration Service**: Provides a unified interface to query available LLM providers and models via the `/models/config` endpoint, dynamically resolved from `generator.json`.
-   **Deep Research Service**: A specialized logic within the chat handlers that uses multi-turn prompts to perform deep, iterative analysis of specific topics.

## Interface Contracts
-   **Pydantic Models (`api.py`, `websocket_wiki.py`)**:
    -   `WikiPage`: Defines the structure of a single documentation page.
    -   `WikiStructureModel`: Defines the hierarchy and metadata of the entire wiki.
    -   `RepoInfo`: Captures repository details (owner, repo, type, token).
    -   `ChatCompletionRequest`: Standardizes the payload for chat interactions, including model parameters and file filters.
-   **WebSocket Protocol**: A JSON-based message exchange format for real-time chat, where the client sends a `ChatCompletionRequest` and receives streamed text responses.
-   **Adalflow Components**: The `RAG` class and `Memory` class follow the `adal.Component` and `adal.DataComponent` interfaces, ensuring compatibility with the Adalflow ecosystem.

## Design Patterns Identified
-   **Strategy Pattern**: Used in the LLM and Embedder clients (`openai_client.py`, `google_embedder_client.py`, `azureai_client.py`, etc.) to provide a uniform interface for different AI providers.
-   **Factory Pattern**: `get_embedder` (in `api/tools/embedder.py`) and `load_generator_config` act as factories for creating configured clients based on environment settings.
-   **Repository Pattern**: The `DatabaseManager` abstracts the complexities of Git operations and vector database persistence.
-   **Component-based Architecture**: Both in React (frontend) and Adalflow (backend), where logic is encapsulated into reusable, composable units.
-   **Observer Pattern**: Utilized via WebSockets to push real-time updates from the backend to the frontend during long-running generation tasks.

## Component Relationships
-   **Frontend `Ask` Component → `websocketClient` → Backend `websocket_wiki.py`**: The primary path for user interaction.
-   **`websocket_wiki.py` → `RAG` Component**: The WebSocket handler instantiates and calls the RAG pipeline for each request.
-   **`RAG` → `FAISSRetriever` & `Memory`**: The RAG component orchestrates retrieval from the vector store and manages conversation state.
-   **`FAISSRetriever` → `DatabaseManager`**: The retriever relies on the data pipeline to ensure the repository is cloned and indexed.
-   **`DatabaseManager` → `Embedder`**: The pipeline uses the configured embedder to generate vectors for repository documents.

## Key Methods & Functions
-   **`RAG.prepare_retriever` (`api/rag.py`)**: Orchestrates the setup of the vector database for a given repository, including cloning and indexing.
-   **`handle_websocket_chat` (`api/websocket_wiki.py`)**: The main entry point for processing chat queries, performing retrieval, and streaming LLM responses.
-   **`download_repo` (`api/data_pipeline.py`)**: A robust utility for cloning GitHub, GitLab, and Bitbucket repositories with support for access tokens.
-   **`read_all_documents` (`api/data_pipeline.py`)**: Recursively parses repository files while respecting complex exclusion/inclusion filters defined in `repo.json`.
-   **`get_embedder` (`api/tools/embedder.py`)**: Dynamically initializes the correct embedder (OpenAI, Google, or Ollama) based on configuration.

## Available Documentation
-   **`README.md`**: High-level project overview and setup instructions.
-   **`api/README.md`**: Documentation specifically for the backend API and RAG logic.
-   **`Ollama-instruction.md`**: Detailed guide for running the system with local Ollama models.
-   **`tests/README.md`**: Instructions for running unit and integration tests.
-   **`.ai/docs/api_analysis.md`**: Detailed analysis of the API endpoints and data models.
-   **`.ai/docs/structure_analysis.md`**: Previous structural analysis of the codebase.

**Documentation Quality**: The documentation is high-quality and comprehensive. It covers installation, configuration, and specific deployment scenarios (like local LLMs). The presence of multi-language READMEs and specialized guides for Ollama indicates a mature project with a focus on developer experience. The code is well-structured with clear naming conventions and descriptive docstrings in key modules.