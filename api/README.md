# 🚀 DeepWiki API

This is the backend API for DeepWiki, providing smart code analysis and AI-powered documentation generation.

## ✨ Features

- **Streaming AI Responses**: Real-time responses using Google's Generative AI (Gemini)
- **Smart Code Analysis**: Automatically analyzes GitHub repositories
- **RAG Implementation**: Retrieval Augmented Generation for context-aware responses
- **Local Storage**: All data stored locally - no cloud dependencies
- **Conversation History**: Maintains context across multiple questions

## 🔧 Quick Setup

### Step 1: Install Dependencies

```bash
# From the project root
pip install -r api/requirements.txt
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the project root:

```
GOOGLE_API_KEY=your_google_api_key  # For AI generation
OPENAI_API_KEY=your_openai_api_key  # For embeddings
PORT=8001  # Optional, defaults to 8001
```

> 💡 **Where to get these keys:**
> - Get a Google API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
> - Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)

### Step 3: Start the API Server

```bash
# From the project root
python -m api.main
```

The API will be available at `http://localhost:8001`

## 🧠 How It Works

### 1. Repository Indexing
When you provide a GitHub repository URL, the API:
- Clones the repository locally (if not already cloned)
- Reads all files in the repository
- Creates embeddings for the files using OpenAI
- Stores the embeddings in a local database

### 2. Smart Retrieval (RAG)
When you ask a question:
- The API finds the most relevant code snippets
- These snippets are used as context for the AI
- The AI generates a response based on this context

### 3. Real-Time Streaming
- Responses are streamed in real-time
- You see the answer as it's being generated
- This creates a more interactive experience

## 📡 API Endpoints

### GET /
Returns basic API information and available endpoints.

### POST /chat/completions/stream
Streams an AI-generated response about a GitHub repository.

**Request Body:**

```json
{
  "repo_url": "https://github.com/username/repo",
  "messages": [
    {
      "role": "user",
      "content": "What does this repository do?"
    }
  ],
  "filePath": "optional/path/to/file.py"  // Optional
}
```

**Response:**
A streaming response with the generated text.

## 📝 Example Code

```python
import requests

# API endpoint
url = "http://localhost:8001/chat/completions/stream"

# Request data
payload = {
    "repo_url": "https://github.com/AsyncFuncAI/deepwiki-open",
    "messages": [
        {
            "role": "user",
            "content": "Explain how React components work"
        }
    ]
}

# Make streaming request
response = requests.post(url, json=payload, stream=True)

# Process the streaming response
for chunk in response.iter_content(chunk_size=None):
    if chunk:
        print(chunk.decode('utf-8'), end='', flush=True)
```

## 💾 Storage

All data is stored locally on your machine:
- Cloned repositories: `~/.adalflow/repos/`
- Embeddings and indexes: `~/.adalflow/databases/`

No cloud storage is used - everything runs on your computer!
