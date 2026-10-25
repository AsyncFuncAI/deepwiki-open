# codeWiki implementation plan

Updated: 2026-10-25

## Current verified milestone

- Initial index complete: 10,932 selected files, 119,991 chunks, no skipped files.
- `--reindex` implemented and real commit baselines adopted for five Git repositories.
  An unchanged real ETX run was verified with embedding calls explicitly blocked.
- Cross-repository `--query` works on the real index and returns line citations.
- Human-approved Cline/Qwen answers pass real CLI and MCP validation. A broad CLI
  answer cites all three configured source roots. Answer and wiki exports are enabled for the explicitly approved Cline/Qwen destination.
- stdio MCP tool discovery, status and source search passed against the real server.
  Codex/Claude registration commands are in HEADLESS.md; local client settings were
  not changed.
- 143 focused tests (129 existing plus 14 compiler scenarios) and 7 existing compatibility tests pass; backend dependencies
  and lockfile are updated.
- Versioned headless wiki topic artifacts and MCP page tools are implemented with
  real MCP generation/readback validation. Libclang translation-unit analysis and explicit
  EVB/ENTU build profiles are now available; exact per-file build flags and whole-program
  compiler/linker resolution remain incomplete. Syntax migration is complete and verified: syntax-v1 is active for 10,931 current
  files / 157,053 chunks. CLI/MCP retrieval and refreshed wiki readback pass. Local
  exact/symbol/relationship and hybrid retrieval, bounded cross-file context and
  linked definition windows are implemented. Historical sections
  below record earlier states; this summary reflects the latest verified milestone.

## Goal

Adapt the user's DeepWiki fork into a headless tool for understanding multiple
code repositories, maintaining their indexes incrementally, and answering code
questions through Codex CLI or Claude CLI using MCP and the indexed/wiki data.
No GUI should be required for setup, indexing, updates, or queries.

## Development location

- Fork: https://github.com/ofergr/deepwiki-open
- SSH: `ofer_g@172.17.238.183`
- Checkout: `/home/ofer_g/projects/deepwiki-open`
- Branch: `feature/headless-multirepo-mcp`
- ChatGPT project: `codeWiki`
- Work directly in this checkout; preserve unrelated changes and source repositories.

## Source scope

Source base: `/home/ofer_g/projects/ETX_VSC/etxa_devops`.
Only these selected folders and their contents should be scanned:

1. `etx_makebuild`
2. `etx_dnfv/etx_dnfv_mng_plane`
3. `etx_unitedbuild`

The scope must be configurable in `.env`, rather than hardcoded in Python.
Do not expand a selected folder to its containing Git repository or scan sibling
folders. `etx_makebuild` contains nested repositories; `etx_dnfv_mng_plane` is a
separate repository; `etx_unitedbuild` belongs to the parent repository. Tracking
updates must account for these boundaries without expanding the allowed scope.

## Requirements

- Run headlessly without the frontend or an interactive web workflow.
- Support multiple configured source roots and retain repository/path provenance
  so files with identical names in different repositories remain distinguishable.
- Keep per-root index storage isolated and persistent.
- Allow manual indexing/reindexing triggers. Automatic push detection or scheduling
  is not required in the first phase.
- On subsequent indexing runs, process only added/changed files, remove deleted
  files and their stale chunks, and reuse embeddings for unchanged content.
- Treat renames consistently and invalidate relevant cache data when file selection
  or embedding configuration changes.
- Make indexed code/wiki information usable for code questions from Codex CLI and
  Claude CLI through MCP. Multi-repository questions should preserve source citations.
- Configure generation provider, model ID and API key in `.env`.
- Support the user's Cline account/API key for generation and allow model choice.
- Configure embeddings independently; Cline chat-completions support does not imply
  that it supplies the embedding endpoint needed by the indexing pipeline.
- Keep secrets out of tracked files, logs, plan output and shared examples. Do not
  store an actual API key in this document.
- Do not overwrite unrelated development changes or modify indexed source trees.

## Current .env interface

```dotenv
DEEPWIKI_SCAN_ROOT=/home/ofer_g/projects/ETX_VSC/etxa_devops
DEEPWIKI_SCAN_FOLDERS='["etx_makebuild", "etx_dnfv/etx_dnfv_mng_plane", "etx_unitedbuild"]'
DEEPWIKI_PROVIDER=cline
CLINE_BASE_URL=https://api.cline.bot/api/v1
CLINE_API_KEY=
CLINE_MODEL=
DEEPWIKI_EMBEDDER_TYPE=google
GOOGLE_EMBEDDING_MODEL=gemini-embedding-001
GOOGLE_API_KEY=
```

The key and model fields were added blank for the user to fill locally. Current
values have not been inspected for this plan. The actual `.env` is ignored by Git;
`headless.env.example` contains shareable configuration. Exported environment
variables override the file. The existing embedding-provider settings remain
separate, for example `DEEPWIKI_EMBEDDER_TYPE` and provider-specific credentials.

## Architecture inspected

- `api/repository.py`: local source paths and remote cloning.
- `api/config.py`: file selection, model/provider configuration and embeddings.
- `api/rag/pipeline.py`: document reading, chunking, embedding and LocalDB persistence.
- `api/rag/rag.py`: retrieval on top of the persisted documents.
- `api/services/research.py` and `api/routers/repo.py`: existing HTTP entry points.

Existing cache reuse does not detect source changes. Reusing an index is not
incremental reindexing.

## Implemented so far (uncommitted)

- [x] Connect over SSH, verify the checkout/branch, and inspect indexing architecture.
- [x] Add `api/headless.py`: explicit local-root configuration, dependency-free plan
  mode, sequential indexing through the existing DatabaseManager, and JSON results.
- [x] Read scan scope from `.env`, including an alternate `--env-file`; retain an
  explicit JSON manifest option for per-root filters.
- [x] Validate selected roots, reject overlaps and paths escaping the configured
  source base, and keep cache storage outside source roots.
- [x] Give each configured root separate cache storage based on identity and filters.
- [x] Add optional storage-root support to DatabaseManager while preserving API defaults.
- [x] Skip symlinked files that resolve outside the selected document-reading root.
- [x] Add a Cline generation client and streamer, model configuration, and environment
  provider defaults for backend requests.
- [x] Load the selected .env before importing the headless embedding pipeline.
- [x] Add operating instructions and configuration examples.
- [x] Run 22 focused tests using mock provider/dependency boundaries; syntax and
  whitespace checks pass. No paid or authenticated model calls were made.

These changes are present on the remote branch's working tree. New files are
untracked and edits to existing files are unstaged; no commit or push has been made.

## Not yet implemented or validated

- [x] Backend dependencies installed; real Google embedding and synthetic indexing/cache-reload smoke tests pass. Full ETX indexing remains pending.
- [x] Live authentication/model validation using a synthetic prompt with no private
  source excerpts; real source-grounded answer/wiki validation remains pending.
- [x] File-state manifest and content hashes for incremental indexing.
- [x] Changed-file-only embedding updates, deletion/rename cleanup and explicit cache reconciliation
  when the embedding provider/model changes.
- [x] Coordinated retrieval across the configured indexes with source provenance.
- [ ] Headless question answering and wiki generation/output lifecycle.
- [ ] MCP server and Codex CLI/Claude CLI connection instructions.
- [ ] End-to-end tests covering real indexing, incremental updates and MCP questions.

The current headless command builds/reuses per-root indexes only. It does not yet
provide incremental updates, wiki generation, cross-repository questions or MCP.
Cline generation settings are wired into backend generation; the headless index
command itself does not call the generation model.

## Next implementation steps

1. Verify backend runtime dependencies and embedding configuration. Confirm file
   selection handles the actual ETX sources, including build scripts and Makefiles,
   while respecting the three-folder scope. Validate one small indexing run.
2. Persist a per-root file inventory with content hashes, chunk ownership, embedding
   configuration identity and Git revision metadata where applicable.
