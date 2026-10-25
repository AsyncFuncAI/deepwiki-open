# Headless indexing: first increment

Run from the DeepWiki checkout, on branch `feature/headless-multirepo-mcp`.
The scan configuration is in `.env` (see `headless.env.example`). Its three folders are explicit
scan roots, even when a folder is part of a larger Git repository. Nested
repositories inside a scan root are included as ordinary source folders;
Git metadata remains subject to the existing default exclusions.
No Git checkout, fetch, reset, or write is performed on source repositories.

```sh
python3 -m api.headless --plan
python3 -m api.headless
```

`--plan` needs only Python 3.11+ and validates every directory before doing any
indexing. To index, install the backend dependencies declared in
`api/pyproject.toml` and configure the existing embedding provider using the
backend setup instructions. The command uses `DatabaseManager` directly,
without an HTTP server, frontend, or answer-generation model.
The first real indexing run will send selected source content to the configured
embedding provider, just as the existing indexing pipeline does.

## Configure scan folders

```dotenv
DEEPWIKI_SCAN_ROOT=/home/ofer_g/projects/ETX_VSC/etxa_devops
DEEPWIKI_SCAN_FOLDERS='["etx_makebuild", "etx_dnfv/etx_dnfv_mng_plane", "etx_unitedbuild"]'
```

Edit `DEEPWIKI_SCAN_FOLDERS` to add or remove folders. It is a JSON array on one
line, optionally enclosed in single quotes. Paths are relative to
`DEEPWIKI_SCAN_ROOT`; escaping that root, including through symlinks, is rejected.
A relative scan root is resolved against the .env file directory. Quote root
paths containing spaces. Use `--env-file path/to/file.env` for another config.
Exported environment variables override file values. This lightweight reader
supports one-line values and optional `export`; it does not expand variables or
execute shell commands. Unrelated .env settings are ignored and preserved.
The actual `.env` remains ignored by Git; `headless.env.example` is the shareable
configuration example. Root IDs are generated deterministically from relative
folder paths. Planning remains dependency-free.

An explicit JSON manifest is still supported for advanced per-root file filters:
`python3 -m api.headless headless.etx.json --plan`. When supplied, it takes
precedence over the .env scan settings.

Each entry needs a unique `id` and local `path`. Relative paths are resolved
against the manifest directory. Optional `excluded_dirs`, `excluded_files`,
`included_dirs`, and `included_files` use the existing pipeline rules. Overlapping
roots are rejected to avoid duplicate indexing. Symlinked files that resolve
outside a scan root are skipped by the document reader.

Indexes are separate under `~/.adalflow/headless/<id>-<selection-hash>/`,
overridable with `--storage-root`. The hash includes the canonical path and file
filters, so same-name repositories and changed selections cannot share a cache.
Do not change the embedding model while reusing a storage root; choose a fresh
`--storage-root` when changing embedding configuration.
Existing web API storage defaults are unchanged. The new indexes are not yet
connected to the web API or a cross-repository retriever.

Standard output is one JSON object containing per-root results. Logs go to
standard error. Exit codes: 0 success, 1 at least one indexing failure,
2 invalid input or missing backend dependencies. Index failures report exception
classes rather than raw provider errors. Other roots still run after one fails.

Existing valid indexes are reused. This step does not detect source changes,
refresh Git checkouts, perform changed-file reindexing, generate wiki pages,
or expose MCP tools. Those are subsequent increments. The current milestone
provides the explicit source configuration and isolated indexing entry point.

## Cline generation settings

The `.env` file also holds the answer/wiki generation provider:

```dotenv
DEEPWIKI_PROVIDER=cline
CLINE_BASE_URL=https://api.cline.bot/api/v1
CLINE_API_KEY=
CLINE_MODEL=
```

Fill in your API key from Cline account settings and the exact model ID from
Cline's model list. For example, the Cline API docs show
`anthropic/claude-sonnet-4-6`. No model is selected automatically: a missing
`CLINE_MODEL` produces a configuration error when generation is requested.
Explicit request provider/model values take precedence over the environment
provider default and the Cline default model. Restart the backend after editing
model settings. Do not place the key in the tracked example or a JSON manifest.

