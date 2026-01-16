# Enterprise API Integration - Implementation Summary

## Overview

This implementation adds enterprise-grade API integration to DeepWiki-Open, enabling the use of internal enterprise APIs for both LLM-based documentation generation and embedding generation.

## Implementation Date

January 2026

## New Providers

### 1. Enterprise OpenAI Provider (`enterprise_openai`)
- **Model**: gpt-oss-130b
- **Client**: `EnterpriseOpenAIClient`
- **Protocol**: OpenAI-compatible Chat Completions API
- **Authentication**: Custom `x-dep-ticket` header
- **Endpoint**: `/{model}/v1/chat/completions`

### 2. Enterprise BGE Embedder (`enterprise_bge`)
- **Model**: BGE-M3
- **Client**: `EnterpriseBGEEmbedderClient`
- **Embedding Dimension**: 1024
- **Authentication**: Custom `x-dep-ticket` header
- **Endpoint**: `/v1/embeddings`
- **Batch Size**: 100 (configurable)

## Files Added

### Client Implementation
1. **`api/enterprise_openai_client.py`** (441 lines)
   - Enterprise LLM client for gpt-oss-130b
   - OpenAI Chat Completions compatible
   - Retry logic with exponential backoff
   - Custom authentication support
   - Timeout handling (30s default)

2. **`api/enterprise_bge_embedder_client.py`** (378 lines)
   - Enterprise embedding client for BGE-M3
   - Batch processing support
   - Partial failure recovery
   - 1024-dimensional embeddings
   - Timeout handling (60s default)

### Documentation
3. **`ENTERPRISE_INTEGRATION.md`** (Comprehensive guide)
   - Architecture overview
   - Configuration instructions
   - API requirements and specifications
   - Reliability features documentation
   - Troubleshooting guide
   - Migration guide

4. **`IMPLEMENTATION_SUMMARY.md`** (This file)
   - Complete change log
   - File listing
   - Request flow diagram

### Configuration Examples
5. **`config_examples/enterprise_generator.json`**
   - Example generator configuration

6. **`config_examples/enterprise_embedder.json`**
   - Example embedder configuration

7. **`config_examples/enterprise_env_example.sh`**
   - Example environment variables

## Files Modified

### Core Configuration
1. **`api/config.py`**
   - Added imports for `EnterpriseOpenAIClient` and `EnterpriseBGEEmbedderClient`
   - Updated `CLIENT_CLASSES` dictionary with new providers
   - Enhanced `load_generator_config()` to support `enterprise_openai`
   - Enhanced `load_embedder_config()` to support `embedder_enterprise_bge`
   - Updated `get_embedder_config()` to handle enterprise BGE type
   - Added `is_enterprise_bge_embedder()` helper function
   - Updated `get_embedder_type()` to return `'enterprise_bge'`

2. **`api/config/generator.json`**
   - Added `enterprise_openai` provider configuration
   - Model: gpt-oss-130b with temperature=0.7, top_p=0.8

3. **`api/config/embedder.json`**
   - Added `embedder_enterprise_bge` configuration
   - Model: bge-m3 with batch_size=100

4. **`api/tools/embedder.py`**
   - Updated `get_embedder()` function to support `enterprise_bge` type
   - Added enterprise_bge handling in both direct specification and auto-detect logic

5. **`api/pyproject.toml`**
   - Added `httpx >= 0.24.0` dependency for HTTP client functionality

## Architecture Integration

### Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DeepWiki Code Analysis                      │
│                  (Extract code, structure, APIs)                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Planning Agent (LLM)                         │
│          Decides wiki structure, page organization               │
│                (Uses enterprise_openai if configured)            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Enterprise BGE Embedder (BGE-M3)                    │
│          - Batch processing (100 texts/batch)                    │
│          - 1024-dimensional vectors                              │
│          - Partial failure recovery                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vector Database (FAISS)                       │
│               Store and index code embeddings                    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RAG Retrieval System                        │
│          Find relevant code sections for each wiki page          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│            Enterprise LLM Generator (gpt-oss-130b)               │
│          - Generate documentation page by page                   │
│          - Use retrieved code context                            │
│          - Retry logic with exponential backoff                  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Wiki Pages                             │
│              Published documentation output                      │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features Implemented

### Reliability
- **Exponential Backoff**: 2s → 4s → 8s → 16s on retry
- **Retry Logic**: Automatic retry on HTTP 429 and 5xx errors
- **Timeout Handling**: Configurable timeouts (30s LLM, 60s embeddings)
- **Partial Failure Recovery**: Embedder retries individual texts on batch failure