3. Add a manual update command that computes added/changed/deleted/renamed files,
   embeds only changed content, removes obsolete chunks and publishes a consistent
   index. An unchanged run must issue no embedding calls.
4. Add repository-aware retrieval and a headless question command, with paths,
   repository IDs and line citations in results. Connect the configured Cline model
   for answer generation and define how wiki artifacts are generated and refreshed.
5. Expose supported operations through MCP and document setup for Codex CLI and
   Claude CLI. Validate a question requiring context from more than one source root.

## Acceptance checks

- Changing only `.env` changes the selected source folders and generation model.
- Plan output identifies exactly the selected roots and contains no credentials.
- No source outside the selected roots is indexed, including via symlinks.
- Identical file names from different roots retain separate identities and citations.
- A manual update after one file changes reprocesses only that file; an unchanged
  update makes no embedding calls. Deleted content no longer appears in retrieval.
- An indexing failure does not corrupt the last valid index.
- A CLI client can connect over MCP and ask a source-grounded multi-repository question.
- Existing web API behavior and unrelated working-tree changes remain intact.

## Latest setup progress

- Backend runtime dependencies are installed in the checkout's isolated `.venv`.
- The initial real Cline initialization check exposed an incompatibility with the
  installed AdalFlow OpenAI adapter. The Cline adapter was changed to call Chat
  Completions directly; live validation and updated client tests remain to finish.
- The user selected hosted Google embeddings. `.env` now selects `google` and
  `gemini-embedding-001`; `GOOGLE_API_KEY` is ready for the user to populate.
- `GOOGLE_EMBEDDING_MODEL` overrides the Google model without modifying JSON.
- No Google embedding/indexing run has been validated yet.

## Google validation completed

- `GOOGLE_API_KEY` is present; its value was not displayed.
- A real `gemini-embedding-001` request succeeded with 3072-dimensional output.
- A tiny synthetic Python source file was indexed, embedded and persisted through
  the existing DatabaseManager. Reloading the saved index issued no embedding call.
- The temporary fixture needed explicit file inclusion because the existing default
  filters exclude `/tmp/`; no ETX source content was used in these smoke tests.
- Full ETX indexing, changed-file updates and MCP remain pending.

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

## Initial full indexing started

- The user confirmed this is the first index and requested a full source scan now.
- Final allowed types: C `.c`/`.h`, Python `.py`, shell `.sh`, make fragments `.mk`
  and configured Makefile names. XML, other data/document types and binary artifacts
  are excluded by the `.env` allowlist.
- First inventory: 10,318 selected paths in etx_makebuild, 607 in etx_dnfv_mng_plane,
  and 7 in etx_unitedbuild. Files resolving outside their selected roots are excluded.
- Initial legacy reader runs exposed size/encoding omissions. A new bounded full-source
  builder now handles those cases and persists validated parts with progress manifests.
- A checkpointed first full run has been launched; runtime status and logs are in
  `.venv/initial-index/`. Do not equate process startup with completion; verify every
  root is ready and reconcile selected/indexed/skipped counts before claiming success.
- 30 focused tests pass, including allowlist, persistence, restart reuse and failed-part
  publication tests. Full-source embedding calls are now authorized for these scopes.

## Google quota pacing

The first full run completed all 7 etx_unitedbuild files and all 607
etx_dnfv_mng_plane files with no skips. Google returned HTTP 429 while indexing
etx_makebuild. The run was resumed using its saved parts after configuring
`GOOGLE_EMBEDDING_MIN_INTERVAL_SECONDS=10`. Google calls share that pacing across
parts and retry with backoff for up to five minutes per failed batch. The large
root is still in progress; consult `.venv/initial-index/status.json` for its actual
state before reporting completion. No key or source folder was changed.

## Later phase: code-aware retrieval alongside embeddings

Requested by the user on 2026-10-21. This is deferred work after the initial
indexing and basic retrieval/MCP workflow; it does not change the running index.

### Purpose

Embedding similarity helps discover relevant code, but it does not establish
program behavior, symbol resolution or build dependencies. Combine semantic
retrieval with exact source search and structural information so answers can
follow code relationships rather than rely only on similar-looking chunks.

### Planned capabilities

- [x] Add exact identifier and keyword search across the same configured source
  roots, with repository ID, file path and line ranges on every result.
- [ ] Index definitions and references for C functions, types, globals and macros;
  Python functions/classes/imports; and shell functions and script references.
- [ ] Prefer function/class-aware chunks, keeping their symbol identity and source
  spans. Split oversized definitions into linked chunks rather than losing context.
- [ ] Capture C include relationships and caller/callee relationships. Distinguish
  parser-derived references from compiler-resolved calls and indirect calls.
- [ ] Account for C preprocessor macros, conditional compilation and build variants.
  Consider compile_commands.json/Clang information when available; do not execute
  project builds or assume a build configuration just to infer relationships.
- [ ] Capture Makefile targets, prerequisites, included make fragments, relevant
  variables and links to source/scripts. Mark dependencies involving dynamic
  expansion or shell commands as unresolved unless verified; do not execute them
  during indexing. Track Python imports and shell-script invocations where resolvable.
- [ ] Combine exact/symbol and semantic results, merge duplicates, and expand useful
  results with definitions, callers/callees, includes or build dependencies. Keep
  context bounded and preserve source citations, including cross-repository links.
- [x] Expose these searches and relationship lookups through the headless/MCP
  interface so Codex CLI and Claude CLI can request evidence explicitly.
- [x] Persist structural metadata with file identities/content hashes so later
  manual updates can refresh changed relationships and remove deleted references.

### Acceptance checks

- An exact symbol query finds its definition even when semantic ranking misses it.
- A call-chain question provides cited definitions and calls, and flags unresolved
  function pointers or conditional/macro-dependent behavior rather than guessing.
- A build question links a Makefile target to evidenced prerequisites and scripts
  without running make or shell commands during indexing.
- Semantic discovery still works for natural-language questions without exact names.
- Same-named symbols in different roots or build variants remain distinguishable.
- Changing/deleting a source file refreshes/removes its symbol and relationship data.
- All extraction stays within the existing .env directory and file-type allowlists.

## Next required implementation: commit-based forward reindexing

Requested on 2026-10-21: once the initial full index is verified complete,
continue implementing the plan automatically. Prioritize commit-based updates,
then cross-repository retrieval, headless questions/wiki output and MCP. Keep the
later code-aware retrieval phase in the implementation backlog as documented above.

### Command and durable state

- [ ] Add `python -m api.headless --reindex` to update all configured repositories
  from their last successfully indexed commits to their current checked-out HEADs.
  Process the entire forward range, not only HEAD's last commit and not an arbitrary
  fixed number of recent commits. Do not fetch, pull or change source checkouts.
- [ ] Persist a versioned state file alongside each index, outside source trees and
  Git-tracked configuration. Record canonical Git roots/repository identities, scope
  mappings, last successfully indexed full commit SHA, index generation/manifest,
  file content hashes, model/chunking/selection identity, and completion timestamp.
- [ ] Track nested repositories independently. Resolve containing-repository paths
  such as etx_unitedbuild while limiting changed paths to the configured scan scope.
- [ ] Establish the initial baseline from verified indexed content. The first full
  run did not record an initial commit snapshot: do not label its mixed-time working
  tree reads as current HEAD without reconciling source hashes/changes. Preserve
  pending dirty/untracked content explicitly so it cannot be silently missed later.

### Update behavior and consistency

- [ ] Verify the saved commit exists and is an ancestor of the target commit, then
  use Git's changed-path information over that range. Re-embed only added/modified
  eligible files, remove obsolete chunks for deleted files, and handle renames.
- [ ] Unchanged roots/files must reuse their existing embeddings. A run with no new
  eligible changes must perform zero embedding calls and report that outcome.
- [ ] If only out-of-scope files changed, advance the repository checkpoint after
  verifying no in-scope index work is needed. Apply the current .env root/type filters.
