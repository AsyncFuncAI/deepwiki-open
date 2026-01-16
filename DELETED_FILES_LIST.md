# Files to Delete (Optional)

The following files are **unused** in the single-provider architecture and can be safely deleted if you want to fully clean up the repository.

**Note**: These files are currently retained for reference. The new `deepwiki_single.py` does NOT use them.

## Multi-Provider Infrastructure (No Longer Needed)

### Configuration System
```
api/config.py                      # Multi-provider config loader
api/config/generator.json          # Multi-provider LLM settings
api/config/embedder.json           # Multi-provider embedding settings
api/config/repo.json               # Repository filters
api/config/lang.json               # Language settings
```

### Old Provider Clients
```
api/openai_client.py               # OpenAI provider
api/google_embedder_client.py     # Google embedder
api/ollama_client.py               # Ollama local models
api/ollama_patch.py                # Ollama patches
api/azureai_client.py              # Azure OpenAI
api/bedrock_client.py              # AWS Bedrock
api/dashscope_client.py            # Alibaba DashScope
api/openrouter_client.py           # OpenRouter
```

### Previously Added Enterprise Clients (Now Superseded)
```
api/enterprise_openai_client.py         # Superseded by api/llm/gpt_oss_client.py
api/enterprise_bge_embedder_client.py   # Superseded by api/embedding/bge_m3_client.py
ENTERPRISE_INTEGRATION.md               # Documentation for old enterprise integration
IMPLEMENTATION_SUMMARY.md               # Old implementation summary
config_examples/enterprise_*.json       # Old enterprise configs
config_examples/enterprise_env_example.sh
```

### Complex Pipeline (Replaced)
```
api/data_pipeline.py               # Complex data pipeline
api/rag.py                         # Complex RAG system
api/tools/                         # Tool system directory
api/tools/embedder.py              # Multi-provider embedder helper
```

### Web Infrastructure (Not Used)
```
app.py                             # FastAPI web server
main.py                            # Old entry point
web/                               # Web UI (if exists)
```

### Unused Dependencies
```
api/pyproject.toml                 # Old complex dependencies
```

## Files to Keep

### New Single-Provider Architecture
```
api/llm/gpt_oss_client.py          ✅ Keep - Core LLM client
api/embedding/bge_m3_client.py     ✅ Keep - Core embedder
api/pipeline/ingest.py             ✅ Keep - Repository ingestion
api/pipeline/chunk.py              ✅ Keep - Text chunking
api/pipeline/plan.py               ✅ Keep - Wiki planning
api/pipeline/generate.py           ✅ Keep - Page generation
api/wiki/writer.py                 ✅ Keep - Wiki writer
deepwiki_single.py                 ✅ Keep - Main entry point
```

### Documentation
```
README_SINGLE_PROVIDER.md          ✅ Keep - Usage guide
SINGLE_PROVIDER_MIGRATION.md       ✅ Keep - Migration summary
requirements_single.txt            ✅ Keep - Dependencies
```

### Original Repository Files
```
README.md                          ✅ Keep - Original README
LICENSE                            ✅ Keep - License
.gitignore                         ✅ Keep - Git ignore
```

## Cleanup Command (Optional)

If you want to remove all unused files:

```bash
# ⚠️ WARNING: This will permanently delete files!
# Make a backup first: git branch backup-before-cleanup

# Remove old config
rm -rf api/config/

# Remove old clients
rm -f api/openai_client.py
rm -f api/google_embedder_client.py
rm -f api/ollama_client.py
rm -f api/ollama_patch.py
rm -f api/azureai_client.py
rm -f api/bedrock_client.py
rm -f api/dashscope_client.py
rm -f api/openrouter_client.py
rm -f api/enterprise_openai_client.py
rm -f api/enterprise_bge_embedder_client.py

# Remove old pipeline
rm -f api/config.py
rm -f api/data_pipeline.py
rm -f api/rag.py
rm -rf api/tools/

# Remove old docs
rm -f ENTERPRISE_INTEGRATION.md
rm -f IMPLEMENTATION_SUMMARY.md
rm -rf config_examples/

# Remove web infrastructure (if exists)
rm -f app.py
rm -f main.py

# Remove old pyproject
rm -f api/pyproject.toml

# Commit cleanup
git add -A
git commit -m "chore: Remove unused multi-provider files"
git push
```

## Why Keep Old Files Initially?

1. **Reference**: Useful for understanding original architecture
2. **Backup**: Easy to revert if needed
3. **Gradual transition**: Teams can reference old code during migration
4. **Documentation**: Examples of what was changed

## When to Delete?

Delete when:
- ✅ New single-provider architecture is fully tested
- ✅ All users have migrated to `deepwiki_single.py`
- ✅ No need to reference old code
- ✅ Repository cleanup is desired

## Impact of Deletion

Deleting these files will:
- ✅ Reduce repository size by ~70%
- ✅ Eliminate confusion about which files to use
- ✅ Make codebase more maintainable
- ❌ Make it harder to reference old architecture
- ❌ Lose git history context (though still in history)

## Recommendation

**Keep old files for 1-2 months** while the new architecture is being validated.
Then, once confident, perform the cleanup.
