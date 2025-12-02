# Local Repository Support Plan - DeepWiki

**Date**: 2025-11-11
**Project**: DeepWiki - AI-powered documentation generator
**Repository**: `/Users/ehfaz.rezwan/Projects/deepwiki-open`
**Objective**: Verify and enhance support for local repository ingestion

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Implementation Status](#current-implementation-status)
3. [Architecture Analysis](#architecture-analysis)
4. [Potential Gaps & Risks](#potential-gaps--risks)
5. [Testing Strategy](#testing-strategy)
6. [Implementation Plan](#implementation-plan)
7. [Success Criteria](#success-criteria)
8. [Reference Documentation](#reference-documentation)

---

## Executive Summary

### Problem Statement

Users within organizations with strict security policies may need to process repositories that:
- Cannot be cloned via standard Git protocols due to org-level restrictions
- Are already available on the local filesystem
- Require processing without external network access
- Need to be analyzed without exposing credentials to external services

### Discovery

Through comprehensive codebase analysis, we discovered that **DeepWiki already has extensive infrastructure for local repository support**. The system was designed to handle both remote URLs and local filesystem paths from the beginning.

### Current Status

- **Backend Support**: ✅ **COMPLETE** - Full path handling in data pipeline
- **Frontend Support**: ✅ **MOSTLY COMPLETE** - Path parsing and UI integration
- **WebSocket Integration**: ⚠️ **NEEDS VERIFICATION** - May require minor adjustments
- **Testing**: ⚠️ **INCOMPLETE** - Limited test coverage for local paths

### Recommendation

**Proceed with Phase 1 (Verification & Testing)** before making any code changes. The infrastructure is solid, but real-world testing is needed to identify edge cases.

---

## Current Implementation Status

### 1. Data Models (COMPLETE ✅)

**File**: `api/api.py`

```python
class RepoInfo(BaseModel):
    owner: str
    repo: str
    type: str
    token: Optional[str] = None
    localPath: Optional[str] = None  # ✅ Already exists!
    repoUrl: Optional[str] = None
```

**Analysis**: The `RepoInfo` model already includes `localPath` field, indicating intentional design for local repository support.

### 2. Backend Data Pipeline (COMPLETE ✅)

**File**: `api/data_pipeline.py`

#### Key Functions:

**`DatabaseManager._create_repo()`** (Lines 768-817)
```python
def _create_repo(self, repo_url_or_path: str, repo_type: str = None, access_token: str = None) -> None:
    """
    Download and prepare all paths.
    Paths:
    ~/.adalflow/repos/{owner}_{repo_name} (for url, local path will be the same)
    ~/.adalflow/databases/{owner}_{repo_name}.pkl
    """
    # ...
    if repo_url_or_path.startswith("https://") or repo_url_or_path.startswith("http://"):
        # Extract the repository name from the URL
        repo_name = self._extract_repo_name_from_url(repo_url_or_path, repo_type)
        save_repo_dir = os.path.join(root_path, "repos", repo_name)

        # Download if needed
        if not (os.path.exists(save_repo_dir) and os.listdir(save_repo_dir)):
            download_repo(repo_url_or_path, save_repo_dir, repo_type, access_token)
        else:
            logger.info(f"Repository already exists at {save_repo_dir}. Using existing repository.")
    else:  # ✅ Local path handling
        repo_name = os.path.basename(repo_url_or_path)
        save_repo_dir = repo_url_or_path  # Use path directly!
```

**Analysis**:
- Local paths are explicitly handled
- No cloning occurs for local paths
- Repository name extracted from path basename
- Database cache path generated consistently

**`DatabaseManager.prepare_database()`** (Lines 713-743)
- Accepts `repo_url_or_path` parameter (not just URL)
- Calls `_create_repo()` which handles both cases
- Returns list of documents from local filesystem

**`read_all_documents()`** (Lines 144-371)
- Generic path-based function
- Works with any accessible filesystem path
- Respects file filters (included/excluded dirs/files)

### 3. RAG Integration (COMPLETE ✅)

**File**: `api/rag.py`

```python
class RAG(adal.Component):
    """RAG with one repo.
    If you want to load a new repos, call prepare_retriever(repo_url_or_path) first."""

    def prepare_retriever(self, repo_url_or_path: str, type: str = "github",
                          access_token: str = None, ...):
        """
        Prepare retriever for a repository.
        Will load database from local storage if available.

        Args:
            repo_url_or_path: URL or local path to the repository  # ✅ Supports both!
        """
        self.initialize_db_manager()
        self.repo_url_or_path = repo_url_or_path
        self.transformed_docs = self.db_manager.prepare_database(
            repo_url_or_path,  # ✅ Passes through
            type,
            access_token,
            ...
        )
```

**Analysis**: RAG pipeline fully supports local paths via `repo_url_or_path` parameter.

### 4. Local Repository Structure API (COMPLETE ✅)

**File**: `api/api.py` (Lines 275-320)

```python
@app.get("/local_repo/structure")
async def get_local_repo_structure(path: str = Query(None, description="Path to local repository")):
    """Return the file tree and README content for a local repository."""
    if not path:
        return JSONResponse(status_code=400, content={"error": "No path provided"})

    if not os.path.isdir(path):
        return JSONResponse(status_code=404, content={"error": f"Directory not found: {path}"})

    try:
        file_tree_lines = []
        readme_content = ""

        for root, dirs, files in os.walk(path):
            # Exclude hidden dirs/files and virtual envs
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__'
                       and d != 'node_modules' and d != '.venv']
            for file in files:
                if file.startswith('.') or file == '__init__.py' or file == '.DS_Store':
                    continue
                rel_dir = os.path.relpath(root, path)
                rel_file = os.path.join(rel_dir, file) if rel_dir != '.' else file
                file_tree_lines.append(rel_file)
                # Find README.md
                if file.lower() == 'readme.md' and not readme_content:
                    with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                        readme_content = f.read()

        file_tree_str = '\n'.join(sorted(file_tree_lines))
        return {"file_tree": file_tree_str, "readme": readme_content}
```

**Analysis**:
- Dedicated endpoint for local repository inspection
- Returns file tree and README for wiki structure generation
- Handles error cases (missing path, invalid directory)

### 5. Frontend Path Parsing (COMPLETE ✅)

**File**: `src/app/page.tsx` (Lines 177-246)

```typescript
const parseRepositoryInput = (input: string): {
    owner: string,
    repo: string,
    type: string,
    fullPath?: string,
    localPath?: string
} | null => {
    input = input.trim();

    let owner = '', repo = '', type = 'github', fullPath;
    let localPath: string | undefined;

    // Handle Windows absolute paths (e.g., C:\path\to\folder)
    const windowsPathRegex = /^[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/;
    const customGitRegex = /^(?:https?:\/\/)?([^\/]+)\/(.+?)\/([^\/]+)(?:\.git)?\/?$/;

    if (windowsPathRegex.test(input)) {
        type = 'local';
        localPath = input;
        repo = input.split('\\').pop() || 'local-repo';
        owner = 'local';
    }
    // Handle Unix/Linux absolute paths (e.g., /path/to/folder)
    else if (input.startsWith('/')) {
        type = 'local';
        localPath = input;
        repo = input.split('/').filter(Boolean).pop() || 'local-repo';
        owner = 'local';
    }
    // ... handle Git URLs ...

    return { owner, repo, type, fullPath, localPath };
};
```

**Analysis**:
- Robust path detection for both Windows and Unix paths
- Sets `type: 'local'` automatically
- Extracts repository name from path
- Returns `localPath` for downstream processing

### 6. Frontend Navigation (COMPLETE ✅)

**File**: `src/app/page.tsx` (Lines 344-388)

```typescript
const handleSubmit = async () => {
    // ...
    const { owner, repo, type, localPath } = parsedRepo;

    const params = new URLSearchParams();
    // Always include the type parameter
    params.append('type', (type == 'local' ? type : selectedPlatform) || 'github');

    // Add local path if it exists
    if (localPath) {
        params.append('local_path', encodeURIComponent(localPath));  // ✅ Passes local path
    } else {
        params.append('repo_url', encodeURIComponent(repositoryInput));
    }

    // Navigate to the dynamic route
    router.push(`/${owner}/${repo}${queryString}`);
};
```

**Analysis**:
- Properly encodes local path for URL
- Distinguishes between `local_path` and `repo_url` parameters
- Type parameter set to 'local'

### 7. Wiki Page Integration (COMPLETE ✅)

**File**: `src/app/[owner]/[repo]/page.tsx` (Lines 183-223)

```typescript
// Extract tokens from search params
const localPath = searchParams.get('local_path')
    ? decodeURIComponent(searchParams.get('local_path') || '')
    : undefined;
const repoUrl = searchParams.get('repo_url')
    ? decodeURIComponent(searchParams.get('repo_url') || '')
    : undefined;

// Build RepoInfo
const repoInfo = useMemo<RepoInfo>(() => ({
    owner,
    repo,
    type: repoType,
    token: token || null,
    localPath: localPath || null,  // ✅ Passed through
    repoUrl: repoUrl || null
}), [owner, repo, repoType, localPath, repoUrl, token]);
```

**File**: `src/app/[owner]/[repo]/page.tsx` (Lines 1193-1209)

```typescript
// Fetch file tree
if (effectiveRepoInfo.type === 'local' && effectiveRepoInfo.localPath) {
    try {
        const response = await fetch(
            `/local_repo/structure?path=${encodeURIComponent(effectiveRepoInfo.localPath)}`
        );

        if (!response.ok) {
            throw new Error(`Local repository API error (${response.status})`);
        }

        const data = await response.json();
        fileTreeData = data.file_tree;
        readmeContent = data.readme;
        setDefaultBranch('main');  // Default for local repos
    } catch (err) {
        throw err;
    }
}
```

**Analysis**:
- Wiki page extracts `local_path` from query params
- Creates `RepoInfo` with local path
- Uses `/local_repo/structure` API for local repos
- Handles errors appropriately

### 8. Utility Functions (COMPLETE ✅)

**File**: `src/utils/getRepoUrl.tsx`

```typescript
export default function getRepoUrl(repoInfo: RepoInfo): string {
    if (repoInfo.type === 'local' && repoInfo.localPath) {
        return repoInfo.localPath;  // ✅ Returns local path
    } else {
        if(repoInfo.repoUrl) {
            return repoInfo.repoUrl;
        }
        // ... construct URL from owner/repo
    }
}
```

**Analysis**: Utility correctly handles local paths by returning the path itself.

### 9. Test Coverage (PARTIAL ⚠️)

**File**: `test/test_extract_repo_name.py` (Lines 70-98)

```python
def test_extract_repo_name_local_paths(self):
    """Test repository name extraction from local paths"""
    result = self.db_manager._extract_repo_name_from_url("/home/user/projects/my-repo", "local")
    assert result == "my-repo"

    # Test absolute local path
    local_path = "/home/user/projects/my-repo"
    result = self.db_manager._extract_repo_name_from_url(local_path, "local")
    assert result == "my-repo"

    # Test local path with .git suffix
    result = self.db_manager._extract_repo_name_from_url("/home/user/my-repo.git", "local")
    assert result == "my-repo"
```

**Analysis**: Basic test coverage exists but incomplete.

---

## Architecture Analysis

### Data Flow: Local Repository Processing

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INPUT                               │
│  "/Users/ehfaz.rezwan/Projects/my-restricted-repo"              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (page.tsx)                           │
│  - parseRepositoryInput() detects local path                     │
│  - Sets: type='local', localPath='/Users/...', owner='local'    │
│  - Encodes path in URL query param                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               NAVIGATION (Next.js Router)                        │
│  URL: /local/my-restricted-repo?type=local&local_path=%2F...    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            WIKI PAGE ([owner]/[repo]/page.tsx)                   │
│  1. Extract local_path from searchParams                        │
│  2. Build RepoInfo with localPath field                         │
│  3. Fetch file tree: GET /local_repo/structure?path=...         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│         BACKEND API (/local_repo/structure)                      │
│  - Validates path exists                                        │
│  - Walks directory tree                                         │
│  - Returns {file_tree, readme}                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              WIKI GENERATION (WebSocket)                         │
│  1. Client calls getRepoUrl(repoInfo)                           │
│     → Returns localPath                                         │
│  2. WebSocket sends RepoInfo with localPath                     │
│  3. Backend RAG.prepare_retriever(localPath, ...)               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           DATA PIPELINE (data_pipeline.py)                       │
│  1. DatabaseManager._create_repo(localPath)                     │
│     → Detects non-URL (doesn't start with http)                 │
│     → Sets save_repo_dir = localPath (no cloning!)              │
│     → Extracts repo_name from os.path.basename(localPath)       │
│  2. prepare_db_index()                                          │
│     → read_all_documents(save_repo_dir)                         │
│     → Creates embeddings                                        │
│     → Saves to ~/.adalflow/databases/{repo_name}.pkl            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  RAG PIPELINE (rag.py)                           │
│  - Retriever initialized with local documents                   │
│  - FAISS index built from embeddings                            │
│  - Ready for Q&A and wiki generation                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  WIKI CONTENT GENERATION                         │
│  - Structure generation (LLM via proxy)                         │
│  - Page content generation (LLM via proxy)                      │
│  - Cache saved to ~/.adalflow/wikicache/                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    WIKI DISPLAY                                  │
│  - Tree view shows structure                                    │
│  - Pages rendered with content                                  │
│  - Chat/Ask feature uses RAG retriever                          │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Principles Observed

1. **Path Agnosticism**: Core data pipeline doesn't distinguish between URLs and paths
2. **No Cloning for Local**: Local paths skip Git clone entirely
3. **Consistent Caching**: Database and wiki cache use same naming scheme
4. **Type Safety**: `RepoInfo` model enforces proper typing
5. **Error Handling**: Path validation at API layer

---

## Potential Gaps & Risks

### Critical Issues (Must Fix) 🔴

**None Identified** - Core functionality appears complete.

### High Priority (Should Fix) 🟡

#### 1. WebSocket Chat Integration

**File**: `api/websocket_wiki.py:98`

**Current Code**:
```python
request_rag.prepare_retriever(request.repo_url, request.type, request.token, ...)
```

**Issue**:
- Uses `request.repo_url` field
- For local repos, this might be `None` or the URL-encoded path
- Should use `getRepoUrl()` equivalent or check for `localPath`

**Impact**: Chat/Ask feature may fail for local repositories

**Solution**:
```python
# Determine the actual path/URL to use
repo_path_or_url = request.localPath if request.type == 'local' else request.repo_url
request_rag.prepare_retriever(repo_path_or_url, request.type, request.token, ...)
```

#### 2. Wiki Cache Path Generation

**File**: `api/api.py:408-411`

**Current Code**:
```python
def get_wiki_cache_path(owner: str, repo: str, repo_type: str, language: str) -> str:
    """Generates the file path for a given wiki cache."""
    filename = f"deepwiki_cache_{repo_type}_{owner}_{repo}_{language}.json"
    return os.path.join(WIKI_CACHE_DIR, filename)
```

**Issue**:
- For local repos: `owner = "local"`, `repo = basename(path)`
- Multiple local repos with same basename will collide
- Example: `/home/user/project1/myapp` and `/home/user/project2/myapp` both → `deepwiki_cache_local_local_myapp_en.json`

**Impact**: Cache collisions for local repos with same name

**Solution**: Include path hash in cache filename for local repos:
```python
def get_wiki_cache_path(owner: str, repo: str, repo_type: str, language: str, repo_path: str = None) -> str:
    if repo_type == 'local' and repo_path:
        # Use hash of path to ensure uniqueness
        import hashlib
        path_hash = hashlib.md5(repo_path.encode()).hexdigest()[:8]
        filename = f"deepwiki_cache_{repo_type}_{owner}_{repo}_{path_hash}_{language}.json"
    else:
        filename = f"deepwiki_cache_{repo_type}_{owner}_{repo}_{language}.json"
    return os.path.join(WIKI_CACHE_DIR, filename)
```

### Medium Priority (Nice to Have) 🟢

#### 3. Path Validation

**Location**: Frontend input validation

**Current**: Basic path format detection
**Enhancement**:
- Check if path exists before submitting
- Show warning if path is inaccessible
- Validate path permissions

#### 4. UI Indicators

**Location**: Wiki page display

**Current**: Shows local path in header
**Enhancement**:
- Add folder icon for local repos (vs GitHub/GitLab icons)
- Show "Local Repository" badge
- Add tooltips explaining local processing

#### 5. Relative Path Support

**Current**: Only absolute paths supported
**Enhancement**:
- Allow relative paths (resolve relative to current directory)
- Add working directory display

### Low Priority (Future) 🔵

#### 6. Path Browser UI

Add file picker dialog for selecting local repository paths instead of typing.

#### 7. Watch Mode

Monitor local repository for changes and auto-regenerate wiki.

#### 8. Symlink Handling

Properly handle symbolic links in local repositories.

---

## Testing Strategy

### Phase 1: Basic Functionality Verification (30 minutes)

**Objective**: Confirm local repo support works end-to-end without code changes.

#### Test 1: DeepWiki Self-Documentation
**Repository**: `/Users/ehfaz.rezwan/Projects/deepwiki-open` (this project!)

**Steps**:
1. Start DeepWiki backend: `api/.venv/bin/python -m api.main`
2. Start DeepWiki frontend: `yarn dev --port 3001`
3. Navigate to `http://localhost:3001`
4. Enter path: `/Users/ehfaz.rezwan/Projects/deepwiki-open`
5. Click "Generate Wiki"

**Expected Results**:
- ✅ Path recognized as local repository
- ✅ URL changes to `/local/deepwiki-open?type=local&local_path=...`
- ✅ File tree fetched successfully
- ✅ README.md displayed
- ✅ Embeddings generated (should see Vertex AI logs)
- ✅ Wiki structure generated
- ✅ Wiki pages populated
- ✅ Cache saved to `~/.adalflow/wikicache/deepwiki_cache_local_local_deepwiki-open_en.json`

**Success Criteria**:
- No errors in backend logs
- No errors in frontend console
- Wiki displays correctly
- Chat/Ask feature works

#### Test 2: Restricted Organization Repository
**Repository**: `/path/to/your/cloned/org/repo` (if accessible locally)

**Steps**:
1. Manually clone your restricted repo: `git clone <repo> /tmp/restricted-repo`
2. Enter path in DeepWiki: `/tmp/restricted-repo`
3. Generate wiki

**Expected Results**:
- Same as Test 1
- Verify no network calls to repository hosting service
- Confirm local-only processing

**Success Criteria**:
- Works identically to Test 1
- No authentication errors
- No network-related errors

#### Test 3: Chat/Ask Feature
**Repository**: Any local repo from Test 1 or 2

**Steps**:
1. After wiki generation complete
2. Click "Ask" button
3. Ask: "What is the main purpose of this repository?"
4. Verify response

**Expected Results**:
- ✅ Chat opens
- ✅ RAG retrieves relevant context from local files
- ✅ LLM generates response
- ✅ No errors in WebSocket communication

**Success Criteria**:
- Response is relevant and accurate
- No "repo_url not found" errors
- Retrieved documents shown

#### Test 4: Cache Behavior
**Repository**: Same local repo tested twice

**Steps**:
1. Generate wiki for `/Users/ehfaz.rezwan/Projects/deepwiki-open`
2. Note generation time
3. Delete wiki cache: Navigate to wiki, click "Clear Cache"
4. Regenerate wiki
5. Note generation time

**Expected Results**:
- ✅ First generation: Creates embeddings (~30 seconds)
- ✅ Cache file created
- ✅ Cache deletion successful
- ✅ Second generation: Re-creates embeddings
- ✅ Both times produce identical wiki structure

#### Test 5: Edge Cases

**Test 5a: Path with Spaces**
- Path: `/Users/ehfaz.rezwan/Projects/my test repo`
- Expected: Proper URL encoding, successful processing

**Test 5b: Very Long Path**
- Path: `/Users/ehfaz.rezwan/Projects/deeply/nested/directory/structure/with/many/levels/my-repo`
- Expected: Truncation or proper handling in UI

**Test 5c: Path with Special Characters**
- Path: `/Users/ehfaz.rezwan/Projects/repo-with-äöü`
- Expected: UTF-8 handling, no encoding errors

**Test 5d: Non-existent Path**
- Path: `/Users/ehfaz.rezwan/Projects/does-not-exist`
- Expected: Clear error message, graceful failure

**Test 5e: File (not Directory)**
- Path: `/Users/ehfaz.rezwan/Projects/deepwiki-open/README.md`
- Expected: Error indicating path must be a directory

### Phase 2: Integration Testing (If Phase 1 reveals issues)

#### Test 6: WebSocket Communication
**Script**: Create dedicated test for WebSocket with local repo

```python
# test/test_local_repo_websocket.py
import asyncio
import websockets
import json

async def test_local_repo_chat():
    """Test WebSocket chat with local repository"""
    uri = "ws://localhost:8001/ws/chat"

    request = {
        "repo_url": "/Users/ehfaz.rezwan/Projects/deepwiki-open",
        "type": "local",
        "localPath": "/Users/ehfaz.rezwan/Projects/deepwiki-open",
        "messages": [{
            "role": "user",
            "content": "What is this repository about?"
        }],
        "provider": "openai",
        "model": "google-vertex/gemini-2.5-pro"
    }

    async with websockets.connect(uri) as websocket:
        await websocket.send(json.dumps(request))

        response = ""
        async for message in websocket:
            response += message
            print(f"Received: {message}")

        assert len(response) > 0, "Should receive response"
        print(f"\nFull response: {response}")

if __name__ == "__main__":
    asyncio.run(test_local_repo_chat())
```

**Expected**: Response received, no errors

#### Test 7: Database Manager
**Script**: Direct test of DatabaseManager with local path

```python
# test/test_local_repo_database.py
import os
from api.data_pipeline import DatabaseManager

def test_local_repo_database():
    """Test DatabaseManager with local repository"""
    db_manager = DatabaseManager()

    # Use this project as test subject
    local_path = "/Users/ehfaz.rezwan/Projects/deepwiki-open"

    print(f"Testing with local path: {local_path}")
    assert os.path.exists(local_path), f"Path {local_path} does not exist"

    # Prepare database
    documents = db_manager.prepare_database(
        repo_url_or_path=local_path,
        repo_type="local",
        access_token=None,
        embedder_type="vertex",
        excluded_dirs=["node_modules", ".git", ".venv"],
        excluded_files=[".DS_Store"]
    )

    print(f"✅ Documents found: {len(documents)}")
    assert len(documents) > 0, "Should have found documents"

    # Check paths
    print(f"✅ Repo paths: {db_manager.repo_paths}")
    assert db_manager.repo_paths is not None
    assert db_manager.repo_paths['save_repo_dir'] == local_path

    print("✅ All database tests passed!")

if __name__ == "__main__":
    test_local_repo_database()
```

**Expected**: All assertions pass, documents found, database created

#### Test 8: Cache Collision Prevention
**Script**: Test cache naming with same basename

```python
# test/test_cache_collision.py
from api.api import get_wiki_cache_path

def test_cache_collision():
    """Test that different local repos with same name get different caches"""

    # Same basename, different paths
    cache1 = get_wiki_cache_path("local", "myapp", "local", "en")
    cache2 = get_wiki_cache_path("local", "myapp", "local", "en")

    print(f"Cache 1: {cache1}")
    print(f"Cache 2: {cache2}")

    # Currently, these will be IDENTICAL (collision!)
    # After fix, they should include path hash

    if cache1 == cache2:
        print("⚠️  COLLISION DETECTED - Same cache path for different repos")
        print("    This is a known issue that should be fixed")
    else:
        print("✅ Different cache paths - collision prevention working")

if __name__ == "__main__":
    test_cache_collision()
```

**Expected (before fix)**: Collision warning
**Expected (after fix)**: Different paths

### Phase 3: Performance Testing (Optional)

#### Test 9: Large Local Repository
**Repository**: Large open-source project (e.g., cloned Linux kernel subset)

**Metrics to Track**:
- Time to scan files
- Memory usage
- Number of documents processed
- Embedding generation time
- Wiki generation time

**Expected**: Comparable performance to remote repositories

### Phase 4: Regression Testing

Ensure existing remote repository functionality still works:

#### Test 10: Remote GitHub Repository
- Repository: `https://github.com/AsyncFuncAI/deepwiki-open`
- Verify: Everything still works as before

#### Test 11: Private Remote Repository
- Repository: Any private repo with token
- Verify: Token-based authentication still works

---

## Implementation Plan

### **IF** Phase 1 Testing Reveals Issues

#### Step 1: Fix WebSocket Chat Integration (1 hour)

**File to Modify**: `api/websocket_wiki.py`

**Current Code** (Line ~98):
```python
request_rag.prepare_retriever(request.repo_url, request.type, request.token, ...)
```

**Fixed Code**:
```python
# Determine the actual path/URL to use
if request.type == 'local':
    repo_path_or_url = request.localPath if hasattr(request, 'localPath') else request.repo_url
    if not repo_path_or_url:
        await websocket.send_text("Error: Local path not provided for local repository")
        await websocket.close()
        return
else:
    repo_path_or_url = request.repo_url

logger.info(f"Preparing retriever for: {repo_path_or_url} (type: {request.type})")
request_rag.prepare_retriever(repo_path_or_url, request.type, request.token, ...)
```

**Testing**:
- Run Test 3 (Chat/Ask Feature)
- Verify no "repo_url not found" errors
- Confirm context retrieval works

#### Step 2: Fix Cache Collision Issue (1 hour)

**File to Modify**: `api/api.py`

**Update `get_wiki_cache_path()` function**:

```python
import hashlib

def get_wiki_cache_path(owner: str, repo: str, repo_type: str, language: str, repo_path: str = None) -> str:
    """
    Generates the file path for a given wiki cache.

    For local repositories, includes a path hash to prevent collisions
    when different local repos have the same basename.
    """
    if repo_type == 'local' and repo_path:
        # Use first 8 chars of MD5 hash for uniqueness
        path_hash = hashlib.md5(repo_path.encode()).hexdigest()[:8]
        filename = f"deepwiki_cache_{repo_type}_{owner}_{repo}_{path_hash}_{language}.json"
    else:
        filename = f"deepwiki_cache_{repo_type}_{owner}_{repo}_{language}.json"

    return os.path.join(WIKI_CACHE_DIR, filename)
```

**Update all calls to `get_wiki_cache_path()`**:

Need to pass `repo_path` parameter from `RepoInfo`:

1. `read_wiki_cache()` (Line ~413):
```python
async def read_wiki_cache(owner: str, repo: str, repo_type: str, language: str, repo_path: str = None) -> Optional[WikiCacheData]:
    cache_path = get_wiki_cache_path(owner, repo, repo_type, language, repo_path)
    # ... rest of function
```

2. `save_wiki_cache()` (Line ~426):
```python
async def save_wiki_cache(data: WikiCacheRequest) -> bool:
    # Extract repo path from RepoInfo
    repo_path = data.repo.localPath if data.repo.type == 'local' else data.repo.repoUrl
    cache_path = get_wiki_cache_path(
        data.repo.owner,
        data.repo.repo,
        data.repo.type,
        data.language,
        repo_path  # Pass path for hash
    )
    # ... rest of function
```

3. Update API endpoints to pass `repo_path` when needed.

**Testing**:
- Create two local repos with same basename
- Generate wikis for both
- Verify different cache files created
- Run Test 8 (Cache Collision Prevention)

#### Step 3: Add Path Validation (30 minutes)

**File to Modify**: `src/app/page.tsx`

**Add validation in `handleSubmit()`**:

```typescript
const handleSubmit = async () => {
    // ... existing validation ...

    const { owner, repo, type, localPath } = parsedRepo;

    // Validate local path exists (client-side check)
    if (type === 'local' && localPath) {
        try {
            // Check if path is accessible via API
            const response = await fetch(
                `/api/local_repo/structure?path=${encodeURIComponent(localPath)}`
            );

            if (!response.ok) {
                const error = await response.json();
                setError(`Local path error: ${error.error || 'Path not accessible'}`);
                setIsSubmitting(false);
                return;
            }
        } catch (err) {
            setError('Failed to validate local path. Please check the path and try again.');
            setIsSubmitting(false);
            return;
        }
    }

    // ... continue with navigation ...
};
```

**Testing**:
- Test 5d (Non-existent Path)
- Verify error message appears
- Verify no navigation occurs

#### Step 4: Enhance UI for Local Repos (1 hour)

**File to Modify**: `src/app/[owner]/[repo]/page.tsx`

**Add local repo indicator**:

```typescript
// Around line 2050, update repository display
{effectiveRepoInfo.type === 'local' ? (
    <div className="flex items-center">
        <FaFolder className="mr-2 text-[var(--accent-primary)]" />  {/* Folder icon */}
        <span className="px-2 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]
                        rounded text-xs mr-2">
            Local Repository
        </span>
        <span className="break-all text-sm">{effectiveRepoInfo.localPath}</span>
    </div>
) : (
    // ... existing remote repo display ...
)}
```

**Testing**:
- Visual inspection
- Verify local repos show folder icon
- Verify badge displays

#### Step 5: Update Tests (1 hour)

**Create comprehensive test file**: `test/test_local_repo_full.py`

```python
"""
Comprehensive test suite for local repository support
"""
import os
import pytest
from api.data_pipeline import DatabaseManager
from api.rag import RAG

class TestLocalRepositorySupport:
    """Test local repository functionality end-to-end"""

    @pytest.fixture
    def sample_repo_path(self):
        """Path to a known local repository for testing"""
        # Use the deepwiki-open project itself
        return "/Users/ehfaz.rezwan/Projects/deepwiki-open"

    def test_path_detection(self, sample_repo_path):
        """Test that local paths are correctly detected"""
        assert os.path.exists(sample_repo_path), "Sample repo must exist"
        assert os.path.isdir(sample_repo_path), "Sample repo must be a directory"

    def test_database_creation(self, sample_repo_path):
        """Test database creation from local path"""
        db_manager = DatabaseManager()
        documents = db_manager.prepare_database(
            repo_url_or_path=sample_repo_path,
            repo_type="local",
            embedder_type="vertex",
            excluded_dirs=["node_modules", ".git", ".venv", "docs"]
        )

        assert len(documents) > 0, "Should find documents in local repo"
        assert db_manager.repo_paths is not None
        assert db_manager.repo_paths['save_repo_dir'] == sample_repo_path

        print(f"✅ Found {len(documents)} documents")

    def test_rag_initialization(self, sample_repo_path):
        """Test RAG initialization with local repository"""
        rag = RAG(provider="openai", model="google-vertex/gemini-2.5-pro")
        rag.prepare_retriever(
            repo_url_or_path=sample_repo_path,
            type="local",
            excluded_dirs=["node_modules", ".git", ".venv", "docs"]
        )

        assert rag.transformed_docs is not None
        assert len(rag.transformed_docs) > 0

        print(f"✅ RAG initialized with {len(rag.transformed_docs)} transformed documents")

    def test_cache_path_uniqueness(self):
        """Test that different local paths generate different cache paths"""
        from api.api import get_wiki_cache_path

        # This will fail if collision prevention not implemented
        # After fix, these should be different
        path1 = "/home/user/projects/myapp"
        path2 = "/home/other/myapp"

        cache1 = get_wiki_cache_path("local", "myapp", "local", "en", path1)
        cache2 = get_wiki_cache_path("local", "myapp", "local", "en", path2)

        assert cache1 != cache2, "Different local paths should generate different cache files"
        print(f"✅ Cache collision prevention working")
        print(f"   Path 1 cache: {cache1}")
        print(f"   Path 2 cache: {cache2}")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

**Run tests**:
```bash
cd /Users/ehfaz.rezwan/Projects/deepwiki-open
api/.venv/bin/python -m pytest test/test_local_repo_full.py -v
```

#### Step 6: Documentation Updates (30 minutes)

**Update files**:

1. **README.md** - Add section on local repository usage
2. **CLAUDE.md** - Document local path handling for future Claude sessions
3. **docs/conversation-summary.md** - Add entry about local repo implementation

**Example addition to README.md**:

```markdown
### Local Repository Support

DeepWiki can process local repositories without requiring Git cloning or remote access:

**Usage**:
1. Enter the absolute path to your local repository:
   - **Mac/Linux**: `/Users/username/Projects/my-repo`
   - **Windows**: `C:\Users\username\Projects\my-repo`
2. Generate wiki as usual

**Benefits**:
- No network access required
- Works with repositories that have restricted access
- Faster processing (no cloning step)
- Privacy: all processing happens locally

**Requirements**:
- Repository must be accessible on the filesystem
- Path must be absolute (not relative)
- Read permissions required
```

---

## Success Criteria

### Phase 1 Success (Minimum Viable)

✅ Local repository path accepted in UI
✅ Path correctly parsed and validated
✅ Navigation to wiki page with local path parameter
✅ File tree fetched from local filesystem
✅ README.md content extracted
✅ Documents indexed successfully
✅ Embeddings generated (Vertex AI)
✅ Wiki structure created
✅ Wiki pages populated with content
✅ Cache saved with unique identifier
✅ No errors in backend logs
✅ No errors in frontend console

### Phase 2 Success (Full Feature Parity)

✅ All Phase 1 criteria met
✅ Chat/Ask feature works with local repos
✅ Retrieved documents show local file paths
✅ WebSocket communication stable
✅ Multiple local repos don't cause cache collisions
✅ Edge cases handled gracefully (spaces, special chars)
✅ Error messages clear and actionable

### Phase 3 Success (Production Ready)

✅ All Phase 2 criteria met
✅ Comprehensive test coverage (>80%)
✅ Documentation complete and accurate
✅ Performance comparable to remote repos
✅ UI enhancements implemented
✅ Security review passed (no path traversal vulnerabilities)
✅ Regression tests pass (remote repos still work)

---

## Security Considerations

### Path Traversal Prevention

**Risk**: User provides path like `../../etc/passwd`

**Mitigations**:
1. Backend validates path exists and is a directory
2. Only reads files within specified directory tree
3. Excludes hidden files and sensitive directories by default
4. No file writes to user-provided paths (only reads)

### Access Control

**Risk**: User accesses repository they shouldn't have access to

**Mitigations**:
1. Relies on filesystem permissions (if user can read it, they can process it)
2. No elevation of privileges
3. Backend runs with user's permissions
4. Consider adding optional auth check before local repo processing

### File Size Limits

**Risk**: User provides path to huge repository causing resource exhaustion

**Mitigations**:
1. Existing token count limits apply
2. Large files automatically skipped
3. Consider adding total size limit check
4. Batch processing prevents memory overflow

### Privacy

**Benefit**: Local processing ensures sensitive code never leaves the machine
**Consideration**: Cache files stored in `~/.adalflow/` - ensure proper permissions

---

## Timeline Estimates

### Conservative Estimate (If issues found)

| Phase | Task | Time | Dependencies |
|-------|------|------|--------------|
| 1 | Basic Testing | 30 min | None |
| 1 | Issue Identification | 30 min | Basic Testing |
| 2 | WebSocket Fix | 1 hour | Issue ID |
| 2 | Cache Collision Fix | 1 hour | Issue ID |
| 2 | Testing Fixes | 1 hour | Fixes Complete |
| 3 | Path Validation | 30 min | None |
| 3 | UI Enhancements | 1 hour | None |
| 3 | Test Suite Creation | 1 hour | None |
| 3 | Documentation | 30 min | All Complete |
| **TOTAL** | | **7.5 hours** | |

### Optimistic Estimate (If everything works)

| Phase | Task | Time |
|-------|------|------|
| 1 | Basic Testing | 30 min |
| 1 | Verification | 30 min |
| 3 | Quick Documentation | 30 min |
| **TOTAL** | | **1.5 hours** |

---

## Reference Documentation

### Related Files

**Backend**:
- `api/api.py` - API endpoints, RepoInfo model, local structure endpoint
- `api/data_pipeline.py` - DatabaseManager, path handling, document reading
- `api/rag.py` - RAG pipeline initialization
- `api/websocket_wiki.py` - WebSocket chat handler (needs verification)

**Frontend**:
- `src/app/page.tsx` - Path parsing, form submission, navigation
- `src/app/[owner]/[repo]/page.tsx` - Wiki page, file tree fetching
- `src/utils/getRepoUrl.tsx` - URL/path extraction utility
- `src/types/repoinfo.ts` - RepoInfo type definition

**Tests**:
- `test/test_extract_repo_name.py` - Basic local path tests
- `test/test_local_repo_full.py` - Comprehensive suite (to be created)

### External Documentation

- **AdalFlow Documentation**: https://adalflow.sylph.ai/
- **FAISS Documentation**: https://github.com/facebookresearch/faiss
- **Vertex AI Embeddings**: https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings

### Previous Implementation Phases

- `docs/adc-implementation-plan.md` - ADC authentication planning
- `docs/phase1-completion-summary.md` - Vertex AI embeddings
- `docs/phase2-completion-summary.md` - LLM proxy integration
- `docs/conversation-summary.md` - Complete conversation history

---

## Appendix: Quick Command Reference

### Testing Commands

```bash
# Start backend (from project root)
cd /Users/ehfaz.rezwan/Projects/deepwiki-open
api/.venv/bin/python -m api.main

# Start frontend (from project root)
yarn dev --port 3001

# Run local repo tests (once created)
api/.venv/bin/python -m pytest test/test_local_repo_full.py -v

# Check backend logs
tail -f api/logs/application.log

# Clear cache for testing
rm ~/.adalflow/databases/*.pkl
rm ~/.adalflow/wikicache/*.json
```

### Manual Testing URLs

```bash
# Test with deepwiki-open (self-documentation)
http://localhost:3001/local/deepwiki-open?type=local&local_path=%2FUsers%2Fehfaz.rezwan%2FProjects%2Fdeepwiki-open&language=en

# Direct cache API test
curl "http://localhost:8001/local_repo/structure?path=/Users/ehfaz.rezwan/Projects/deepwiki-open"
```

### Debugging

```bash
# Check ADC status
gcloud auth application-default print-access-token

# Check proxy (if using)
curl http://localhost:4001/v1/models

# Python interactive debugging
cd /Users/ehfaz.rezwan/Projects/deepwiki-open/api
python
>>> from data_pipeline import DatabaseManager
>>> db = DatabaseManager()
>>> docs = db.prepare_database("/Users/ehfaz.rezwan/Projects/deepwiki-open", "local")
>>> len(docs)
```

---

## Next Steps

1. ✅ **Review this plan** - Ensure alignment with project goals
2. ⏳ **Execute Phase 1 Testing** - Verify current implementation
3. ⏳ **Triage Issues** - Categorize any problems found
4. ⏳ **Implement Fixes** - Address critical issues first
5. ⏳ **Comprehensive Testing** - Run full test suite
6. ⏳ **Documentation** - Update user-facing docs
7. ⏳ **Deploy** - Use local repo support in production

---

**Document Version**: 1.0
**Last Updated**: 2025-11-11
**Status**: Ready for Phase 1 Testing
**Next Review**: After Phase 1 completion