- [ ] Handle local uncommitted/untracked source changes deliberately, with persisted
  hashes or an explicit reported policy; a commit watermark alone cannot track them.
- [ ] Save index changes and the corresponding watermark as a consistent new
  generation. Advance only after all work for that repository succeeds; failures,
  quota limits or interruptions leave its previous valid index/checkpoint usable.
- [ ] On retry, reuse successfully written embeddings/checkpoints. Do not rerun full
  indexing just because an update failed, and do not overwrite unrelated changes.
- [ ] If history diverges, a baseline commit is unavailable, a repository is newly
  added, or embedding/selection identity changes, explain the required reconciliation
  or targeted rebuild explicitly; never silently skip history or rebuild all roots.

### Tests and acceptance

- An initial baseline is linked to the actual saved content and repository scope.
- Two or more commits after that baseline update all affected eligible paths;
  untouched files cause no embedding requests.
- Deletions and renames remove stale search results. Same-named files in nested
  or separate repositories keep distinct identities.
- Failure/interruption preserves the previous commit watermark and usable index.
- A no-change run has zero embedding calls; out-of-scope changes are not indexed.
- Dirty worktrees, merges, rewound/diverged history, filter/model changes and
  independently advancing nested repositories have explicit tested behavior.
- The CLI reports per-repository from/to commits and changed/indexed/deleted counts.

## Verified initial index completion (2026-10-21)

All three final manifests are ready, with selected/indexed counts reconciled,
no skipped files, and every referenced saved part present and nonempty:

| Root | Files | Chunks | Parts |
| --- | ---: | ---: | ---: |
| etx_makebuild | 10,318 | 118,795 | 246 |
| etx_dnfv_mng_plane | 607 | 1,150 | 13 |
| etx_unitedbuild | 7 | 46 | 1 |
| Total | 10,932 | 119,991 | 260 |

Commit-based reindexing implementation has started. Baseline adoption must reconcile
persisted source hashes against the current scoped working trees before assigning
commit watermarks. Stored vector/file validation will be performed during adoption.

## Commit-based reindexing implemented (2026-10-21)

- Added `python -m api.headless --reindex` across all configured roots.
- Added versioned active `state.json` and immutable generations containing per-file
  content hashes/part ownership and separate full Git SHAs for nested/containing repos.
- Initial baseline adoption reconciles saved source content and validates vectors/
  manifest counts; changed files only are reconciled before checkpoints are published.
- Forward ranges, dirty/untracked changes, deletions and renames are handled; identical
  content/renames reuse vectors, and unchanged updates make zero embedding calls.
- History divergence/configuration/boundary changes fail explicitly without silently
  rebuilding. Files/HEADs are checked again before atomic publication. Failure preserves
  the previous state. An advisory lock prevents concurrent updates to a source root.
- Real ETX baselines were adopted with zero files needing new embeddings. Checkpoints
  cover three Git repos under makebuild, the management-plane repo and the containing
  etxa_devops repo for unitedbuild. Two existing dirty source files are represented
  explicitly in state; source trees were not modified.
- Next implementation milestone: multi-repository retrieval and headless questions,
  then MCP/client configuration and the deferred structural retrieval phase.

## Retrieval and MCP milestone (2026-10-21)

- Cross-root semantic search is implemented with generation-keyed FAISS and SQLite
  caches built solely from saved vectors. A real Google query returned line-cited
  evidence from two configured source roots; no repository re-embedding was needed.
- Added `--query`, `--ask` and `--top-k` to the headless command. Offline answer tests
  verify evidence inclusion and citation output. Real Qwen answer validation is
  pending explicit approval to export retrieved source excerpts to Cline.
- Automatic approval review rejected that real answer test because destination-
  specific private-source export approval was missing. The request is pending in
  chat. `DEEPWIKI_ALLOW_SOURCE_EXCERPTS=false` gates server-side generation calls.
- Added stdio MCP server and tested tool discovery, real status and real source
  search through the official MCP client on the remote server. No source was sent
  to a generation provider during these tests. CLI client registration and hosted
  generation validation remain to verify.
- Tools: list_repositories, search_code, ask_code, reindex_repositories. SSH client
  setup is documented in HEADLESS.md. Server secrets stay in the remote .env.
- Remaining: approved real answer test, headless wiki artifact lifecycle, and the
  later hybrid exact-symbol/structural retrieval phase. Preserve user approvals
  and update this status as each is implemented and verified.

## Wiki lifecycle implemented (2026-10-21)

- Added repeatable `--wiki TOPIC` and `--wiki-output` for cited Markdown topic pages,
  an index page and model/source-generation provenance manifests.
- Pages use bounded retrieved evidence; this does not claim exhaustive repository
  wiki coverage. Missing/out-of-range citations prevent publication.
- New generations publish atomically only after all topics succeed and source
  index generations are unchanged. Model failure preserves the previous wiki.
- MCP now also exposes list_wiki_pages, get_wiki_page and generate_wiki_pages.
  Existing page reads have no model call and report stale source-index generations.
- Artifact reads/writes are bounded to wiki output and cannot overwrite source trees.
- Nine new wiki lifecycle tests plus the existing suite pass (60 tests total).
- Source-export approval is still pending. Do not enable the export flag or run
  real private-source generation in response to an automated wakeup alone. No new
  approval question is needed until the human answers the existing request.
- Independent next work: exact-symbol/keyword retrieval and structural source
  metadata, following the already requested later-phase acceptance criteria.

## Local structural and hybrid retrieval implemented (2026-10-21)

- Added generation-bound SQLite/FTS metadata from the saved source snapshots,
  including exact definitions and C include/call/conditional syntax, Python AST
  definitions/calls/imports, and heuristic shell/Makefile evidence. Local lookup
  does not initialize generation clients or make embedding calls.
- Added --symbol, --keyword, --relations and --hybrid, plus MCP find_symbol,
  search_exact and find_relations. MCP search_code and headless answers use hybrid
  retrieval with exact identifiers, semantic evidence, overlap deduplication and
  bounded definition context. Oversized definitions retain spans/truncation data.
- Saved-part reads now bypass restoration of old model/transformer objects. This
  fixes standalone reads of previously persisted custom embedding pipelines.
- Unchanged structural entries are copied to the next cache generation; only
  changed file hashes are reparsed, deleted symbols/edges/FTS entries are removed.
  Interrupted compilation cannot publish a ready generation. Offline regressions
  cover failed publication, snapshots, duplicates, case matching and hybrid fusion.
- Parser compatibility: tree-sitter 0.26.0 crashed on real C input. The implementation
  pins >=0.25.2,<0.26 and was validated using 0.25.2 with tree-sitter-c 0.24.2.
- Still remaining: compiler/include-path resolution and build-variant-specific
  identities, richer cross-file relationship traversal, and syntax-aware embedding
  chunk creation with linked oversized definitions. Current hybrid context expansion
  reuses the existing embeddings and does not claim these later capabilities.
- Real Cline answer/wiki validation still awaits the pending explicit source-export
  approval. Keep DEEPWIKI_ALLOW_SOURCE_EXCERPTS=false until the human responds.

### Verified structural corpus and interfaces

| Root | Saved files | Syntax/heuristic symbols | Relationship evidence |
|---|---:|---:|---:|
| etx_makebuild-b717bf09 | 10,318 | 785,595 | 778,779 |
| etx_dnfv_etx_dnfv_mng_plane-02c5f61f | 607 | 4,335 | 26,837 |
| etx_unitedbuild-14f8bea8 | 7 | 68 | 318 |

- All 10,932 saved files are represented; caches use the same three active index
  generations as the reconciled full index. Counts describe syntax/heuristic
  evidence, not compiler-resolved unique symbols or runtime relationships.
- Real --symbol CLI and stdio MCP find_symbol/search_exact/find_relations passed.
  Private excerpts stayed on the remote server during these checks.
- 74 focused tests and 7 existing configuration/RAG compatibility tests pass; Python
  compilation and git diff --check pass. No source trees or API keys were changed.