### Security
- **Custom Authentication**: `x-dep-ticket` header support
- **Environment Variables**: No hardcoded credentials
- **HTTPS Only**: Secure communication enforced

### Performance
- **Batch Processing**: Up to 100 texts per embedding request
- **Configurable Batch Size**: Adjust based on API limits
- **Efficient Retries**: Only retry failed requests, not successful ones

### Maintainability
- **Provider Abstraction**: Follows existing DeepWiki patterns
- **Backward Compatibility**: All existing providers remain functional
- **Comprehensive Documentation**: Integration guide, examples, troubleshooting

## Environment Variables Required

```bash
# LLM Provider
ENTERPRISE_OPENAI_BASE_URL=https://your-enterprise-api.company.com
ENTERPRISE_OPENAI_TOKEN=your-enterprise-auth-token

# Embedding Provider
ENTERPRISE_BGE_BASE_URL=https://your-embedding-api.company.com
ENTERPRISE_BGE_TOKEN=your-embedding-auth-token

# Embedder Type Selection
DEEPWIKI_EMBEDDER_TYPE=enterprise_bge  # or openai, ollama, google, bedrock
```

## Configuration Changes Required

### To Use Enterprise LLM
Set in `api/config/generator.json`:
```json
{
  "default_provider": "enterprise_openai"
}
```

### To Use Enterprise Embeddings
Set environment variable:
```bash
export DEEPWIKI_EMBEDDER_TYPE=enterprise_bge
```

## Testing Recommendations

1. **Unit Tests**
   - Test `EnterpriseOpenAIClient` with mock HTTP responses
   - Test `EnterpriseBGEEmbedderClient` with mock embedding API
   - Test retry logic under various failure scenarios
   - Test batch processing and partial failure recovery

2. **Integration Tests**
   - Test with actual enterprise APIs (in staging environment)
   - Verify authentication flow
   - Test embedding dimension (1024)
   - Verify end-to-end wiki generation

3. **Performance Tests**
   - Benchmark batch embedding performance
   - Test under rate limiting conditions
   - Verify timeout handling
   - Test with large repositories (1000+ files)

## Migration Considerations

### Embedding Dimension Change
- Previous embeddings may have different dimensions
- BGE-M3 uses 1024 dimensions (OpenAI text-embedding-3-small uses 256-1536)
- **Action Required**: Rebuild embeddings when switching to enterprise_bge

### API Compatibility
- Enterprise API must be OpenAI Chat Completions compatible
- Embedding API must return list of 1024-dimensional vectors
- Authentication via `x-dep-ticket` header must be supported

## Code Statistics

- **Total Lines Added**: ~1,200
- **New Python Files**: 2
- **Modified Python Files**: 3
- **New Config Files**: 3
- **Documentation Files**: 2
- **Dependencies Added**: 1 (httpx)

## Backward Compatibility

✅ **Fully Backward Compatible**
- All existing providers (OpenAI, Google, Ollama, Azure, Bedrock, DashScope) remain functional
- No breaking changes to existing APIs
- New providers are opt-in via configuration
- Default behavior unchanged if environment variables not set

## Next Steps (Optional Enhancements)

1. **Streaming Support**: Add streaming for LLM responses
2. **Caching Layer**: Cache embeddings to reduce API calls
3. **Multi-Model Fallback**: Auto-switch providers on failure
4. **Telemetry**: Add detailed metrics and monitoring
5. **Custom Retry Policies**: Per-endpoint retry configuration
6. **Connection Pooling**: Optimize HTTP client for high throughput

## Verification Checklist

- [x] Enterprise LLM client implemented
- [x] Enterprise BGE embedder client implemented
- [x] Configuration files updated
- [x] Provider registration complete
- [x] Helper functions added
- [x] Documentation written
- [x] Example configurations provided
- [x] Dependencies added to pyproject.toml
- [x] Backward compatibility maintained
- [x] Error handling implemented
- [x] Retry logic with exponential backoff
- [x] Timeout handling
- [x] Batch processing support
- [x] Partial failure recovery

## Success Criteria Met

✅ **Architecture Preserved**: No changes to core DeepWiki pipeline
✅ **Provider Abstraction**: Follows existing patterns
✅ **No Hardcoded Credentials**: All config via environment variables
✅ **Reliability Features**: Retry, timeout, partial failure handling
✅ **Production Ready**: Comprehensive error handling and logging
✅ **Well Documented**: Full integration guide with examples
✅ **Configurable**: All behavior controlled via config files

## Contact

For questions or issues related to this implementation, refer to:
- `ENTERPRISE_INTEGRATION.md` - Complete integration guide
- `config_examples/` - Working configuration examples
- Repository maintainers for enterprise API access