The Cline client uses its own key and URL; it does not replace OpenAI embedding
credentials. Indexing still uses the existing `DEEPWIKI_EMBEDDER_TYPE` and that
provider's credentials. Cline chat API support does not establish embedding API
support. The headless command loads the selected .env before importing the
embedding pipeline. Its `--plan` output never includes model credentials.
The headless command supports indexing, search and cited answers through CLI and
MCP. Real Cline/Qwen answers have been validated after explicit source-export
approval. Wiki generation has its own separate consent gate.

## Architecture

- `api/repository.py`: resolves local folders or clones remote repositories.
- `api/config.py::iterate_files`: selects code/document files using configured filters.
- `api/rag/pipeline.py`: reads documents, tracks chunk line ranges, embeds and
  persists `LocalDB` state. `DatabaseManager` reuses existing embeddings.
- `api/rag/rag.py`: builds FAISS retrieval and answer-generation components.
- `api/services/research.py` and `api/routers/repo.py`: current HTTP-facing preparation.
- `api/headless.py`: manifest validation and sequential independent indexing.

## Validation

```sh
python3 -m unittest discover -s tests -t . -p test_headless.py -v
python3 -m compileall -q api/headless.py api/rag/pipeline.py
```

The dependency-free suite tests configuration, isolation, failure handling and
pipeline invocation with a fake manager. It does not call an embedding provider.

## Google embedding setup

The remote `.env` selects:

```dotenv
DEEPWIKI_EMBEDDER_TYPE=google
GOOGLE_EMBEDDING_MODEL=gemini-embedding-001
GOOGLE_API_KEY=
```

Fill `GOOGLE_API_KEY` locally using a Google AI Studio Gemini API key. Cline
settings continue to control generation separately. The model override is applied
by `load_embedder_config`; restart any backend process after changing it. This
initial setup uses the existing Google adapter's semantic-similarity task and
model-default 3072 dimensions for both documents and queries. Embedding 2 uses
different task/batch semantics and is not a drop-in replacement for this adapter.
No Google request is made until the key is supplied and a validation run starts.

## Confirmed source file types

The user restricted the first full index to C source/headers, Python, Makefiles
and `.sh` scripts. The `.env` allowlist is authoritative and replaces the broad
code/document extension defaults:

```dotenv
DEEPWIKI_SCAN_EXTENSIONS='[".c", ".h", ".py", ".sh", ".mk"]'
DEEPWIKI_SCAN_FILENAMES='["Makefile", "makefile", "GNUmakefile", "Makefile.*", "makefile.*"]'
```

XML, YANG, JSON, documentation and compiled/binary artifacts are not selected.
Existing excluded directories still apply. The first run is a full index;
changed-file-only processing is relevant only to later runs.

## First full source index

`python -m api.headless` now saves multiple independently validated LocalDB parts
instead of loading an entire large root's embeddings into memory. The completed
root is described by `parts-<configuration-hash>/manifest.json` beneath its storage
folder. `progress.json` is updated after each part. Identical saved parts are reused
on retry; this is checkpoint recovery, not a promise of file-level incremental updates.
The active configuration hash includes source file types, embedding model parameters,
and token chunking. Headless chunks use 1000 tokens with 150-token overlap and Google
batches of up to 100 chunks. Existing web API defaults are unchanged.

Full-source mode handles UTF-8 with replacement for undecodable legacy bytes and
does not drop a file merely because it exceeds the legacy reader's total-file token
limit. Individual embedding requests still use bounded token chunks. The root
manifest records any files that could not be read and uses `partial` instead of
`ready` if any selected files were skipped.

The current supervised initial run stores status in `.venv/initial-index/status.json`
and logs in `.venv/initial-index/run.log`. Its detached process survives an SSH
disconnect. These are runtime files, not tracked source files. The index parts are
not yet connected to multi-repository question answering or MCP.

## Google quota pacing

The first full run completed all 7 etx_unitedbuild files and all 607
etx_dnfv_mng_plane files with no skips. Google returned HTTP 429 while indexing
etx_makebuild. The run was resumed using its saved parts after configuring
`GOOGLE_EMBEDDING_MIN_INTERVAL_SECONDS=10`. Google calls share that pacing across
parts and retry with backoff for up to five minutes per failed batch. The large
root is still in progress; consult `.venv/initial-index/status.json` for its actual
state before reporting completion. No key or source folder was changed.