- Next independent work: improve bounded cross-file relationship traversal and
  context retrieval; leave compiler/build-variant resolution explicitly unresolved
  until supported by verified in-scope build metadata. Syntax-aware embedding
  chunk migration needs a deliberate compatibility/cost plan before any rebuild.

## Bounded cross-file context and definition windows (2026-10-21)

- Added --context NAME with depth 1–3 and a shared evidence-item budget, plus MCP
  trace_relationships. Calls and Make prerequisites lead to cited candidate
  definitions across configured roots. Includes and script references can lead to
  indexed-path spelling candidates; all links remain explicitly unresolved.
- Caller definition candidates are scoped to the observed source file. Same-named
  callees in other roots remain separate candidates. Per-name caps prevent a common
  symbol from consuming the entire budget; cycles/repeated names are bounded and
  omitted evidence is flagged. Qualified lexical Python definitions are supported.
- Added --definition and MCP read_definition for linked source windows using
  repository/path/name/definition-line identity. Next/previous line links and an
  optional index-generation check prevent accidental stale continuation. Source
  comes from saved snapshots; arbitrary filesystem reads are not exposed.
- Definition/exact excerpts are capped at 24,000 characters as well as line limits;
  relationship-context output has a shared 48,000-character text budget. Oversized
  lines, truncated definitions and unresolved complex indirect-call syntax are
  explicit. Embeddings were neither regenerated nor re-chunked.
- Real command-line and stdio MCP context/definition reads passed against the ETX
  indexes, including a 16-item traversal budget and a 12-line definition window.
  Private excerpts stayed on the server during these tests.
- 87 focused tests and 7 existing configuration/RAG tests pass. Coverage includes
  cross-root ambiguity, Make/script evidence without execution, root selection,
  cyclic/depth/item/text bounds, deletion refresh, full-definition paging, stale
  generations and CLI routing that must not fall through to semantic/model calls.
- Cline authentication and the configured model were validated with a synthetic
  connectivity prompt containing no repository source. The streamed response was
  nonempty. No keys or response content were copied into this plan. Result metadata
  is saved in .venv/initial-index/cline-connectivity.json on the server.
- The pending source-export approval still governs real source-grounded Cline
  answers/wiki. Keep the export flag false until an explicit human approval arrives.
- Next independent implementation step: incorporate bounded relationship evidence
  into hybrid answer contexts. Compiler/include-path/build-variant resolution and
  syntax-aware embedding chunk migration remain explicit later work; do not silently
  rebuild the complete indexes or execute source builds to obtain this information.

## Relationship evidence integrated into hybrid retrieval (2026-10-21)

- Hybrid retrieval now enriches exact/semantic matches with bounded one-hop
  call/build evidence. It can derive seed names from semantically retrieved
  definitions even when the question contains no exact identifier.
- Relationship metadata retains evidence citations, quality and unresolved
  name/path candidate links. A bounded fraction of result slots can contain
  linked definitions/files from other selected roots. Primary evidence and
  same-named cross-root candidates remain distinguishable; overlap is suppressed.
- Total returned source text is capped at 48,000 characters and empty citations
  caused by exhausted budgets are omitted. Output/model prompts retain truncation
  and uncertainty, and never claim compiler resolution or proven dispatch.
- Active index generations are compared before/after retrieval. Concurrent
  publication produces an explicit retry error before the generation model runs.
- Read-only SQLite handles now close explicitly; the new integration tests exposed
  unclosed connections in the earlier context-manager usage and this is fixed.
- Real CLI --hybrid main returned six cited sources with three attached relationship
  evidence records (456 source-text characters). Real stdio MCP search_code passed
  with the enriched retrieval. Saved vectors were reused; only synthetic query text
  was embedded. Repository excerpts stayed on the remote server during validation.
- 94 focused tests and 7 existing configuration/RAG tests pass. New tests cover
  linked cross-root callees, natural-language seed discovery, small budgets,
  deletion refresh, generation races, text caps and offline prompt uncertainty.
- HEADLESS.md documents the new behavior. The pending Cline private-source export
  approval remains unchanged; synthetic connectivity is already verified.
- Next independent work: retain conditional-compilation context on C definitions
  and relationship evidence, with explicit unselected build variants. Plan syntax-
  aware embedding chunks/version migration before any expensive rebuild. Compiler
  and include-path resolution require suitable authorized metadata; do not execute
  source builds or broaden the configured scan types to obtain it.

## Conditional-compilation evidence implemented (2026-10-21)

- C/header results now retain nested preprocessor guard spans, directive lines,
  branch spelling and excluded prior conditions for elif/else alternatives.
  Every result explicitly leaves the build variant unselected; macros and branch
  expressions are not evaluated and compiler resolution is not claimed.
- A covering guard is distinct from a guard merely overlapping a definition or
  excerpt. This avoids claiming that an entire function is conditionally present
  when only a call inside its body is guarded. Opposite-branch definitions keep
  separate source identities and guard context.
- Metadata propagates through symbol/relationship queries, linked definition
  windows, include-path candidates, hybrid results/candidate references and
  generation prompts. Errors and bounded/truncated guard lists are explicit.
- Lazy content/parser-version caches are built from saved source snapshots, outside
  source trees. Unchanged hashes reuse metadata; changed files refresh after
  reindex. Embedding generations and the full source scan were not rebuilt.
- Real saved makebuild guarded definitions passed a local check with embedding
  calls explicitly forbidden. The sample check inspected conditional candidates
  in the management-plane cache but did not verify a guarded definition there;
  unitedbuild had no sampled C conditional candidates. This is not an exhaustive
  compiler/build-variant validation.
- Real CLI context/definition/hybrid and stdio MCP trace_relationships,
  read_definition and search_code checks still pass. Hybrid smoke: six sources,
  three relationship records, 456 source-text characters. Only question text was
  embedded during hybrid tests; no private repository excerpts went to Cline.
- 105 focused tests and 7 existing configuration/RAG tests pass; syntax/whitespace
  checks pass. Coverage includes nested/alternative branches, ifndef, unevaluated
  zero conditions, comments/strings, multiline directives, incomplete syntax,
  snapshot/cache reuse, internal branches, bounded metadata and offline prompts.
- Cline private-source approval remains pending; keep the export flag disabled.

### Next: syntax-aware embedding migration design

- Keep the current token-split index compatible by default. Syntax-aware embedding
  chunks should be an explicit opt-in strategy whose version participates in the
  embedding/index configuration identity; never reinterpret old saved vectors as
  newly chunked source or silently rebuild all roots.
- Prefer complete C functions and Python functions/classes when they fit the
  existing embedding token budget. Split oversized spans into linked pieces with
  stable definition identity, full span, piece order and exact source lines. Keep
  uncovered declarations/build/script regions and every eligible source line.
- Validate coverage, token limits, nesting/overlap, malformed syntax fallback,
  guard metadata and changed-file-only updates with offline embeddings first.
- Document an explicit initial-index/migration operation for selected roots and
  estimate selected file/chunk counts before any paid re-embedding. Preserve the
  previous usable generation until the new strategy finishes successfully.
- Compiler/include-path resolution and active build variants still require suitable
  authorized metadata. Do not run builds or widen the scan allowlist to obtain it.

## Optional syntax-aware chunks implemented offline (2026-10-21)

- Added explicit DEEPWIKI_CHUNK_STRATEGY=token|syntax-v1 and a per-command
  --chunk-strategy override. Token remains the default and retains its exact index
  identity. Syntax strategy/parser versions select a separate embedding index.
  The real .env was not changed and no paid migration has been started.
- Syntax chunks prefer whole C functions and Python functions/classes, including
  decorators. Oversized definitions have stable identities, exact source offsets,
  line spans, piece order/count and previous/next links. Nested symbol spans and C
  guard metadata are retained. Malformed syntax and Make/shell source fall back to
  labelled token windows. Every source character remains covered, with bounded
  token overlap and Unicode-safe character offsets.
