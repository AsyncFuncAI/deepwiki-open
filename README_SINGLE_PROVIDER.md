

# DeepWiki Single Provider

**Simplified GitHub Wiki Generator using gpt-oss-130b + BGE-M3**

This is a radically simplified version of DeepWiki-Open, redesigned as a **single-provider wiki generation pipeline** for internal enterprise use.

---

## 🎯 Design Philosophy

### What This Is
- **Single-purpose tool**: GitHub Repository → GitHub Wiki
- **Single LLM**: gpt-oss-130b (internal OpenAI-compatible API)
- **Single embedder**: BGE-M3 (internal embedding API)
- **No abstractions**: No provider registry, no multi-model support, no fallbacks

### What This Is NOT
- ❌ Multi-provider LLM platform
- ❌ General-purpose code analysis tool
- ❌ Autonomous agent system
- ❌ Configurable documentation framework

---

## 📁 Architecture

### Pipeline Flow

```
Repository URL
      ↓
[1. Ingest] Clone & load files
      ↓
[2. Chunk] Split into overlapping chunks
      ↓
[3. Plan] LLM plans wiki structure
      ↓
[4. Embed] BGE-M3 computes embeddings
      ↓
[5. Generate] Page-by-page generation with RAG
      ↓
[6. Write] Output markdown files
      ↓
GitHub Wiki
```

### Directory Structure

```
api/
├── llm/
│   └── gpt_oss_client.py         # ONLY LLM client
├── embedding/
│   └── bge_m3_client.py          # ONLY embedding client
├── pipeline/
│   ├── ingest.py                 # Repository ingestion
│   ├── chunk.py                  # Text chunking
│   ├── plan.py                   # Wiki structure planning
│   └── generate.py               # Page generation with RAG
└── wiki/
    └── writer.py                 # Wiki file writer

deepwiki_single.py                # Main entry point
```

---

## 🚀 Quick Start

### Prerequisites

1. **Python 3.11+**
2. **Enterprise API access**:
   - gpt-oss-130b endpoint
   - BGE-M3 embedding endpoint

### Environment Setup

```bash
# LLM API
export DEEPWIKI_LLM_BASE_URL="https://your-llm-api.company.com"
export DEEPWIKI_LLM_TOKEN="your-llm-token"

# Embedding API
export DEEPWIKI_EMBEDDING_BASE_URL="https://your-embedding-api.company.com"
export DEEPWIKI_EMBEDDING_TOKEN="your-embedding-token"
```

### Installation

```bash
# Install dependencies
cd api
poetry install

# Or with pip
pip install httpx numpy
```

### Run

```bash
python deepwiki_single.py \
  --repo https://github.com/your-org/your-repo \
  --output ./wiki_output \
  --token YOUR_GITHUB_TOKEN
```

### Dry Run (Test without writing)

```bash
python deepwiki_single.py \
  --repo https://github.com/your-org/your-repo \
  --dry-run \
  --debug
```

---

## 📋 Command-Line Options

| Option | Required | Description |
|--------|----------|-------------|
| `--repo` | ✅ | GitHub repository URL |
| `--output` | | Output directory (default: `./wiki_output`) |
| `--token` | | GitHub access token for private repos |
| `--workspace` | | Workspace for cloning (default: `./workspace`) |
| `--dry-run` | | Test mode - don't write files |
| `--debug` | | Enable debug logging |

---

## 🔧 Configuration

### LLM Client (gpt-oss-130b)

**File**: `api/llm/gpt_oss_client.py`

```python
client = GPTOSSClient(
    base_url="https://api.company.com",
    token="your-token",
    timeout=30.0,
    max_retries=3,
)
```

**API Format**:
- Endpoint: `/{model}/v1/chat/completions`
- Method: POST
- Auth: `x-dep-ticket` header
- Body: OpenAI Chat Completions compatible

### Embedding Client (BGE-M3)

**File**: `api/embedding/bge_m3_client.py`

```python
client = BGEM3Client(
    base_url="https://embed.company.com",
    token="your-token",
    batch_size=100,
    timeout=60.0,
)
```

**API Format**:
- Endpoint: `/v1/embeddings`
- Dimension: **1024**
- Batch support: Yes