## Forward commit reindexing

After the first full index, run this from the remote checkout:

```sh
.venv/bin/python -m api.headless --reindex
```

It updates all configured roots from each owning Git repository's last indexed
commit through its current checked-out HEAD. It does not fetch/pull/reset sources.
The first invocation adopts the saved full index, checks every saved file's content
against the working tree, validates part/vector counts, and reconciles differences
before publishing commit checkpoints. Normal unchanged invocations issue no embedding
calls. Local modified/untracked eligible files are included using file hashes and
stat signatures so commit checkpoints do not hide worktree changes.

Each root stores `state.json` beside its full-index `manifest.json` under the
`parts-<configuration-hash>` directory. `state.json` is the active generation: it
contains separate Git SHAs for the containing and nested repositories, per-file
hashes, active saved-part ownership and dirty-worktree flags. Immutable historical
generations and changed-file parts remain alongside it. The original initial-index
manifest is retained as the adoption source; retrieval must follow the active
state's ownership and use `iter_active_chunks` to suppress deleted/replaced content.

Changed source alone is embedded. Renames with identical content reuse saved
vectors. Deleted files lose active ownership. Checkpoints and ownership are published
atomically only after verifying source files and HEADs stayed stable during the
operation. A failed update preserves the previous valid state. Saved update parts
can be reused after an interrupted publication. An advisory lock prevents concurrent
updates to a root (current implementation targets the Linux SSH server).

The command reports from/to commit SHAs, indexed/deleted/reused counts, dirty file
counts and the state path for every root. Repository-boundary changes, divergent or
missing history and model/selection changes fail explicitly; they never silently
reset checkpoints or rebuild all roots. A new/changed configuration requires an
explicit initial index or targeted reconciliation. A single-root JSON manifest with
the same root ID/path/filters can be used for a targeted initial build.

Offline coverage:

```sh
.venv/bin/python -m unittest tests.test_reindex -v
```

## Cross-repository search and cited answers

```sh
.venv/bin/python -m api.headless --query "How do build scripts invoke make?" --top-k 8
.venv/bin/python -m api.headless --ask "How do build scripts invoke make?" --top-k 8
```

Search builds a local FAISS/SQLite cache from saved active vectors; it never
re-embeds repository files. A query embeds only the question with Google. Results
include repository ID, relative file path, line range, cosine score and source text.
The cache is keyed by active generation, so deleted/replaced chunks are excluded
and updated generations get a fresh cache. Initial search-cache construction needs
extra disk space and roughly 1.5 GB for the large root's float32 vector index.

The answer command retrieves sources then calls the configured generation model.
It is disabled until explicit source-export approval is recorded by setting
`DEEPWIKI_ALLOW_SOURCE_EXCERPTS=true` in `.env`. This sends retrieved private source
excerpts to Cline at the configured URL, not just the user's question. Leave it
false to keep generation excerpts local. Real CLI answers across all three source
roots and a real MCP ask_code request passed after human approval on 2026-10-22.
No generator call is needed for search.

## MCP over SSH

Server entry point (stdio; no network listener):

```sh
.venv/bin/python -m api.headless_mcp
```

The server exposes `list_repositories`, `search_code`, `ask_code` and
`reindex_repositories`. Optional `repo_ids` restrict search/answer/update calls to
known configured IDs; unknown IDs are rejected. Use reindex only on an explicit
user request. Source text is data, and generated answers must cite the excerpts.
Keys stay in the remote `.env`; do not put them in client configuration.

Local stdio transport with the official MCP client has been tested against the
real repository-status and search tools. IDE/CLI client registration is separate.
Generic MCP client entry:

```json
{
  "mcpServers": {
    "codewiki": {
      "command": "ssh",
      "args": ["-T", "-o", "BatchMode=yes", "ofer_g@172.17.238.183", "cd /home/ofer_g/projects/deepwiki-open && .venv/bin/python -m api.headless_mcp"]
    }
  }
}
```

The client machine must already have working key-based SSH access. Registering
`search_code` in a hosted-model CLI means that CLI may send returned excerpts to
its own model provider; use the client's approval controls according to your data
policy. The server's export flag governs its own generation calls, not what an
external MCP client does with search results.