- Headless documents explicitly request the strategy; web/default documents keep
  the existing splitter. Changed-file reindexing and baseline reconciliation use
  the selected strategy. Same-language renames regenerate path-based identities
  while reusing vectors; parser-language changes require new chunking.
- Added --estimate-chunks: selected/read/skipped counts, planned chunks and cl100k
  token estimates, without embedding initialization or index writes. HEADLESS.md
  documents deliberate build/adopt/switch steps and rollback to retained token
  indexes. Do not switch the shared .env until all new indexes are ready.
- 116 focused tests and 7 existing configuration/RAG tests pass; Python compilation
  and git diff --check pass. New tests cover full source/Unicode coverage, budgets,
  linked/stable IDs, decorators/nesting, fallback, guards, opt-in identity, dry-run
  CLI routing, real offline pipeline operation, updates and vector-reusing renames.

### Running syntax estimate: monitor before further migration work

- A no-embedding estimate is actively running on the server. Script:
  .venv/initial-index/syntax-estimate.py; verified PID 38705 belongs to that script.
  Status: .venv/initial-index/syntax-estimate-status.json.
  Log: .venv/initial-index/syntax-estimate.log. Do not restart or duplicate it while
  the process is live. The original full embedding index is already complete.
- Latest sample: makebuild 4,250/10,318 files estimated, 50,883 planned chunks so far.
  Completed management-plane estimate: 607 files, 5,860 chunks, 746,535 estimated
  embedding tokens. Completed unitedbuild: 7 files, 82 chunks, 42,149 tokens.
  These are syntax-strategy estimates, not new embeddings or newly published indexes.
- The script blocks embedding-client initialization and checks legacy checkpoint
  hashes at completion. On the next wakeup, inspect its status first and verify its
  process before any intervention. Reconcile selected/read/skipped counts and the
  checkpoint-unchanged result before reporting the complete estimate.
- Next: finish and report this estimate, review vector-count/token tradeoffs and
  audit repeated-content/rename edge cases before any deliberate paid migration.
  Do not silently launch a full rebuild or change the current .env strategy.
- Private-source Cline answer/wiki validation still awaits the pending explicit
  human approval. Synthetic Cline authentication has already passed. Keep the
  source-export flag false; automated wakeups are not consent to change it.

## Syntax migration audit corrections (2026-10-21)

- Fixed repeated-content reuse catalogs to include parser language for syntax
  indexes. Identical bytes in a Python and C file can no longer hide compatible
  C vectors during a rename/copy. Copied/renamed definitions and pieces keep
  distinct path-based identities without embedding calls.
- A synthetic regression exposed excessive overlap after a short window preceding
  a long source line: a 1,929-character fixture generated 331 chunks, 316 of them
  short repeats. Windows already shorter than the requested overlap now advance
  to the next source region, preserving exact coverage and bounded overlap.
- The initial no-embedding estimate was stopped only after verifying its exact
  PID/command/workspace. Its partial numbers are superseded and must not be used
  for migration decisions. Snapshot metadata is retained in
  .venv/initial-index/syntax-estimate-superseded.json with estimate_valid=false.
- The corrected free estimate has restarted as PID 49361, using the same
  syntax-estimate.py, syntax-estimate-status.json and syntax-estimate.log paths.
  Status now records its PID and legacy checkpoint hashes. Both embedding factories
  are blocked. Check the status first on the next wakeup; do not start a duplicate.
- All three current legacy checkpoint hashes still match the estimate's baseline.
  The completed original embedding index and source trees were not changed. The
  shared .env remains on its existing strategy; no paid migration was launched.
- 118 focused tests and 7 existing configuration/RAG tests pass; compilation and
  git diff --check pass. New regressions cover identical content across parser
  languages, vector reuse and identity uniqueness, and pathological overlap.
- Next: finish the corrected estimate, reconcile all selected/read/skipped counts,
  confirm the final checkpoint-unchanged result and report the new vector/token
  totals. Only then assess whether an optional migration is useful; do not silently
  rebuild or switch strategy. Private-source Cline validation still awaits consent.

### Corrected estimate monitoring update

- Corrected syntax estimate remains active as PID 49361. Latest
  makebuild progress: 6750/10318 selected files; 91791 planned
  chunks so far. Both smaller-root estimates are complete. These remain partial
  no-embedding estimates, not replacement indexes.
- All three active legacy checkpoint hashes were verified unchanged. No restart,
  strategy switch or paid embedding operation was performed during this check.
- Continue monitoring the existing process; reconcile final counts only when the
  status reports complete and legacy_checkpoints_unchanged is true.

## Corrected syntax estimate complete and reconciled (2026-10-21)

| Root | Selected/read files | Planned syntax chunks | Estimated cl100k tokens |
|---|---:|---:|---:|
| etx_dnfv_etx_dnfv_mng_plane-02c5f61f | 607 | 5,789 | 736,965 |
| etx_makebuild-b717bf09 | 10,318 | 151,207 | 113,245,519 |
| etx_unitedbuild-14f8bea8 | 7 | 82 | 42,149 |
| Total | 10,932 | 157,078 | 114,024,633 |

- All three selected/read counts match the existing ready manifests and active
  state inventories: 10,932 files, no skipped files. Every active saved-part path
  exists. All three checkpoint hashes remain unchanged, and the estimate confirms
  zero embedding calls. The estimate process has exited normally.
- The optional syntax strategy plans 157,078 vectors versus 119,991 in the current
  token index: 37,087 additional vectors (+30.91%). This is a complete new-strategy
  estimate, not a count of added/changed source files. Token counts are cl100k
  estimates, not provider billing measurements or prices.
- No migration has been performed. Current token indexes remain usable, including
  function-context expansion, exact/relationship search and MCP. HEADLESS.md already
  documents explicit migration/rollback; do not automatically switch .env or launch
  new source embedding work based on an automated wakeup.
- Verified summary: .venv/initial-index/syntax-estimate-verified.json. Full corrected
  results: syntax-estimate-status.json. Earlier pre-overlap-fix partial numbers are
  superseded and must not be compared as final results.
- Implementation/tests remain at the verified 118 focused plus 7 existing
  compatibility tests. This monitoring/reconciliation step changed documentation
  and result metadata only; no source checkout or active index was modified.
- Next required validation remains source-grounded Cline answers/wiki and actual
  external CLI client use. Synthetic Cline connectivity and local stdio MCP passed.
  The pending private-source export question requires an explicit human answer;
  automated wakeups do not grant it. Keep the export flag disabled. Compiler/build-
  variant resolution remains outside current verified capabilities without suitable
  authorized metadata; do not run builds or widen source scanning to infer it.

## Human approval received (2026-10-22)

- The user explicitly approved sending retrieved excerpts from the three configured
  source folders to https://api.cline.bot/api/v1 using the selected Qwen model for
  codeWiki answers. The source-export flag is now true after verifying the current
  provider, endpoint and Qwen selection. Earlier pending-approval notes are historical.
- Continue real cited-answer validation and the previously requested wiki workflow.
  This approval does not authorize arbitrary destinations or a source re-embedding
  migration. Preserve the current token index and existing scan allowlist.

## Approved real answer validation complete (2026-10-22)

- Explicit human permission now authorizes sending retrieved source excerpts to
  https://api.cline.bot/api/v1 using the selected Qwen model for codeWiki answers.
  DEEPWIKI_ALLOW_SOURCE_EXCERPTS=true was set atomically, preserving other values
  and .env permissions. Earlier pending-answer-approval entries are historical.
- A real CLI answer returned valid source citations but initially favored makebuild.
  Broad repository questions now retain per-root candidates/representatives before
  context expansion; two new regressions protect smaller-root evidence.
- A second real CLI answer cited all three roots: Makefile SUBDIRS declarations,
  management-plane compile.sh commands and unitedbuild shell instructions. It
  distinguished printed instructions from executed commands and left unresolved
  Make expansion/cross-file dispatch explicit. Artifact on the server:
  .venv/initial-index/answer-live-balanced.json.