---

## 🏗️ Pipeline Components

### 1. Ingester (`api/pipeline/ingest.py`)

**Purpose**: Clone repository and load source files

**Features**:
- Git clone with shallow clone
- Simple file filtering (exclude binaries, build artifacts)
- No complex analysis

**Usage**:
```python
ingester = RepositoryIngester()
repo_path = ingester.clone_repo(url, token)
files = ingester.load_files(repo_path)
```

### 2. Chunker (`api/pipeline/chunk.py`)

**Purpose**: Split files into overlapping chunks

**Features**:
- Word-based splitting (token approximation)
- Configurable chunk size and overlap
- Preserves file metadata

**Usage**:
```python
chunker = TextChunker(chunk_size=500, overlap=100)
chunks = chunker.chunk_files(files)
```

### 3. Planner (`api/pipeline/plan.py`)

**Purpose**: Plan wiki page structure using LLM

**Constraints**:
- ❌ Does NOT generate content
- ❌ Does NOT summarize code
- ❌ Does NOT explore autonomously
- ✅ ONLY analyzes structure and creates page layout

**Output Example**:
```json
[
  {
    "page": "Home",
    "files": ["README.md"],
    "description": "Project overview"
  },
  {
    "page": "Architecture",
    "files": ["src/**/*.py"],
    "description": "System design"
  }
]
```

### 4. Generator (`api/pipeline/generate.py`)

**Purpose**: Generate wiki pages with RAG

**Features**:
- **Page-by-page generation** (not batch)
- **RAG-based context**: Relevant chunks + matched files
- **Token budget**: Max 6000 tokens context
- **Graceful failure**: Page errors don't crash entire pipeline

**Usage**:
```python
generator = PageGenerator(llm, embedder)
generator.prepare_embeddings(chunks)
content = generator.generate_page(plan, files)
```

### 5. Writer (`api/wiki/writer.py`)

**Purpose**: Write markdown files

**Features**:
- Individual .md files per page
- Auto-generated `_Sidebar.md`
- Dry-run mode support

**Usage**:
```python
writer = WikiWriter(output_dir='./wiki', dry_run=False)
writer.write_wiki(pages)
```

---

## ⚠️ Error Handling

### LLM Timeouts
- **Behavior**: Retry with exponential backoff
- **Max retries**: 3
- **Fallback**: Page generation fails, but pipeline continues

### Embedding Failures
- **Batch failure**: Retry individual texts
- **Individual failure**: Insert zero vector as fallback
- **Pipeline**: Continues with available embeddings

### Wiki Write Failures
- **Page write failure**: Skip page, continue with others
- **Sidebar failure**: Non-critical, pipeline succeeds

---

## 📊 Output Format

### Directory Structure
```
wiki_output/
├── Home.md
├── Architecture.md
├── API-Reference.md
├── Configuration.md
└── _Sidebar.md
```

### Sidebar Navigation
```markdown
# Wiki Navigation

* [Home](Home)
* [Architecture](Architecture)
* [API Reference](API-Reference)
* [Configuration](Configuration)
```

---

## 🔒 Security

### Credentials
- **Never hardcoded**: All tokens from environment variables
- **Token sanitization**: Errors don't leak tokens in logs
- **HTTPS only**: All API calls use HTTPS

### Repository Access
- Supports GitHub access tokens for private repos
- Tokens passed via CLI or environment
- Shallow clone only (no full history)

---

## 📈 Performance

### Typical Repository (1000 files)
- **Ingestion**: 5-10 seconds
- **Chunking**: 2-5 seconds
- **Embedding**: 30-60 seconds (depends on API)
- **Planning**: 5-10 seconds
- **Generation**: 2-5 minutes (5-7 pages)
- **Total**: ~3-6 minutes

### Bottlenecks
1. Embedding computation (largest time sink)
2. LLM page generation (per-page latency)
3. Repository cloning (for large repos)

### Optimization Tips
- Use `--workspace` to reuse cloned repos
- Increase batch size for faster embedding
- Reduce chunk overlap to decrease embedding count

---

## 🚫 What Was Removed

This is **NOT** the full DeepWiki-Open. The following were removed:

### Removed Features
- ❌ Multi-provider support (Google, OpenAI, Ollama, Azure, etc.)
- ❌ Provider registry and factory pattern
- ❌ Complex configuration system
- ❌ Fallback mechanisms
- ❌ Agent autonomy and exploration
- ❌ Web UI and API server
- ❌ User authentication
- ❌ Multiple language support
- ❌ Streaming responses
- ❌ Custom prompt templates

### Removed Files
- `api/config.py` (multi-provider config)
- `api/openai_client.py`, `api/google_client.py`, etc.
- `api/tools/` (complex tool system)
- `api/rag.py` (complex RAG system)
- Web UI files
- API server files

### Why?
This version is purpose-built for **internal wiki generation** only.
Multi-provider complexity is unnecessary overhead for this use case.

---

## 🧪 Testing

### Unit Tests (TODO)
```bash
pytest api/tests/
```

### Integration Test
```bash
# Test with a public repo
python deepwiki_single.py \
  --repo https://github.com/anthropics/anthropic-sdk-python \
  --output ./test_wiki \
  --dry-run \
  --debug
```

### Validation
1. Check page count matches plan
2. Verify sidebar links
3. Inspect page content quality
4. Test with private repo (requires token)

---

## 🐛 Troubleshooting

### "DEEPWIKI_LLM_BASE_URL must be set"
**Solution**: Export environment variables before running
```bash
export DEEPWIKI_LLM_BASE_URL="https://your-api.company.com"
export DEEPWIKI_LLM_TOKEN="your-token"
```

### "HTTP 401 Unauthorized"
**Solution**: Check API token validity and permissions

### "Embedding dimension mismatch"
**Solution**: Ensure BGE-M3 API returns 1024-dimensional vectors

### "Page generation timeout"
**Solution**:
- Increase timeout in `GPTOSSClient(timeout=60)`
- Reduce `max_context_tokens` in `PageGenerator`

### "No files matched for page"
**Solution**: Check glob patterns in plan. Use `--debug` to see matched files.

---

## 📝 Example Run

```bash
$ export DEEPWIKI_LLM_BASE_URL="https://llm.company.com"
$ export DEEPWIKI_LLM_TOKEN="..."
$ export DEEPWIKI_EMBEDDING_BASE_URL="https://embed.company.com"
$ export DEEPWIKI_EMBEDDING_TOKEN="..."

$ python deepwiki_single.py --repo https://github.com/anthropics/anthropic-sdk-python --output ./wiki

============================================================
DeepWiki Single Provider
============================================================
Repository: https://github.com/anthropics/anthropic-sdk-python
Output: ./wiki
Dry Run: False

[1/7] Initializing clients...
✓ Clients initialized

[2/7] Ingesting repository...
✓ Loaded 245 files

[3/7] Chunking files...
✓ Created 1,247 chunks

[4/7] Planning wiki structure...
✓ Planned 5 pages
  - Home: Project overview and getting started
  - Architecture: System architecture and design
  - API Reference: API endpoints and interfaces
  - Examples: Code examples and usage
  - Configuration: Configuration options

[5/7] Computing embeddings...
✓ Embeddings computed

[6/7] Generating wiki pages...
  [1/5] Generating Home...
  [2/5] Generating Architecture...
  [3/5] Generating API Reference...
  [4/5] Generating Examples...
  [5/5] Generating Configuration...
✓ All pages generated

[7/7] Writing wiki files...
✓ Wiki written

============================================================
SUCCESS
============================================================
Wiki: 6 pages, 45,234 bytes in ./wiki
```

---

## 🔮 Future Enhancements (Optional)

Potential improvements (not implemented):
- Incremental updates (only regenerate changed pages)
- Caching layer for embeddings
- Custom page templates
- Multi-language output
- Diagram generation
- API documentation parsing
- Test coverage reports

---

## 📞 Support

For issues or questions:
1. Check this README
2. Enable `--debug` mode
3. Review logs for specific errors
4. Contact repository maintainers

---

## 📄 License

MIT License (inherited from DeepWiki-Open)

---

## 🙏 Credits

Based on [DeepWiki-Open](https://github.com/deepwiki-io/deepwiki-open)

Simplified for single-provider enterprise use.
