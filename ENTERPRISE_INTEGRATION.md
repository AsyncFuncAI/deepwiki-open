# Enterprise API Integration Guide

This guide explains how to configure DeepWiki-Open to use internal enterprise APIs for LLM-based documentation generation and embedding generation.

## Overview

DeepWiki-Open has been extended to support two new enterprise providers:

1. **Enterprise OpenAI Provider**: Uses internal OpenAI-compatible API for `gpt-oss-130b` model
2. **Enterprise BGE Embedder**: Uses internal BGE-M3 embedding API (1024 dimensions)

Both providers maintain the existing DeepWiki architecture while adding production-ready enterprise capabilities including:
- Custom authentication via `x-dep-ticket` header
- Automatic retry logic with exponential backoff
- Timeout handling
- Batch processing for embeddings
- Graceful handling of partial failures

## Architecture

The integration follows DeepWiki's provider abstraction pattern:

```
Repository → Code Analysis → Agent (Planning)
                                ↓
                    Enterprise BGE Embedder
                                ↓
                        Vector Database
                                ↓
                    RAG Retrieval System
                                ↓
                    Enterprise LLM (gpt-oss-130b)
                                ↓
                        Wiki Generator
                                ↓
                    GitHub Wiki Pages
```

### Key Components

- **`api/enterprise_openai_client.py`**: LLM client for gpt-oss-130b
- **`api/enterprise_bge_embedder_client.py`**: Embedding client for BGE-M3
- **`api/config.py`**: Updated to register new providers
- **`api/config/generator.json`**: Includes enterprise_openai provider
- **`api/config/embedder.json`**: Includes embedder_enterprise_bge configuration

## Configuration

### Step 1: Set Environment Variables

```bash
# Enterprise OpenAI LLM Configuration
export ENTERPRISE_OPENAI_BASE_URL="https://your-enterprise-api.company.com"
export ENTERPRISE_OPENAI_TOKEN="your-enterprise-auth-token"

# Enterprise BGE Embedding Configuration
export ENTERPRISE_BGE_BASE_URL="https://your-embedding-api.company.com"
export ENTERPRISE_BGE_TOKEN="your-embedding-auth-token"

# Set embedder type to enterprise BGE
export DEEPWIKI_EMBEDDER_TYPE="enterprise_bge"
```

See `config_examples/enterprise_env_example.sh` for a complete example.

### Step 2: Configure Generator

Update `api/config/generator.json` or create a custom config:

```json
{
  "default_provider": "enterprise_openai",
  "providers": {
    "enterprise_openai": {
      "client_class": "EnterpriseOpenAIClient",
      "default_model": "gpt-oss-130b",
      "supportsCustomModel": false,
      "models": {
        "gpt-oss-130b": {
          "temperature": 0.7,
          "top_p": 0.8
        }
      }
    }
  }
}
```

### Step 3: Configure Embedder

Update `api/config/embedder.json` or create a custom config:

```json
{
  "embedder": {
    "client_class": "EnterpriseBGEEmbedderClient",
    "batch_size": 100,
    "model_kwargs": {
      "model": "bge-m3"
    }
  },
  "retriever": {
    "top_k": 20
  },
  "text_splitter": {
    "split_by": "word",
    "chunk_size": 350,
    "chunk_overlap": 100
  }
}
```

Note: Set `DEEPWIKI_EMBEDDER_TYPE=enterprise_bge` to activate this configuration.

### Step 4: Run DeepWiki

```bash
# Source your environment variables
source config_examples/enterprise_env_example.sh

# Run DeepWiki with enterprise providers
python main.py --repo-url https://github.com/your-org/your-repo
```

## API Requirements

### Enterprise OpenAI API

**Endpoint Pattern:**
```
POST /{model}/v1/chat/completions
```

**Request Format:**
```json
{
  "model": "openai/gpt-oss-130b",
  "messages": [
    {"role": "system", "content": "System prompt"},
    {"role": "user", "content": "User prompt"}
  ],
  "temperature": 0.7,
  "top_p": 0.8
}
```

**Response Format:** OpenAI Chat Completions compatible
```json
{
  "choices": [
    {
      "message": {
        "content": "Generated text"
      }
    }
  ],
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  }
}
```

**Authentication:** `x-dep-ticket` header with token

### Enterprise BGE Embedding API

**Endpoint:**
```
POST /v1/embeddings
```