- A real stdio MCP ask_code request completed through Qwen with the unitedbuild
  repository filter. All returned sources were within that root; three cited
  excerpts were returned. Saved result: answer-mcp-live.json in the same directory.
- Citation validation now supports comma-grouped references, rejects invalid source
  numbers and ignores numeric code-array examples. This validates reference bounds,
  not semantic entailment of every model statement.
- 126 focused tests and 7 existing configuration/RAG tests pass. Source inventories,
  token-index generations and the optional syntax migration remain unchanged.

### Separate wiki permission pending

- Automatic approval review rejected the attempted real wiki-generation test:
  explicit approval covered cited answers only; wiki-purpose source egress needs
  separate authorization. The rejected command did not run and no wiki source
  excerpts were sent. A separate permission question is pending in chat.
- Added DEEPWIKI_ALLOW_WIKI_SOURCE_EXCERPTS=false and a distinct runtime gate.
  Wiki generation now requires both answer and wiki export flags. An offline
  regression verifies that answer approval cannot enable wiki source exports.
- Continue real wiki generation only after a human approves that purpose. Do not
  infer permission from heartbeats or work around the rejection using answer calls.
- Actual Codex/Claude CLI registration remains separate from the verified MCP
  stdio transport. No unrelated client settings were overwritten.

## Human-approved wiki generation verified (2026-10-22)

- The human explicitly approved wiki-purpose source excerpts from the same three
  configured folders to https://api.cline.bot/api/v1 with the selected Qwen model.
  DEEPWIKI_ALLOW_WIKI_SOURCE_EXCERPTS=true was enabled atomically after verifying
  provider, endpoint and model; previous pending-wiki notes are historical.
- Real MCP generate_wiki_pages succeeded. Broad topics initially retrieved incidental
  files; explicit quoted filename lookup now queries only active saved source paths
  and basenames. Per-filename round-robin ordering keeps common Makefiles from
  crowding out named scripts. Three new regressions cover this behavior and missing
  files. No source trees, source index generations or source embeddings were changed.
- Final topic covers Makefile/SUBDIRS, management compile.sh and unitedbuild
  etx_vsc_env.sh, with eight references across all three roots. It distinguishes
  observed sub-make/commands from unresolved targets.mak and caller-directory behavior.
- Real MCP list_wiki_pages/get_wiki_page readback passed: all citations in bounds,
  all three roots present, explicit scripts and Makefiles present, stale=false.
  Current wiki generation: 8b6005019e4143f3be31ac2778a6d829.
  Results: .venv/initial-index/wiki-mcp-live.json and wiki-mcp-readback.json.
- 129 focused tests and 7 existing compatibility tests pass; git diff --check passes.
- Actual Codex/Claude CLI registration is still not performed; setup commands are
  documented. Compiler/build-variant resolution still needs suitable authorized
  metadata; do not run builds or broaden the scan allowlist. Optional syntax-based
  source re-embedding migration has not been launched.

## Requested compiler analysis and syntax migration (2026-10-22)

The user explicitly requested compiler-aware call resolution/active build variants
and migration of existing indexes to syntax-v1. Resumable background migration:
.venv/syntax-migration/run.py, status.json, pid, run.log. Inspect status before
restarting; verify PID belongs to this runner. Retain all token indexes. The runner
switches shared .env only after all replacement manifests and Git checkpoints are
ready and reconciled. Continue monitoring this job on automated wakeups. Compiler
metadata investigation follows united_build.sh and configure without executing them.

## Syntax migration paused for clarification (2026-10-22)

User said wait and asked why re-chunking was needed. Verified migration PID/command/cwd and sent SIGSTOP, preserving saved progress and existing token indexes. Do not resume migration or switch strategies on heartbeat wakeups; await explicit human direction. Syntax migration is optional, unlike compiler analysis.

## Syntax migration resumed with human authorization (2026-10-22)

The user explicitly said to continue. Verified the existing migration PID/command/cwd and sent SIGCONT; do not launch a duplicate. Continue monitoring .venv/syntax-migration/status.json. Earlier pause instruction is superseded.

## Compiler analysis implementation and live validation (2026-10-22)

- Added api/compiler_analysis.py with libclang 18.1.1, locked in API dependencies.
  Parses saved C/header snapshots using a non-fallthrough LLVM virtual filesystem;
  source absolute includes map to snapshots and only explicit SDK paths are readable.
  No shell/configure/Make recipes/build commands are executed. No model calls.
- Compiler-bound declarations and within-TU definitions carry compiler USRs and
  source locations. Function pointers remain unresolved. Cross-unit USR matching
  is a candidate link, not linker/runtime proof; lookup reports actual TU coverage.
  Preprocessor-inactive ranges and active definitions reflect the selected profile.
- Added CLI --compiler-file, --compiler-symbol, --build-variants and --build-variant;
  MCP list_build_variants, analyze_c_translation_unit, find_compiler_symbol.
  Bounded compiler_context (at most two C TUs, 12 calls/6 definitions per excerpt)
  now participates in hybrid answers, enabled via DEEPWIKI_COMPILER_CONTEXT=true.
- Followed the user's united_build.sh reference into configure/defines.mak/targets.mak
  as build metadata, without indexing extra file types or running those scripts.
  /bin/arm-linux-gnueabihf-gcc reports arm-linux-gnueabihf. The script selects EVB
  and defaults ENTU to entu_2i_10g. Current features_ext.h instead has the qi_edge
  feature value. Two profiles model those variants via unsaved macro buffers; the
  source header remains untouched. The default analysis follows the script default,
  not a claim about a previously executed build. ARCH=aarch64 in configure differs
  from the actual compiler triple; the compiler target is retained explicitly.
- Profiles at .venv/compiler-profiles.json derive common flags and literal INC_DIR
  values from 156 selected Make directories; 16 dynamic/out-of-scope include entries
  remain unresolved. Profiles therefore report partial even when parsing has zero
  diagnostics. There is still no exact per-TU compilation database. Exact build
  semantics, generated headers outside scope, runtime dispatch and complete compiler
  resolution across all sources are NOT claimed complete. Compiler tool coverage
  is currently a sample/on-demand, not a full background compiler index.
- Cache identity includes libclang, active source generation, profile/metadata hashes
  and SDK header hashes. Changed metadata refuses stale profiles; changed SDK headers
  trigger reparsing. Token and syntax-v1 indexes both support this analysis.
- Real validation: two saved ETX C translation units under both variants yielded
  eight definitions and four compiler-bound call declarations, no diagnostics, all
  labelled partial due to incomplete Make flags. Real MCP variants/analyze/lookup
  passed with incomplete whole-repository coverage explicitly reported.
  Artifacts: .venv/initial-index/compiler-real-results.json, compiler-mcp-live.json.
- 129 pre-existing focused tests plus 14 compiler regressions pass (143 distinct),
  plus 7 existing config/RAG compatibility tests. Includes macro variants, included
  virtual header overrides, indirect calls, cross-TU USRs, SDK cache invalidation,
  missing headers, external-header blocking, absolute snapshot includes, metadata
  drift and source preservation. git diff --check passes. HEADLESS.md updated.

## Migration cost estimate and current monitoring (2026-10-22)

The user explicitly authorized resume after the pause. Existing PID 420554 was
verified and SIGCONT sent; no duplicate migration was started. Google's published
standard gemini-embedding-001 rate is $0.15 per million input tokens. The measured
114,024,633 cl100k token estimate implies about USD 17.10 for this migration only;
USD 20-25 is a rough allowance for tokenizer differences/retries, not a hard billing
cap or measured invoice. Provider billing: https://ai.google.dev/gemini-api/docs/pricing
Compiler analysis is local, with zero model charges. Existing Cline/Qwen generation
charges are separate; the migration does not use Qwen.