References: [official MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk),
[Codex MCP setup](https://developers.openai.com/codex/mcp),
[Claude Code MCP setup](https://code.claude.com/docs/en/mcp).

### Register in Codex CLI or Claude Code

Run on the client machine where key-based SSH already works:

```sh
codex mcp add codewiki -- ssh -T -o BatchMode=yes ofer_g@172.17.238.183 'cd /home/ofer_g/projects/deepwiki-open && .venv/bin/python -m api.headless_mcp'
claude mcp add --transport stdio codewiki -- ssh -T -o BatchMode=yes ofer_g@172.17.238.183 'cd /home/ofer_g/projects/deepwiki-open && .venv/bin/python -m api.headless_mcp'
```

Use `codex mcp list` or `claude mcp list` to inspect registration and `/mcp` in
the interactive client. These setup commands are documented here; they have not
been executed against the user's local client configuration. Registration itself
does not validate an external model's handling of private source excerpts.

## Headless wiki topic pages

```sh
.venv/bin/python -m api.headless --wiki "Build workflow" --wiki "Architecture overview" --top-k 8
```

This retrieves bounded evidence per topic and generates Markdown pages with numbered
source citations, an index page and a provenance manifest. These are topic-focused
wiki pages, not an exhaustive analysis of every source file. The configured source
export approval is required before generation. This deployment now has explicit
answer and wiki approval for the configured Cline/Qwen destination.

The default artifact root is `~/.adalflow/headless/wiki`; use `--wiki-output` for
another location outside source trees. Each run writes a new immutable generation,
and `codewiki-current.json` moves atomically only when all pages are complete and
the underlying source index generations stayed unchanged. Failed runs leave the
previous published wiki intact. Page manifests include index generations, model,
provider and source references. Wiki output is not automatically regenerated by
`--reindex`; the MCP page-status tools report when saved pages are stale.

Additional MCP tools: `list_wiki_pages`, `get_wiki_page(topic)` and
`generate_wiki_pages(topics, top_k)`. Reading existing pages does not call a model.
Generation is a writing/model action for explicit user requests. It requires both
`DEEPWIKI_ALLOW_SOURCE_EXCERPTS=true` and separately approved
`DEEPWIKI_ALLOW_WIKI_SOURCE_EXCERPTS=true`. Answer approval alone does not enable
wiki exports. Topic lookup cannot read arbitrary filesystem paths.
Wiki lifecycle tests use offline model responses; no private source excerpts have
been sent to Cline during their validation.

## Exact symbols, local syntax and hybrid search

```sh
.venv/bin/python -m api.headless --symbol main --top-k 8
.venv/bin/python -m api.headless --keyword CONFIG_NAME --top-k 8
.venv/bin/python -m api.headless --relations main --top-k 8
.venv/bin/python -m api.headless --hybrid 'Where is `main` called?' --top-k 8
```

Exact lookups read saved indexed snapshots locally and make no embedding or
external generation calls. Names are case-sensitive. `--relations` matches exact
source/target spelling; qualified calls or quoted includes retain their spelling.
Results include repository ID, source path, lines and extraction quality. Duplicate
names in different roots remain separate. Source edits are visible only after
`--reindex`. Structural caches are generation-specific SQLite/FTS indexes under
`parts-*/structure-v1`; later generations reuse unchanged file metadata and parse
only changed files, removing obsolete definitions and edges. Publication is atomic;
failed builds leave previous ready caches intact and can be retried.

C uses Tree-sitter syntax extraction for functions/types/globals/macros, includes,
call syntax and conditional compilation. Python uses AST definitions/calls/imports,
with a labelled fallback for legacy or invalid syntax. Shell and Makefile extraction
is heuristic. Make targets, literal prerequisites/includes/variables and recipe
script or make references are recorded without running commands. C call syntax may
be a macro invocation or function pointer; relationships are unresolved evidence.
No compiler/include-path resolution or build-variant selection is claimed. Dynamic
Make expansion and shell function scope are also unresolved. Parser errors remain
labelled in results; excluded XML, artifacts and other source types stay excluded.

`--hybrid` embeds only the question, combines semantic results with exact identifier
matches and deduplicates overlapping evidence. It expands matches into enclosing
function/class context, capped at 120 lines with definition identity and truncation
metadata. Identifier-only, backtick-quoted and underscore-containing names are used
for exact matching. Existing embedding chunks are reused; this is context expansion,
not a full syntax-based re-chunk/re-embedding pass. `--ask` and MCP `search_code`
use hybrid retrieval. MCP additionally exposes `find_symbol`, `search_exact` and
`find_relations`, with optional known repository IDs. Generation retains its existing
source-export gate. No new provider permission is needed for local exact lookup.

## Cross-file relationship context and linked definitions

```sh
.venv/bin/python -m api.headless --context main --depth 2 --top-k 24
```

This follows a bounded syntax neighborhood across selected roots, returning cited
relationships, candidate definitions, and indexed file-path candidates for includes,
Make prerequisites and scripts. `--depth` is 1–3. The evidence-item budget is 1–50
(`--top-k` here), and total returned text is capped at 48,000 characters. Repeated
names/cycles are visited once; omitted candidates or exhausted budgets set
`truncated`. Caller definitions are scoped to the observed call's file; callee
name candidates remain explicitly unresolved across roots/build variants. Include
and script path matches are spelling candidates, with no compiler/module/Make
search-path evaluation. No source commands or provider calls are made.

MCP `trace_relationships(name, depth=1, limit=24, repo_ids=None)` exposes the same
operation. A graph is evidence of source syntax, not a resolved runtime call graph.

For a symbol result's repository ID, path, definition line and generation:

```sh
.venv/bin/python -m api.headless --definition SYMBOL --repository-id ROOT_ID --file-path relative/path.c --definition-line 42 --max-lines 80 --generation INDEX_GENERATION
```

The response includes `next_start_line` and `previous_start_line`; pass one as
`--window-start` to read another window. MCP `read_definition` accepts the same
identity/window parameters. Passing `generation` rejects stale continuation after
an index update. Reads use indexed snapshots and cannot read arbitrary paths.
Windows are limited to 120 lines and 24,000 characters. `text_truncated` marks an
oversized source line/window; line continuation does not recover the omitted tail
of a single oversized line. Definitions keep full source spans and identity even
when the returned excerpt is bounded. Embeddings are reused without re-chunking.

### Relationship-aware hybrid answers

Hybrid retrieval now enriches its strongest source windows with nearby unresolved
call/build relationships. It uses at most two exact identifiers or definition names
found in semantic results. Each lookup has a bounded one-hop evidence budget;
linked candidates may occupy at most one third of the result slots. Primary source
ranking remains visible, overlapping windows are deduplicated, and total source
text is capped at 48,000 characters. Pure `--query` remains semantic-only.

Relationship metadata retains source-line citations and labels definition/path
links as candidates. A link alone does not establish runtime dispatch, compiler
symbol resolution or an active build configuration. Extraction quality, ambiguity
and truncation are included in generation prompts. `--ask`, wiki generation and
MCP `search_code` share this context; the server-side generation export flag still
applies. Real answer validation subsequently sent retrieved excerpts to Cline only
after explicit human approval. Wiki generation remains separately gated.

Hybrid retrieval records active source generations before searching and rejects
an index publication during retrieval rather than returning a mixed context. Saved
vectors are reused; only the question needs an embedding. Read-only SQLite handles
are explicitly closed after each lookup, including failed calls.

### Conditional compilation context

C/header symbol, relationship, definition-window and hybrid results include
`conditional_context`, extraction quality and `build_variant: "unselected"`.
Each guard records the directive/source lines and branch spelling. `#elif` and
`#else` retain prior branch conditions that must be excluded. Nested guards remain
separate. `scope` distinguishes guards covering the returned excerpt from guards
that overlap only part of it, such as an internal conditional in a function.

No macro expression is evaluated and no build configuration is selected. In
particular, `#if 0` is retained as spelling evidence and conditional alternatives
are not silently discarded. Same-named definitions in different branches keep
their separate source locations. Syntax errors, clipped expressions, long prior
branch lists and omitted guards are labelled. Generation prompts preserve these
fields and must not claim that a candidate branch is active.

Guard metadata is parsed lazily from saved indexed source and cached by file hash
and parser version under `conditions-v1-*` outside source trees. Unchanged content
reuses metadata across index generations. Source edits become visible after
`--reindex`; these caches do not trigger source re-embedding or a full index rebuild.

## Optional syntax-aware embedding chunks

The library default is `DEEPWIKI_CHUNK_STRATEGY=token`, preserving existing index
fingerprints. The ETX deployment was explicitly migrated to `syntax-v1` on
2026-10-22; retained token indexes provide rollback. `syntax-v1` prefers whole C functions and Python functions/classes
(including decorators) within the configured token budget. Oversized definitions
have stable definition identities and linked pieces. Every source character is
covered by exact offsets; overlap is character-aligned and token-bounded. Nested
symbol spans, source lines, piece order/links, syntax quality and C guard evidence
are retained. Invalid syntax and Make/shell regions use labelled token fallback.

Count planned chunks before deciding to create new embeddings:

```sh
.venv/bin/python -m api.headless --chunk-strategy syntax-v1 --estimate-chunks
```

This scans only configured source types/roots, reports selected/read/skipped counts
and estimated embedding tokens, and makes no embedding calls or index writes.
Token counts use cl100k_base, matching the splitter's budget; they are an estimate
of provider usage, not a price quote. A supplied JSON manifest can restrict a dry
run or migration to selected configured roots.

Migration is explicit and may require many new vectors. When deliberately chosen:

```sh
# Builds a separate initial index; this operation calls the embedding provider.
.venv/bin/python -m api.headless --chunk-strategy syntax-v1
# Reconciles source content and establishes the new strategy's Git checkpoints.
.venv/bin/python -m api.headless --chunk-strategy syntax-v1 --reindex
```

Keep the shared `.env` on `token` until the new indexes/checkpoints are ready for
all roots. The CLI override affects only that process. After verification, setting
`DEEPWIKI_CHUNK_STRATEGY=syntax-v1` selects the new indexes for future CLI/MCP
processes; existing servers must be restarted. Resetting it to `token` selects the
retained legacy indexes. Failed syntax builds never overwrite token generations.
Strategy/parser versions participate in the new index identity. `--reindex` refuses
to adopt an absent/incompatible strategy index instead of silently rebuilding it.

Syntax updates still embed only changed eligible files. Same-language renames reuse
vectors while regenerating path-based definition and piece identities; changing the
file's parser language requires new chunking. The web pipeline retains its default
splitter unless documents explicitly request the syntax strategy. Source re-embedding migrations require an explicit user request. The ETX
deployment migration was explicitly authorized and its replacement indexes verified.

### Broad repository questions and citations

Hybrid questions mentioning repositories, repos, roots or comparison across them
retain per-root semantic candidates and a representative from each available root
when the result budget permits. This prevents the largest corpus from crowding out
smaller roots. Context expansion preserves those representatives. Targeted/symbol
questions retain their existing ranking behavior; this diversity step does not
claim every returned excerpt is relevant or exhaustive.

Numeric source citations accept individual and comma-grouped forms such as [1]
and [1, 2]. Out-of-range references reject an answer/wiki result. Numeric array
examples inside code are ignored by citation validation. Bounds validation verifies
reference numbers; it does not prove that a model's interpretation is correct.

Quoted source filenames such as `compile.sh`, `etx_vsc_env.sh`, and `Makefile`
participate in hybrid retrieval as literal saved-path/basename matches. Matching
uses only the selected files in the active saved index, with the same bounded
excerpt and context budgets. Missing filenames are not treated as existing files.

## Compiler-aware C evidence and build variants

Install the locked backend dependencies, including libclang 18. Compiler analysis
runs locally and makes no embedding/generation calls. It does not source scripts,
run make, execute compile commands, load plugins, link programs or change sources.

`DEEPWIKI_COMPILER_PROFILES` points to a version-1 JSON profile file outside the
source trees. `DEEPWIKI_BUILD_VARIANT` selects a profile; `--build-variant` overrides
it for explicit compiler commands. `DEEPWIKI_COMPILER_CONTEXT=true` additionally
attaches bounded compiler evidence for at most two C translation units to hybrid
search/answers. Other roots/languages keep their syntax/semantic evidence.

```sh
.venv/bin/python -m api.headless --build-variants
.venv/bin/python -m api.headless --compiler-file path/to/source.c --repository-id ROOT_ID --build-variant evb-entu_2i_10g
.venv/bin/python -m api.headless --compiler-symbol function_name --build-variant evb-entu_2i_10g
```

MCP equivalents: `list_build_variants`, `analyze_c_translation_unit` and
`find_compiler_symbol`. Symbol lookup reports how many translation units have
actually been analyzed; it never claims whole-repository coverage from a sample.
Cross-unit compiler USRs can identify definition candidates; static definitions
retain file scope. This is not proof that a linker selects that definition.
Function-pointer calls remain unresolved rather than guessed.

The configured ETX profiles follow united_build.sh's EVB configure invocation,
/bin/arm-linux-gnueabihf-gcc target and NXP sysroot. `evb-entu_2i_10g` follows the
script default; `evb-entu_qi_edge` represents its alternate ENTU selection. The
current feature header was found set to qi_edge despite the script's 2i_10g
default. Profiles apply the configure-script feature toggle as an unsaved buffer,
never by modifying that header. A selected analysis profile is not evidence that
an actual build was performed with it. The ARCH=aarch64 shell variable also differs
from the installed compiler's arm-linux-gnueabihf triple; analysis uses that actual
compiler target. A previous successful build is not inferred.

Profiles use literal per-directory INC_DIR metadata and common board/feature
macros. They are explicitly partial until exact per-translation-unit flags are
provided; dynamic Make expansion/conditionals are not executed. Diagnostics,
missing SDK paths, unresolved flags and configuration limits accompany results.
No source eligibility rules are broadened for compiler analysis. Build metadata
is inspected separately and is not embedded or added to the source index.

Libclang parses generation-bound saved C/header snapshots with a non-fallthrough
virtual filesystem. Absolute project includes map to saved snapshots; only
explicit profile SDK/sysroot headers can be read externally. Compiler-bound
definitions/calls and preprocessor-inactive ranges reflect the selected profile.
Error diagnostics always mark analysis partial. Compiler caches include source
generation, libclang version, profile identity and referenced SDK header hashes;
changed build evidence refuses stale profiles. Existing token and syntax-v1
indexes both support compiler analysis without re-embedding their sources.

ETX profile discovery is reproducible via `api.etx_build_profiles.discover(roots)`;
review its limitations and save the JSON outside sources before selecting it.
The current deployment stores profiles in `.venv/compiler-profiles.json`.


## Portable datasets and .env locations

Both the CLI and stdio MCP read these settings from `.env`; MCP launch arguments
are unnecessary for storage locations:

```dotenv
DEEPWIKI_DATA_DIR=/srv/codewiki/data
DEEPWIKI_WIKI_DIR=wiki
DEEPWIKI_READ_ONLY=false
```

`DEEPWIKI_DATA_DIR` holds the source snapshots, vectors, active manifests and Git
checkpoints. `DEEPWIKI_WIKI_DIR` holds published Markdown pages and their manifest.
A relative data path is relative to the `.env` file; a relative wiki path is
relative to the data directory. Existing defaults remain `~/.adalflow/headless`
and its `wiki` child. Environment variables override file settings; explicit
`--storage-root` / `--wiki-output` CLI options remain optional overrides.
`--env-file` selects another configuration for either entry point.

Export the active indexes and currently published wiki, without embedding or
answer model calls:

```sh
.venv/bin/python -m api.headless --export-data /srv/share/codewiki-bundle
```

The destination must not exist. Export atomically creates a versioned catalog,
SQLite document/vector parts, relative references, stable repository IDs, Git
checkpoints and SHA-256 checksums. Only active chunks are included. It excludes
`.env`, API credentials, compiler SDKs, derived caches, inactive index generations
and rollback history. The original dataset is unchanged. SQLite parts replace
legacy Python pickle parts in the exported bundle; do not share legacy pickle
indexes with untrusted recipients. Checksums detect transfer corruption, not
publisher authenticity: obtain bundles from a trusted publisher.

Copy that directory to the recipient host. Install the same codeWiki version and
its backend dependencies there. Create `recipient.env`:

```dotenv
DEEPWIKI_DATA_DIR=/srv/codewiki/data
DEEPWIKI_WIKI_DIR=wiki
DEEPWIKI_READ_ONLY=true
```

Then import and launch, without source checkouts:

```sh
.venv/bin/python -m api.headless --env-file recipient.env --import-data /srv/share/codewiki-bundle
.venv/bin/python -m api.headless_mcp --env-file recipient.env
```

Import validates checksums before atomically publishing into a new directory;
it never overwrites existing data. Alternatively, a verified bundle can itself
be used as a read-only data directory. Wiki reads, exact search, definitions and
syntax relationships need no model key. Semantic search needs the same embedding
provider/model used to create the vectors and the recipient's own API key;
query embeddings still incur provider calls. Generated answers need the recipient's
generation-provider settings and source-excerpt authorization. Export/import
never copy these settings or grant that authorization.

Read-only MCP omits reindex, wiki-generation and compiler-analysis mutation tools.
Query caches and locks go into `~/.cache/codewiki`, so the shared dataset can be
mounted read-only. Set `DEEPWIKI_CACHE_DIR` to an absolute writable directory to
override that per-user cache location. Existing compiler results/SDKs are not
included; exact compiler analysis requires local SDK/profile configuration.

To continue indexing on a different server, set read-only to false and map every
stable repository ID from `catalog.json` to its local source checkout:

```dotenv
DEEPWIKI_READ_ONLY=false
DEEPWIKI_SOURCE_PATHS='{"repository-id-from-catalog":"/srv/checkouts/project"}'
```

Alternatively, set `DEEPWIKI_SCAN_ROOT` to the new common parent while retaining
the exported relative source-folder layout. Explicit mappings take precedence.
The catalog preserves the original selected folders/filters and repository IDs;
changing the catalog's filters is rejected without explicit reconciliation.
Nested Git repositories retain independent commit checkpoints. The first mapped
reindex rehashes selected files to reconcile local signatures, reusing unchanged
vectors; existing forward-history/model/filter checks still apply. Re-export a
new bundle after updates rather than editing the published transfer bundle.
Source-generation changes can mark a wiki stale; moving an unchanged dataset
preserves its generation and wiki freshness.

This remains a local file-backed dataset, not a network database service.
For shared access, mount a published read-only snapshot with per-user caches or
run codeWiki on the data host through an appropriately secured transport.
The current MCP transport is stdio; there is no unauthenticated HTTP DB endpoint.


Wiki generation adds requested topics to the current published wiki and replaces
matching topics. Other pages are copied unchanged, without another model call,
when they refer to the same active source generations. If retained pages are
stale, generation stops before any model request and asks for their topics to be
included in an explicit refresh. Failed generation preserves the previous wiki.


## Resumable feature wiki batch

```sh
.venv/bin/python -m api.wiki_batch --plan-only
.venv/bin/python -m api.wiki_batch
```

The job defaults to `DEEPWIKI_WIKI_DIR/batch` and pins the active source generations,
model and build variant. Its `plan.json` groups every indexed file into bounded
feature/directory groups (small sibling modules share a page). `status.json` records
completed pages and API-reported usage. It publishes one page at a time, retaining
all existing current pages. `responses/` saves paid drafts before publication so
restart recovery can reuse them. The source excerpts are bounded; file inventory
coverage does not establish exhaustive behavior or runtime/build correctness.
Literal credential assignments are redacted while source line numbers are preserved.

The batch reads saved snapshots directly, with no source or query embedding calls,
source checkout changes or builds. It uses the already authorized Cline endpoint
and model in `.env`; it disables SDK retries (`CLINE_MAX_RETRIES=0` for this process).
Budget/credit exhaustion stops the queue, with completed pages still accessible.
Rate limits and other errors also stop without a retry loop. After renewing the
budget next month, run the same command to resume. A process lock prevents duplicate
runners. Nothing schedules an automatic paid restart. If sources/model/variant changed,
explicitly reconcile the plan and stale wiki before resuming. Do not edit a running plan.

To detach a long run on the Linux server:

```sh
nohup .venv/bin/python -m api.wiki_batch > /home/ofer_g/.adalflow/codewiki-data/wiki/batch/run.log 2>&1 < /dev/null &
```

Read `status.json` for progress rather than restarting. Published wiki pages remain
available through MCP `list_wiki_pages` / `get_wiki_page`. The usage cost is provider
reported and is not an independently verified invoice.