**Request Format:**
```json
{
  "model": "bge-m3",
  "input": ["text to embed", "another text"]
}
```

**Response Format:**
```json
{
  "embeddings": [
    [0.1, 0.2, ..., 0.5],  // 1024-dimensional vector
    [0.3, 0.4, ..., 0.6]
  ],
  "model": "bge-m3"
}
```

**Authentication:** `x-dep-ticket` header with token

**Embedding Dimension:** 1024

## Reliability Features

### Retry Logic
- Automatic retry on HTTP 429 (rate limit) and 5xx errors
- Exponential backoff: 2s, 4s, 8s, 16s
- Maximum 5 retry attempts
- Configurable via `max_retries` parameter

### Timeout Handling
- Default timeout: 30s for LLM, 60s for embeddings
- Configurable via client initialization
- Graceful timeout errors with retry

### Batch Processing
- Embeddings processed in batches (default: 100 texts)
- Automatic batch splitting for large inputs
- Configurable via `batch_size` parameter

### Partial Failure Recovery
- If batch embedding fails, retry individual texts
- Returns successful embeddings with error details for failures
- No complete failure unless all texts fail

## File Structure

```
api/
├── enterprise_openai_client.py          # Enterprise LLM client
├── enterprise_bge_embedder_client.py    # Enterprise embedding client
├── config.py                             # Updated with new providers
└── config/
    ├── generator.json                    # Includes enterprise_openai
    └── embedder.json                     # Includes embedder_enterprise_bge

config_examples/
├── enterprise_generator.json             # Example generator config
├── enterprise_embedder.json              # Example embedder config
└── enterprise_env_example.sh             # Example environment variables

ENTERPRISE_INTEGRATION.md                 # This file
```

## Migration Guide

### From Existing OpenAI Provider

1. Keep existing OpenAI configuration
2. Add enterprise_openai provider to `generator.json`
3. Set `default_provider: "enterprise_openai"`
4. Configure environment variables
5. Test with a small repository

### From Existing Embedding Provider

1. Keep existing embedder configuration
2. Add `embedder_enterprise_bge` to `embedder.json`
3. Set `DEEPWIKI_EMBEDDER_TYPE=enterprise_bge`
4. Configure BGE environment variables
5. Note: BGE-M3 uses 1024 dimensions (may need to rebuild embeddings)

## Troubleshooting

### Authentication Errors
- Verify `ENTERPRISE_OPENAI_TOKEN` and `ENTERPRISE_BGE_TOKEN` are set
- Check token validity and permissions
- Ensure `x-dep-ticket` header is supported by your API

### Connection Errors
- Verify `ENTERPRISE_OPENAI_BASE_URL` and `ENTERPRISE_BGE_BASE_URL`
- Check network connectivity to enterprise APIs
- Verify firewall rules allow outbound HTTPS

### Rate Limiting
- Adjust batch sizes if hitting rate limits
- Monitor retry logs for 429 responses
- Consider implementing rate limiting on client side

### Embedding Dimension Mismatch
- BGE-M3 produces 1024-dimensional embeddings
- Ensure vector database is configured for 1024 dimensions
- Rebuild embeddings if migrating from different dimension

## Performance Tuning

### LLM Generation
- Adjust `temperature` (0.7 default) for creativity vs. consistency
- Modify `top_p` (0.8 default) for nucleus sampling
- Set `max_tokens` to limit response length

### Embedding Batch Size
- Default: 100 texts per batch
- Increase for better throughput (if API supports)
- Decrease if hitting payload size limits

### Timeout Values
- LLM: 30s default (increase for long generations)
- Embeddings: 60s default (increase for large batches)

## Security Considerations

1. **Credential Management**
   - Store tokens in secure environment variable management
   - Never commit tokens to version control
   - Rotate tokens regularly

2. **Network Security**
   - Use HTTPS for all API communication
   - Verify SSL certificates
   - Use VPN if required by enterprise policy

3. **Data Privacy**
   - Ensure code sent to APIs complies with data policies
   - Consider data residency requirements
   - Audit API usage logs

## Support

For issues or questions:
1. Check logs for detailed error messages
2. Verify configuration against this guide
3. Test with example configurations in `config_examples/`
4. Contact your enterprise API administrator for API-specific issues

## Future Enhancements

Potential improvements:
- Streaming support for LLM responses
- Caching layer for embeddings
- Multi-model fallback strategies
- Enhanced telemetry and monitoring
- Custom retry policies per endpoint