Migration status at this milestone:
[
  {
    "id": "etx_unitedbuild-14f8bea8",
    "state": "ready",
    "files": 7,
    "total": 7,
    "chunks": 82
  },
  {
    "id": "etx_dnfv_etx_dnfv_mng_plane-02c5f61f",
    "state": "ready",
    "files": 607,
    "total": 607,
    "chunks": 5789
  },
  {
    "id": "etx_makebuild-b717bf09",
    "state": "indexing",
    "files": 578,
    "total": 10318,
    "chunks": 4860
  }
]

Shared default has not switched yet; old token indexes remain active. Continue the
existing migration via .venv/syntax-migration/status.json. The 15-minute heartbeat
was updated to monitor this runner, validate final checkpoints/counts/default switch,
then test syntax CLI/MCP retrieval and update plan.md. Notify only milestones,
completion, failure or required action. Do not restart or duplicate a live process.

### Syntax migration crossed 10% of makebuild (2026-10-22 09:15 UTC)

Verified 1370/10318 makebuild files, 14508 saved chunks, 28/246 parts. Both smaller roots remain ready. Migration is running; shared default is still token. No restart or source change performed.

### Syntax migration crossed 20% of makebuild (2026-10-22 09:45 UTC)

Verified 2951/10318 makebuild files, 30228 saved chunks, 68/246 parts. Both smaller roots remain ready; shared default is still token. No restart or source change performed.

### Syntax migration crossed 30% of makebuild (2026-10-22 10:00 UTC)

Verified 3751/10318 makebuild files, 37835 saved chunks, 84/246 parts. Both smaller roots remain ready; shared default is still token. No restart or source change performed.

### Syntax migration crossed 40% of makebuild (2026-10-22 10:15 UTC)

Verified 4210/10318 makebuild files, 46215 saved chunks, 94/246 parts. Both smaller roots remain ready; shared default is still token. No restart or source change performed.

### Syntax migration crossed 50% of makebuild (2026-10-22 11:30 UTC)

Verified 5958/10318 makebuild files, 87428 saved chunks, 138/246 parts. Both smaller roots remain ready; shared default is still token. No restart or source change performed.

### Syntax migration crossed 60% of makebuild (2026-10-22 11:45 UTC)

Verified 7108/10318 makebuild files, 94668 saved chunks, 161/246 parts. Both smaller roots remain ready; shared default is still token. No restart or source change performed.

### Syntax migration crossed 70% of makebuild (2026-10-22 12:00 UTC)

Verified 7628/10318 makebuild files, 103228 saved chunks, 173/246 parts. Both smaller roots remain ready; shared default is still token. No restart or source change performed.

### Syntax migration crossed 80% of makebuild (2026-10-22 12:30 UTC)

Verified 8482/10318 makebuild files, 120779 saved chunks, 192/246 parts. Both smaller roots remain ready; shared default is still token. No restart or source change performed.

### Syntax migration crossed 90% of makebuild (2026-10-22 13:15 UTC)

Verified 9757/10318 makebuild files, 144610 saved chunks, 233/246 parts. Both smaller roots remain ready; shared default is still token. No restart or source change performed.

## Syntax migration completed automatically (2026-10-22)

All configured roots passed manifest/count/checkpoint reconciliation. Shared .env now selects syntax-v1; legacy token indexes retained. Verified migration summary: .venv/syntax-migration/status.json. Restart already-running MCP servers to use the new strategy.

## Independent syntax-index reconciliation passed (2026-10-22)

The migration runner completed and exited normally. Shared .env was independently
verified as DEEPWIKI_CHUNK_STRATEGY=syntax-v1. All three initial replacement manifests
are ready and selected=indexed, with zero skipped files. Active generations were
then reconciled against the current selected source inventory and every referenced
saved chunk was checked for source identity, content ownership, nonempty finite
3072-dimensional vectors and per-file chunk counts.

- makebuild: initial replacement scan 10,318 files; current active inventory 10,317
  files and 151,182 chunks. The runner reconciled changes made during migration,
  including one removed eligible file and 19 changed candidates. Removed source
  content is suppressed by active-generation ownership. This is not a reader skip.
- management plane: 607 active files, 5,789 chunks.
- unitedbuild: 7 active files, 82 chunks.
- Total: 10,931 current files, 157,053 active chunks, zero skipped files.
- Five Git repository checkpoints verified; unchanged reindex passed for all roots
  with both source-embedding entry points and embedder initialization explicitly
  blocked. No state.json changed during those no-op checks. All token indexes and
  their original manifests/checkpoints remain available for rollback.
- Saved verification: .venv/syntax-migration/verified.json. CLI semantic search on
  the newly active syntax indexes completed. MCP hybrid lookup and wiki-freshness
  checks are in progress; do not repeat source migration.
- Initial verification encountered a normal nonblocking index lock while search
  caches were being built concurrently. The operations were then run serially and
  reconciliation/no-op verification passed. No job was restarted or source altered.

## Syntax migration fully verified and active (2026-10-22)

- Independent reconciliation of all active saved vectors/source identities passed:
  10,931 current files / 157,053 chunks, zero skipped files, five Git checkpoints.
  One eligible file removed during the long build was correctly removed from active
  ownership; updated content was reconciled before publication. The initial full
  syntax manifest count and current active inventory therefore intentionally differ.
- Shared .env selects syntax-v1. The migration runner has exited normally. Do not
  restart it, rebuild source embeddings or re-run completed verification on every
  heartbeat. Original token indexes and checkpoints remain intact for rollback.
- An unchanged reindex for all three roots passed with source embedding and embedder
  initialization explicitly blocked; state files remained byte-for-byte unchanged.
- Real CLI semantic search completed. Real MCP list/search returned six cited sources
  across all three roots, with source generations matching the verified checkpoints.
- Wiki freshness was correctly stale after the generation switch. One explicitly
  authorized Cline/Qwen refresh produced the existing build-entry topic, and real
  MCP list/get readback verified eight sources spanning all three roots, valid
  citation bounds and stale=false. Wiki generation: d96b68d7dfdd446caff91424c2cdb6db.
- Final results: .venv/syntax-migration/verified.json, cli-search.json, mcp-check.json,
  wiki-mcp-live.json and wiki-mcp-readback.json. No new application-code changes were
  required during migration verification; the 143 focused plus 7 compatibility tests
  remain the verified implementation baseline. git diff --check passes.
- Remaining limits are compiler-profile completeness (exact per-TU flags/whole-program
  and linker/runtime resolution are not established), actual Codex/Claude client
  registration, and uncommitted/unpushed working changes. Neither source scope nor
  compiler claims should be broadened by a scheduled wakeup. Keep the chat open.

## Claude CLI SSH launch verified (2026-10-25)

- Started codeWiki from the user's Windows PC through ssh -T with BatchMode=yes,
  using the same remote command intended for Claude Code stdio registration.
- Real JSON-RPC initialize, tools/list and list_repositories passed: codeWiki,
  15 tools, three configured roots. No source excerpts or model requests were needed.
- This is a stdio server: Claude owns the SSH/server subprocess and starts it on
  connection. The validation session exited cleanly; no unrelated background daemon
  or network listener was created. User received the Claude CLI registration command.
- Actual Claude/Codex configuration has not been modified or registered by this chat.

## Authorized portability work before wiki pilot (2026-10-25)

User requested .env-based data/wiki locations, stable repository identities,
portable export/import with no re-embedding, and read-only operation without
source checkouts. Wiki pilot remains paused; no pilot model calls were made.
DEEPWIKI_BUILD_VARIANT=entu_qi_edge is already set and tested as an alias for
EVB qi_edge. Preserve the user's staged changes; portability edits remain unstaged.
Implement safe SQLite document/vector bundles with relative state references,
source-path mappings and checksums; preserve existing legacy indexes/rollback.


## Portable dataset activation verified (2026-10-25)

- Implemented DEEPWIKI_DATA_DIR, DEEPWIKI_WIKI_DIR and DEEPWIKI_READ_ONLY for
  CLI/MCP startup through .env. Optional DEEPWIKI_SOURCE_PATHS maps stable exported
  IDs to new checkouts; DEEPWIKI_CACHE_DIR selects an absolute per-user cache.
