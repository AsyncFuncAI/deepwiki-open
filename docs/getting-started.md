---
title: Getting Started
sidebar_label: Getting Started
---

# 🚀 Getting Started

The easiest way to get started with DeepWiki is using Docker or running locally.

## Using Docker

```bash
# Clone the repository
git clone https://github.com/AsyncFuncAI/deepwiki-open.git
cd deepwiki-open

# Create a .env file with your API keys
echo "GOOGLE_API_KEY=your_google_api_key" > .env
echo "OPENAI_API_KEY=your_openai_api_key" >> .env
echo "OPENROUTER_API_KEY=your_openrouter_api_key" >> .env
echo "OLLAMA_HOST=your_ollama_host" >> .env

# Run with Docker Compose
docker-compose up
```

For detailed instructions on using DeepWiki with Ollama, see the [Ollama Guide](./ollama-instruction.md).

## Running Locally

```bash
# Install Python dependencies
pip install -r api/requirements.txt

# Start the backend API server
python -m api.main

# Install JavaScript dependencies
npm install

# Start the frontend
npm run dev
```

Open your browser at [http://localhost:3000](http://localhost:3000) to use DeepWiki.