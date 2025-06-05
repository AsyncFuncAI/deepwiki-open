---
title: Configuration
sidebar_label: Configuration
---

# Configuration

## Configuration Directory

You can override the default location of configuration files using the `DEEPWIKI_CONFIG_DIR` environment variable:

```bash
DEEPWIKI_CONFIG_DIR=/path/to/custom/config/dir
```

## Configuration Files

DeepWiki uses JSON configuration files to manage various aspects of the system:

1. **`generator.json`**: Configuration for text generation models
   - Defines available model providers (Google, OpenAI, OpenRouter, Ollama)
   - Specifies default and available models for each provider
   - Contains model-specific parameters like temperature and top_p

2. **`embedder.json`**: Configuration for embedding models and text processing
   - Defines embedding models for vector storage
   - Contains retriever configuration for RAG
   - Specifies text splitter settings for document chunking

3. **`repo.json`**: Configuration for repository handling
   - Contains file filters to exclude certain files and directories
   - Defines repository size limits and processing rules

By default, these files are located in the `api/config/` directory.

## Custom Model Selection for Service Providers

DeepWiki allows service providers to offer multiple AI model choices to users without code changes. You can select from predefined options or enter custom model identifiers in the interface.

## Base URL Configuration for Enterprise Private Channels

For enterprise users with private API channels or self-hosted LLM services, you can specify a custom OpenAI-compatible endpoint:

```bash
OPENAI_BASE_URL=https://custom-openai-endpoint.com/v1
```

## Using OpenAI-Compatible Embedding Models (e.g., Alibaba Qwen)

If you want to use embedding models compatible with the OpenAI API (such as Alibaba Qwen):

1. Replace `api/config/embedder.json` with `api/config/embedder_openai_compatible.json`.
2. Set environment variables in your `.env`:
   ```bash
   OPENAI_API_KEY=your_api_key
   OPENAI_API_BASE_URL=your_openai_compatible_endpoint
   ```

## 🔌 OpenRouter Integration

DeepWiki supports [OpenRouter](https://openrouter.ai/) as a model provider, giving access to hundreds of AI models through a single API:

- **Multiple Model Options**: Access models from OpenAI, Anthropic, Google, Meta, Mistral, and more
- **Simple Configuration**: Just add your OpenRouter API key and select the model you want to use
- **Cost Efficiency**: Choose models that fit your budget and performance needs
- **Easy Switching**: Toggle between different models without changing your code

### How to Use OpenRouter with DeepWiki

1. Sign up at [OpenRouter](https://openrouter.ai/) and obtain your API key.
2. Add `OPENROUTER_API_KEY=your_key` to your `.env`.
3. Enable the "Use OpenRouter API" option in the UI.
4. Choose a model (e.g., GPT-4o, Claude 3.5 Sonnet, Gemini 2.0).