- Added --export-data/--import-data: versioned catalog, safe SQLite document/vector
  parts, relative references, logical nested/containing Git owners and checkpoints,
  active wiki Markdown and SHA-256 checksums. Atomic import/export refuses existing
  destinations and source-tree writes; import rechecks copied bytes before publish.
  No environment/credentials, legacy pickles or SDKs are exported.
- Converted a separate bundle without model calls. Independently compared every
  active chunk's ID, text, path and float32 vector: all 10,931 files and 157,053
  chunks across three roots are identical. Five Git checkpoints are retained.
- Imported and physically relocated a second copy; queried it without source
  checkouts. Semantic retrieval used a saved vector as the query, with providers
  blocked; exact lookup and existing wiki readback passed, stale=false.
- Real in-process MCP checks passed in writable (15 tools) and read-only (12 tools)
  modes. Read-only omits three mutations, uses local derived caches/locks, and
  left every shared dataset file/directory mtime unchanged during lookup/wiki reads.
- Imported production dataset /home/ofer_g/.adalflow/codewiki-data and atomically
  switched shared .env to it only after checks. WIKI_DIR=wiki, READ_ONLY=false,
  BUILD_VARIANT=entu_qi_edge. Original ~/.adalflow/headless remains intact for rollback.
  Sharing bundle: /home/ofer_g/.adalflow/codewiki-portable-20261025 (keep immutable;
  export a fresh bundle after subsequent updates).
- Evidence: .venv/portability/verified.json, activation.json, focused-tests.log.
  Final pytest top-level suite: 187 passed, 19 subtests passed; git diff --check clean.
  Includes moved mappings/no-op vector reuse, single-file update, nested checkpoints,
  failed-update state preservation, copied-byte corruption and CLI import coverage.
- HEADLESS.md and headless.env.example document transfer, recipient .env, matching
  embedding-model requirements, local keys/consent, cache and SDK limitations.
  Existing MCP client subprocesses retain startup config until reconnect/restart;
  client registration remains untouched. User's staged changes were preserved;
  portability edits/new files are unstaged, uncommitted and unpushed.
- Small wiki pilot remains pending. No pilot, source embedding or generation model
  calls occurred during portability work; the existing published topic stayed fresh.


## Small wiki pilot published (2026-10-25)

- User requested one small example before expanding the wiki. Generated a roughly
  453-word feature page on entu_qi_edge selection in united_build.sh, configuration
  and build flow, firmware selection and explicit compiler-profile limitations.
  Provider/model remained approved Cline / cline-pass/qwen3.7-max; build variant
  entu_qi_edge. No source files, filters, checkouts or source embeddings changed.
- Initial draft missed the unquoted script filename and was inadequate for the topic.
  Corrected hybrid retrieval to recognize plain filenames and include bounded literal
  identifier windows beyond the first 120 lines of a named file. Added regression
  tests for both cases. Revised page cites the actual script's argument parsing,
  build_etxa and firmware-variant cases. It does not claim a proven executed toolchain.
- Wiki generation now retains unrequested current pages byte-for-byte and only
  regenerates requested topics. Stale retained pages require an explicit refresh;
  failed generation keeps the previous publication. Tests cover preservation and
  rejection before model calls. HEADLESS.md documents the behavior.
- Published generation 0d7aaec24fad4ed1bb36dfde13da4cd5, two total pages (one existing,
  one new). Source-range bounds and citation numbers checked against indexed
  snapshots; real stdio MCP list/get readback passed and stale=false. Existing
  original build-entry page is byte-identical. Evidence: .venv/wiki-pilot/verified.json.
- Revised pilot: 114.58 seconds end-to-end, including local retrieval;
  model streaming 29.95 seconds. API usage: 4,072 prompt
  tokens + 2,711 completion tokens (including 1,872 reasoning tokens), 6,783 total.
  API-reported cost $0.05086774 for the revised page; $0.09520072 across both drafts.
  Each draft made one query-embedding request, zero source-embedding calls. Query
  embedding cost is not included in these Cline usage amounts; no invoice verified.
- Final focused top-level suite: 191 passed, 19 subtests passed. git diff --check
  clean. Source changes remain uncommitted/unpushed; prior staged changes preserved.
- Local review copy: C:/Users/ofer_g/Documents/Codex/codeWiki/wiki-pilot/entu-qi-edge-build.md.
  No bulk wiki run started. Broader generation should use a feature/topic inventory,
  coverage checks and a measured budget; one sample does not establish full coverage.


## Full authorized wiki batch launched (2026-10-25)

- User approved generating the remaining wiki and continuing next month if the
  Cline budget is exhausted. Implemented api.wiki_batch: persistent feature queue,
  per-page publication, paid draft caching, source/model/variant checkpoints and
  process/publisher locks. No automatic paid restart or alternate provider fallback.
- Plan: 666 additional directory/subsystem pages, grouping small sibling modules;
  all 10,931 current indexed files are assigned exactly once. This is bounded excerpt
  coverage, not exhaustive behavioral, build or runtime proof. Existing two pages
  are retained. Prioritize unitedbuild and management plane, then application code,
  then imported code. No source or query embeddings, builds, source modification
  or scan widening. Literal credential assignments are redacted in outgoing excerpts.
- Destination remains approved https://api.cline.bot/api/v1, cline-pass/qwen3.7-max;
  variant entu_qi_edge. Captures streamed provider usage. SDK retries disabled for
  batch. Credit/budget errors stop as budget_exhausted; rate limits/other failures
  stop for attention rather than looping. Same command resumes completed work.
- Job directory: /home/ofer_g/.adalflow/codewiki-data/wiki/batch; launch PID 758151. Launch metadata/run.log recorded.
  Read status.json for current status; verify PID, cmdline and cwd before process actions.
- Resume on the server: cd /home/ofer_g/projects/deepwiki-open &&
  .venv/bin/python -m api.wiki_batch
- Tests: 198 passed, 19 subtests passed. Covers quota interruption/resume, completed
  queue no-op, reuse of paid drafts after publication failure, partition coverage,
  variant mismatch and redaction. git diff --check clean; changes remain uncommitted
  and user-staged changes are preserved. HEADLESS.md documents run/resume behavior.

- Launch independently verified: PID/cmdline/cwd match, 2 new page(s) published, wiki ready/fresh; all queue partitions match source counts with no duplicated assignments. The new page was read through the same wiki API used by MCP. Monitor automation codewiki-wiki-generation checks every 15 minutes and reports further 50-page milestones or a stop/completion. It must not restart a budget-stopped job.


## Wiki batch stopped on API timeout (2026-10-25)

- First monitor check found status=failed, APITimeoutError: Request timed out.
  Six of 666 queued pages completed; eight total pages are published, including
  the two original pages. Published manifest is ready and references the pinned
  source generations. Completed-page API-reported cost is $0.50044836; the timed-out
  request may have additional unreported usage. This is not confirmed budget exhaustion.
- No restart or provider/model change performed. Completed pages, queue and drafts
  remain intact. Removing codewiki-wiki-generation monitor because the job stopped.
- Resume explicitly when ready on the server: cd /home/ofer_g/projects/deepwiki-open &&
  .venv/bin/python -m api.wiki_batch. Completed pages are skipped.


## Wiki batch resume authorized (2026-10-25)

- User reports adding credits and explicitly authorized continuing. Verified prior
  recorded PID 758151 no longer exists, then resumed the same saved 666-page queue
  after six completed pages. New PID 766121; launch.json updated. No provider,
  model, source generation or variant change; completed pages/drafts are reused.

- Resumed runner PID/cmdline/cwd verified. Status at handoff: running, 7/666 complete; active topic etx_dnfv_etx_dnfv_mng_plane-02c5f61f — files/objects / group 3 subsystem and feature guide. Monitor codewiki-wiki-generation restored; no completed pages regenerated.
