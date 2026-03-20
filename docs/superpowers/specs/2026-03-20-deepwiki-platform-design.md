# DeepWiki Platform — Design Specification

**Date:** 2026-03-20
**Status:** Draft
**Scope:** Transform DeepWiki-Open from a single-user wiki generator into an org-wide code intelligence platform.

---

## 1. Goals & Constraints

### Primary Use Cases
- **Internal developer tool** — large org (50+ people, 500+ repos) uses it to document, explore, and understand their codebase
- **Open-source platform** — the most comprehensive open-source repo documentation and code intelligence tool

### Design Principles
- **Modular monolith** — clean module boundaries, single deployable, extractable to services later
- **Self-hostable** — `docker-compose up` works for small deployments
- **No vendor lock-in** — pluggable LLM providers, vector stores, auth providers
- **Wiki is always public** — any authenticated user reads any wiki, no access gates
- **Auto-updating** — push to main/master → wiki regenerates, zero manual intervention
- **Repo ownership is not DeepWiki's job** — GitHub/GitLab handles repo permissions. DeepWiki reads what its credentials can access.

### What DeepWiki Manages vs What It Doesn't

**DeepWiki's job:**
- Index repos it has access to
- Generate + auto-update wikis
- Build entity graph across repos
- Serve scoped Q&A (repo / group / org)
- Auto-generate cross-repo diagrams per group
- Track LLM costs and usage
- User authentication (who are you?)
- Repo Group management (which repos go together)

**NOT DeepWiki's job:**
- Repo ownership, permissions, branch protection, PR approvals
- Repo creation or deletion
- Team-to-repo access control (that's the code host's domain)

---

## 2. High-Level Architecture

### Modular Monolith — 8 Core Modules

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend — Next.js 15                       │
│  Wiki Viewer · Chat Interface · Admin Dashboard             │
│  Entity Graph Explorer · Code Intelligence · Onboarding     │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST + WebSocket + SSE
┌──────────────────────────▼──────────────────────────────────┐
│              API Gateway / Router — FastAPI                  │
│  Auth middleware · Rate limiting · API versioning            │
└──────────────────────────┬──────────────────────────────────┘
                           │ Internal Module Bus (Events + Direct Calls)
┌──────────┬──────────┬──────────┬──────────┐
│   Auth   │  Wiki    │ RAG /    │ Entity   │
│  Module  │ Engine   │ Vector   │  Graph   │
├──────────┼──────────┼──────────┼──────────┤
│Ingestion │  Chat /  │  Code    │ Admin /  │
│ Pipeline │ Research │  Intel   │Analytics │
└──────────┴──────────┴──────────┴──────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  Shared Infrastructure                       │
│  PostgreSQL (relational + pgvector + Apache AGE)            │
│  Redis (job queue · cache · sessions · event bus)           │
│  LLM Provider Layer (pluggable interface)                   │
│  FAISS (local/dev) · Qdrant (high-scale alternative)        │
└─────────────────────────────────────────────────────────────┘
```

### Shared Infrastructure

**PostgreSQL** — one database, three capabilities:
- **Relational** — users, repos, wikis, jobs, analytics, config
- **pgvector extension** — vector embeddings for RAG (default production vector store)
- **Apache AGE extension** — graph queries (Cypher) for entity graph traversal

**Redis** — job queue, cache, session store, internal event bus

**Vector Store** — 3-tier pluggable:
- **FAISS** — local/dev, zero dependencies, one index file per repo
- **pgvector** — default production, `WHERE repo_id = ANY($ids)` for scoped search
- **Qdrant** — high-scale alternative, payload filtering before ANN search

**LLM Provider Layer** — pluggable interface with built-in providers, proxy mode, and community plugins

### Module Communication

**Synchronous (direct calls):**
- API Gateway → Auth (every request)
- Chat → RAG (retrieval queries)
- Chat → Entity Graph (relationship queries)
- Wiki Engine → RAG (context for generation)
- Code Intel → Entity Graph (blast radius)
- Admin → all modules (status queries)

**Asynchronous (Redis event bus):**
- Ingestion → Wiki Engine (`repo.indexed`)
- Ingestion → Entity Graph (`repo.indexed`)
- Ingestion → RAG (`repo.indexed` → re-embed)
- Ingestion → Code Intel (`repo.indexed` → docstrings)
- Webhook receiver → Ingestion (`repo.pushed`)
- Wiki Engine → Analytics (`wiki.generated`)
- Chat → Analytics (`chat.message.sent`)

---

## 3. Authentication

### Three Auth Modes

**Email/Password** — always available, admin bootstrap method, no external dependency. Passwords bcrypt-hashed.

**OIDC** — Keycloak, Okta, Auth0, Azure AD, Google Workspace. Auto-discovery via `.well-known`. Multiple providers can be active simultaneously.

**SAML** — enterprise IdP, direct or via Keycloak bridge.

### Admin Bootstrap Flow

1. Deploy DeepWiki with `ADMIN_EMAIL=admin@company.com` env var
2. On first boot, if no admin user exists, the system generates a one-time setup token and prints it to stdout/logs: `Admin setup URL: http://localhost:3000/setup?token=abc123`
3. Admin visits the setup URL → sets password → logs in → sees Admin Dashboard
4. For subsequent password resets: configurable email delivery via SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` env vars). If SMTP is not configured, password resets are admin-only (superadmin resets other users' passwords via dashboard). This supports air-gapped deployments.
4. Admin configures OIDC/SAML provider(s) in Settings
5. Admin adds RepoCredentials (GitHub App / PAT) → private repos now accessible
6. Admin creates Repo Groups → assigns repos
7. Users log in via OIDC/SAML → auto-provisioned with default role

### Repo Credentials — Separated from User Auth

User login tokens and repo access tokens are completely separate:

**User auth** (who are you?) — email/password, OIDC, or SAML → JWT with user identity
**Repo access** (what can DeepWiki clone?) — GitHub App installation token, service account PAT, deploy key, GitLab/Bitbucket tokens

This means:
- Users who login via Keycloak/SAML can still browse private GitHub repo wikis
- Repo access survives employee departures
- No dependency on any individual user's OAuth token

### Private Repo Access — Naturally Gated

No license key, no feature flag. Private repos are available when a RepoCredential is configured:
- **No RepoCredential?** Public repos only.
- **RepoCredential configured?** Private repos accessible via that credential's scope.

### Auth Data Model

**User** — `id, email, name, avatar_url, password_hash (nullable), role (superadmin/admin/member), is_active, email_verified, created_at, last_login`

**AuthIdentity** (1 user → many identities) — `id, user_id, provider_type (local/oidc/saml), provider_config_id, external_id, external_email, access_token (encrypted), refresh_token (encrypted), token_expires_at, metadata`

**OIDCProviderConfig** (admin-managed) — `id, name, provider_type (oidc/saml), issuer_url, discovery_url, client_id, encrypted_client_secret, scopes, claim_mappings (JSON), auto_provision_users (bool), default_role, is_active, is_default, created_by`

**RepoCredential** (separate from user auth) — `id, name, credential_type (github_app/pat/deploy_key/gitlab_token/bitbucket_app_password), platform, encrypted_token, encrypted_private_key, app_id, installation_id, scope (org/team/repo), created_by, expires_at, last_used_at, is_active`

---

## 4. Teams & Repo Groups

### Two Independent Hierarchies

**Teams** organize **people**. **Repo Groups** organize **code**. They change at different rates and for different reasons.

**Teams** — who works together. Reorg quarterly.
**Repo Groups** — which repos belong together architecturally. Follow your system design. Rarely change.

### Teams

Teams exist for people management only:
- Group users for admin purposes
- No direct connection to repos
- No access control function (wiki is always public)

**Team** — `id, name, slug, description, avatar_url, created_by, created_at`

**TeamMembership** — `user_id, team_id, role (owner/admin/member), joined_at`

### Repo Groups

Repo Groups exist for two purposes only:
1. **Scoped Q&A** — restrict chat/search context to a group's repos
2. **Cross-repo diagram generation** — auto-generate architecture diagrams, sequence diagrams, etc. across repos within a group

**RepoGroup** — `id, name, slug, description, icon, color, created_by, created_at`

**RepoGroupMembership** — `repo_group_id, repo_id, added_by, added_at` (unique: group_id + repo_id; a repo can be in multiple groups)

**Key rules:**
- A repo can belong to multiple groups
- Repos not in any group appear as "ungrouped" in admin
- Deleting a group doesn't delete repos — they remain in other groups or become ungrouped
- Any authenticated user can browse any group and its wikis

### Repo Discovery & Assignment

- GitHub App installation → auto-discover all accessible repos → show as "unassigned" in admin
- Admin can bulk-assign via glob patterns: `acme/payment-*` → payments-domain group
- CODEOWNERS parsing → auto-suggest group assignments
- GitHub Teams sync → optionally mirror org structure into Repo Groups

---

## 5. Repository & Wiki

### Repository

**Repository** — `id, platform (github/gitlab/bitbucket), owner, name, url, default_branch, is_private, credential_id → RepoCredential, index_status (pending/indexing/indexed/failed), last_indexed_at, last_commit_sha, webhook_id, poll_schedule_id, created_at`

### Wiki — Always Public, Auto-Updated

**Wiki** — `id, repo_id, git_repo_path (versioned storage), current_commit_sha, structure (JSON — table of contents), generation_status, created_at, updated_at`

**WikiPage** — `id, wiki_id, path (file path within git repo), title, diagrams (JSON — mermaid definitions), parent_page_id, order, metadata, created_at, updated_at` (note: markdown content is stored in git, not in this table; read from git at serve time, cached in Redis)

### Git-Backed Wiki Versioning

**Source of truth:** Git repository is the primary store for wiki content (markdown files, diagrams). PostgreSQL holds metadata only (Wiki and WikiPage tables store IDs, paths, table of contents structure, generation status — not the full markdown content). To render a wiki page, the system reads from the git repo on disk.

Wiki content is stored in a local git repository per wiki:
- Each wiki generation creates a commit referencing the source repo's commit SHA
- Full diff/blame/rollback via standard git operations
- Storage path: `~/.adalflow/wikis/{repo_owner}/{repo_name}/.git`
- Commit message format: `wiki: regenerate from {source_commit_sha} [{changed_files_count} files]`
- PostgreSQL `WikiPage.path` points to the file path within the git repo (e.g., `pages/auth-middleware.md`)
- WikiPage content is read from git at serve time (cached in Redis for performance)

### Auto-Update Flow

1. Developer pushes to `main` / `master`
2. GitHub/GitLab webhook fires → hits `POST /api/webhooks/{platform}`
3. Webhook receiver validates signature → creates IngestionJob
4. Ingestion pipeline: `git diff old_sha..new_sha` → identifies changed files
5. **Incremental re-index:** only re-embed changed files, not entire repo
6. Wiki engine regenerates only affected wiki pages (pages whose source files changed)
7. Entity graph updates: re-extract entities from changed files, update relations
8. Git-backed wiki: commit new wiki state with ref to source commit SHA
9. Mark GroupDiagrams as `stale=true` for all groups containing this repo → async regen
10. Fallback: if no webhook, poll scheduler checks for new commits at configured interval

### Live Wiki Features

- **Auto-updating code blocks** — embedded snippets show current repo version, not generation-time version
- **Bi-directional editing** — user edits wiki → DeepWiki suggests a PR back to the repo (README update, docstring fix)
- **Inline conversation threads** — every section has "why?/explain/challenge" actions → contextual micro-chat per section. Other users can see and continue threads. Best threads get promoted into wiki text.
- **Staleness indicators** — sections whose source files changed since last generation are visually marked. Click to trigger targeted regeneration of that section.
- **Suggested questions** — auto-generated per wiki page based on content

---

## 6. Auto-Generated Diagrams

### GroupDiagram

**GroupDiagram** — `id, repo_group_id (nullable — null for repo-level or org-level), repo_id (nullable), scope (repo/group/org), diagram_type, content (mermaid/json), generated_at, stale (bool), generation_job_id`

### 20 Diagram Types

All diagrams work at repo, group, and/or org scope. They are auto-generated from the entity graph and regenerated when source repos are re-indexed.

**Structural Diagrams:**

| # | Type | Source | Shows |
|---|---|---|---|
| 1 | Architecture Diagram | docker/k8s entities + API relations | Services, connections, DBs, queues |
| 2 | Dependency Graph | Package manifests (L1) | Repo-to-repo package dependencies |
| 3 | API Surface Map | REST/gRPC/GraphQL entities + consumers | Endpoints exposed and consumed |
| 4 | Data Flow Diagram | reads/writes_table + publishes/subscribes_to | How data moves between services |
| 5 | Entity Relationship Diagram | DB tables/columns + shared protos | Shared data models, foreign keys |
| 6 | Deployment Topology | Dockerfiles + K8s + Terraform | How services are deployed |

**Behavioral Diagrams:**

| # | Type | Source | Shows |
|---|---|---|---|
| 7 | Sequence Diagram | Cross-repo call chains from entity graph | Request flow across services |
| 8 | State Machine Diagram | Enum/state detection + LLM inference | Domain object lifecycles across services |
| 9 | Error/Failure Cascade | Error handling patterns + dependency graph | "If X goes down, what fails?" |
| 10 | Impact Blast Radius | Entity graph reverse traversal | Concentric rings from a changed entity |
| 11 | Migration/Refactor Path | LLM + entity graph | Current → target state with steps |

**Git History Diagrams:**

| # | Type | Source | Shows |
|---|---|---|---|
| 12 | Change Heatmap | Git change frequency (L5) | Architecture colored by churn intensity |
| 13 | Co-Change Coupling Map | Git co-change analysis (L5) | Hidden dependencies between files/repos |
| 14 | Expertise/Ownership Map | Git blame + commit history | Top contributors per module |
| 15 | Bus Factor Diagram | Unique contributor count per module | Risk: single-person knowledge areas |
| 16 | Architecture Evolution Timeline | Entity birth/death over time | How the system grew/changed |

**Quality & Security Diagrams:**

| # | Type | Source | Shows |
|---|---|---|---|
| 17 | Security Boundary Diagram | Auth middleware + API surface | Trust boundaries, attack surface |
| 18 | Test Coverage Overlay | Test file detection + coverage reports | Architecture × coverage = risk map |
| 19 | Technical Debt Map | Complexity + churn + coupling | Highest-impact refactoring targets |
| 20 | API Version Compatibility Matrix | API specs + consumers + history | Safe to deprecate? Check consumers. |

### Diagram Rendering

- Primary format: **Mermaid** (rendered client-side)
- Interactive features: click node → navigate to repo wiki / entity detail
- Diagrams are queryable: user can filter ("show only cross-repo edges"), zoom, and drill down
- Custom diagram views: users combine graph queries → save and share as named views
- Time comparison: "diff the architecture between v2.0 and v3.0"

---

## 7. Entity Graph

### Overview

The entity graph is the core engine powering cross-repo diagrams, Q&A context, blast radius analysis, code intelligence, and anomaly detection. Stored in PostgreSQL with Apache AGE for graph queries.

### CodeEntity (Nodes)

**CodeEntity** — `id, repo_id, entity_type, name, fully_qualified_name, file_path, line_start, line_end, language, signature, ai_docstring, ai_summary, complexity_score, last_modified_commit, last_modified_at, metadata (JSON)`

Entity types:
- **Code-level:** function, class, method, module, file, interface, trait, enum, type_alias
- **API surface:** rest_endpoint, grpc_service, grpc_method, graphql_query, graphql_mutation, websocket_channel
- **Data layer:** db_table, db_column, db_migration, cache_key_pattern, message_queue, event_topic
- **Infrastructure:** docker_service, k8s_deployment, env_variable, config_key, cron_job, feature_flag

### EntityRelation (Edges)

**EntityRelation** — `id, source_entity_id, target_entity_id, relation_type, is_cross_repo (bool), confidence (0.0-1.0), discovered_by (static_analysis/ast_parse/lsp/llm_inference/import_resolution/proto_parse/openapi_parse/git_history/test_analysis/ci_analysis), evidence_file, evidence_line, discovered_at`

Relation types:
- **Code:** imports, calls, extends, implements, instantiates, depends_on
- **API (cross-repo):** exposes_api, consumes_api, gateway_routes, shares_proto
- **Data (cross-repo):** reads_table, writes_table, owns_table, reads_cache, writes_cache, publishes_to, subscribes_to, uses_config
- **Implicit (git-derived):** co_changes_with, temporal_coupling

### 7+1 Extraction Layers

**L1: Static Analysis + LSP** (fast, high confidence)
- AST parsing via tree-sitter (multi-language)
- LSP integration (pyright, tsserver, gopls) for precise type resolution, go-to-definition, find-references
- Spec parsing: OpenAPI, protobuf, GraphQL, SQL migrations, Dockerfiles, K8s manifests, Terraform
- Package manifests: package.json, pyproject.toml, go.mod, pom.xml, Cargo.toml
- Config parsing: env vars, feature flags, config files

**L2: Documentation & Annotation Mining**
- README, ADR, design doc parsing → extract entity references and architectural intent
- Inline comment mining: TODO, FIXME, HACK, @deprecated, @see annotations
- Wiki content fed back as context for entity enrichment

**L3: CI/CD & Build System Analysis**
- GitHub Actions, GitLab CI, Jenkinsfiles → build dependencies, deploy order
- Monorepo workspace resolution (npm workspaces, Go modules, Bazel BUILD)
- Internal package publish/consume chains
- Docker image layer dependencies

**L4: Test Relationship Extraction**
- Test file → source file mapping (test imports, naming conventions)
- Integration test service dependencies (what services does this test stand up?)
- E2E test flow mapping (full user journeys)
- Mock/stub contract detection (what API shape is expected?)

**L5: Git History & Issue/PR Mining**
- Co-change coupling: files that always change together = hidden dependencies
- Change frequency: hotspot detection
- Author clustering: expertise map per file/module
- Temporal coupling across repos: "auth changes → billing changes within 48h"
- Commit message mining: bug references, feature tags, "fixes #123"
- Issue/PR linkage: business intent connected to code changes

**L6: Cross-Repo Resolution** (connecting the dots)
- Match API consumers to producers (HTTP client URL patterns → endpoint entities)
- Match queue publishers to subscribers (topic/channel string matching)
- Match shared proto/schema imports across repos
- Match DB table references across repos (ORM model → table name → other repo's migration)
- Gateway route config → backend service mapping
- SDK consumer detection: who imports internal packages
- Environment variable sharing: two services using same `DATABASE_URL` = shared DB

**L7: LLM Intelligence** (synthesis + inference)
- AI docstrings for every function, class, file, module, directory, endpoint
- AI summary: one-line plain English for entity search
- Implicit relation inference (lower confidence, validated by L1-L6)
- Architecture narrative generation from entity graph
- Sequence diagram generation from call chains
- Anomaly detection: pattern-based insights
- Technical debt identification: complexity + churn + coupling analysis

**L8: Runtime/Observability Integration** (optional, future enhancement)
- OpenTelemetry traces: actual runtime call paths
- Service mesh telemetry: traffic flow, latency, error rates
- APM integration: performance data per endpoint
- Feature flag evaluation: which code paths are active in prod

### Incremental Updates

On push to main/master:
1. Diff changed files → re-extract entities only from changed files
2. Delete entities from removed/renamed files → cascade-delete their relations
3. Re-run L6 cross-repo resolution for affected entities only
4. Re-run L7 LLM inference only for changed entities (docstrings, summaries)
5. Mark affected GroupDiagrams as stale → async regeneration
6. L5 git history updated on every push automatically

### Entity Graph Storage

PostgreSQL with Apache AGE extension:
- Relational tables for entities and relations (standard CRUD, indexing)
- Cypher queries via AGE for complex traversals (blast radius, call chains, pathfinding)
- Fallback: recursive CTEs on plain PostgreSQL if AGE is not installed. The CTE fallback supports all required operations (forward/reverse traversal, multi-hop pathfinding) but with lower query expressiveness and ~2-3x slower performance on deep traversals. AGE is recommended for production but not required.

Key indexes:
- `code_entity(repo_id, entity_type)` — find all endpoints in a repo
- `code_entity(fully_qualified_name)` — lookup by FQN for cross-repo matching
- `entity_relation(source_entity_id, relation_type)` — forward traversal
- `entity_relation(target_entity_id, relation_type)` — reverse traversal (blast radius)
- `entity_relation(is_cross_repo)` — quickly find cross-repo edges for group diagrams

### Entity Graph Explorer (UI)

A full navigable visual interface — "Google Maps for your codebase":
- Zoom out: services as clusters. Zoom in: functions, classes, endpoints.
- Click any node: AI docstring, callers, callees, blast radius
- Search: "functions that handle payment errors" → highlights matching nodes
- Filter: "show only cross-repo edges" or "show only DB-touching code"
- Compare: "highlight what changed this week"
- Time slider: "show architecture as of 6 months ago"

---

## 8. Code Intelligence

All powered by the entity graph.

### AI Docstrings

Every function, class, file, module, directory, and endpoint gets an LLM-generated docstring.

**How:** Feed entity code + its call graph context to LLM → generate docstring explaining: what it does, what it depends on, who calls it, side effects (DB writes, API calls, queue publishes).

**Update:** Only regenerate for entities whose code changed.

### Blast Radius Analysis

"If I change this, what breaks?"

**Input:** file path or entity name
**Process:**
1. Find entity in graph
2. Traverse all reverse edges (who calls me? who imports me?)
3. Cross repo boundaries via API/queue/DB edges
4. Score impact: direct callers (high) → transitive (lower)

**Output:** Impact tree with repos, files, functions affected + Mermaid blast radius diagram

### PR Context Injection

Auto-surface relevant context when reviewing a PR:
- Relevant wiki sections for changed files
- Cross-repo blast radius of the changes
- Entity graph: what depends on changed code
- Related sequence diagrams that touch changed code
- Flagged risks: "this changes an API consumed by 3 services"

**Delivery:** GitHub App PR comment and/or in-app PR review page with context sidebar.

### Codebase Health Scores

Per-repo and per-group health dashboard:
- **Documentation coverage:** % of functions/classes with docstrings (real or AI-generated)
- **Staleness:** wiki sections whose source files changed since last generation
- **Orphaned code:** entities with zero incoming edges (nothing calls them)
- **API drift:** OpenAPI spec vs actual endpoint implementation
- **Complexity hotspots:** high cyclomatic complexity + high blast radius
- **Cross-repo coupling:** repos with too many incoming/outgoing edges
- **Bus factor:** modules with single-contributor knowledge
- **Test coverage gaps:** high churn + low coverage areas

### Onboarding Mode

Auto-generated guided walkthrough for new team members:
1. "Here are the repo groups relevant to you."
2. Architecture diagram: how services connect
3. Key entry points: main API endpoints
4. Dependencies: what depends on what
5. Recent changes: last 30 days of significant commits
6. Key contacts: who last modified critical files (from git blame)

Generated from: entity graph + wiki + git log. Shareable as a link.

### Natural Language Graph Queries

Ask questions against the entity graph in plain English:
- "Show me all services that write to the orders table"
- "What's the chain from user signup to first email?"
- "Which repos would break if we rename UserProto?"

**How:** LLM translates natural language → Cypher graph query (via AGE) → execute → format result as text + diagram.

### Anomaly & Drift Detection

The entity graph + git history + wiki state creates a powerful anomaly detector:
- **Documentation drift:** wiki says "service uses PostgreSQL" but code imports MongoDB driver
- **Architecture drift:** design doc says "async via queues" but code shows synchronous HTTP calls
- **Convention violations:** "all services use shared-protos" but new service defines its own
- **Dead endpoint detection:** API exists but no consumer in the entity graph
- **Shadow dependencies:** service A calls service B via hardcoded URL not in any config

**Delivery:** In-app alerts + optional Slack/email notifications. Weekly "architecture health digest."

---

## 9. Chat / Research

### Three Chat Modes

**Quick Ask** — single question → single answer. No conversation history. Fastest response.

**Conversational Chat** — multi-turn dialogue. Maintains conversation context. Each turn rewrites the query incorporating history.

**Deep Research** — multi-step autonomous investigation. Plans → executes → synthesizes → reports. Takes minutes, not seconds. Results saved as shareable reports, optionally saved as wiki pages.

### Four Chat Scopes

| Scope | Filter | Any user can use? |
|---|---|---|
| **Repo** | Single repo | Yes |
| **Group** | All repos in a group | Yes |
| **Multi-Group** | User selects multiple groups | Yes |
| **Org** | All indexed repos | Yes |

### RAG Pipeline

**Step 1 — Query Understanding:** LLM classifies query (factual/structural/exploratory). For multi-turn: rewrite query with conversation context.

**Step 2 — Parallel Retrieval** (all concurrent):
- a) Vector search: embed query → search with scope filter → top-K code/doc chunks
- b) Entity graph query: extract entity names → graph traversal → related entities + relations
- c) Wiki search: keyword + semantic search across wiki pages in scope
- d) Diagram lookup: find relevant auto-generated diagrams

**Step 3 — Context Assembly & Re-ranking:** Merge results. Re-rank by: semantic relevance × source authority (code > wiki > docstring) × recency × scope proximity. Deduplicate. Fit within token budget.

**Step 4 — LLM Generation:** System prompt with scope context + entity graph summary. User prompt with query + retrieved context. Streaming via SSE. Response includes source citations `[repo/file:line]`.

**Step 5 — Post-Processing:** Extract citations → link to source files. Detect Mermaid blocks → render inline diagrams. Log: tokens, cost, latency, sources → analytics.

### Deep Research Pipeline

**Phase 1 — Plan:** LLM generates 3-10 research steps. Shows plan to user for approval/modification.

**Phase 2 — Execute:** For each step: LLM generates search queries → parallel retrieval → synthesize step findings. Steps can spawn sub-steps. Real-time progress streaming.

**Phase 3 — Synthesize:** Merge all findings → generate report with executive summary, detailed findings, auto-generated diagrams, source citations.

**Phase 4 — Save & Share:** Report saved as shareable link. Optionally saved as wiki page. Diagrams saved to group.

### Floating Chat Widget

- Floating button on every wiki page (bottom-right)
- Click → expands to side drawer
- Auto-scoped to current context (viewing repo wiki → scoped to that repo)
- User can change scope via dropdown
- Persists across page navigation
- Highlight text on wiki page → "Ask about selection" button
- Suggested questions generated per wiki page
- Chat history accessible via drawer

### Collaborative Annotations

Human knowledge layered on AI-generated content:
- Developers annotate any entity/diagram/wiki section: "This is legacy, don't build on it"
- Attach ADRs to specific entities/relations: "We chose gRPC over REST because..."
- Tribal knowledge capture: "The reason this looks weird is because of the 2023 migration"
- Senior devs curate "onboarding paths" through the wiki for specific roles
- Annotations survive wiki regeneration — attached to entities, not wiki text

**Annotation** — `id, user_id, target_type (entity/wiki_page/wiki_section/diagram), target_id, content (markdown), annotation_type (note/adr/warning/bookmark), is_pinned, created_at, updated_at`

### Chat Data Model

**ChatSession** — `id, user_id, title (auto-generated), mode (quick/conversational/deep_research), scope_type (repo/group/multi_group/org), scope_ids (array), is_pinned, is_shared, share_url, created_at, updated_at`

**ChatMessage** — `id, session_id, role (user/assistant), content (markdown), citations (JSON), diagrams (JSON), model_used, provider_used, prompt_tokens, completion_tokens, cost_usd, latency_ms, created_at`

**ResearchReport** — `id, session_id, title, executive_summary, plan (JSON), findings (JSON), generated_diagrams (JSON), sources_used (JSON), total_tokens, total_cost_usd, saved_as_wiki_page_id (nullable), created_at`

---

## 10. Ingestion Pipeline

### Async Job Queue

All ingestion is async, powered by Redis-backed job queue.

**IngestionJob** — `id, repo_id, trigger_type (webhook/poll/manual), status (queued/running/completed/failed), commit_sha, parent_job_id (for retries), files_processed, files_changed, started_at, completed_at, error_message, triggered_by`

### Three Trigger Mechanisms

**Webhooks (real-time):**
- `POST /api/webhooks/github` — validates signature, extracts push event
- `POST /api/webhooks/gitlab` — validates token, extracts push event
- `POST /api/webhooks/bitbucket` — validates signature, extracts push event
- Only triggers on push to default branch (main/master)
- Webhook auto-registration when RepoCredential is a GitHub App

**Polling (fallback):**
- For repos without webhook access
- Configurable interval per repo (default: 6 hours)
- Checks `git ls-remote` for new commit SHA vs last indexed
- Lightweight — no clone until change detected

**Manual:**
- Admin or user triggers via UI or API
- Can force full re-index (not incremental)

**PollSchedule** — `id, repo_id, interval_seconds, last_polled_at, next_poll_at, last_commit_sha, is_active`

**WebhookConfig** — `id, repo_id, platform, webhook_url, secret, events, is_active, last_received_at`

### Incremental Re-indexing

1. `git pull` latest changes
2. `git diff old_sha..new_sha --name-status` → list of added/modified/deleted files
3. **Deleted files:** remove their vector chunks + code entities + relations
4. **Modified files:** re-chunk, re-embed, re-extract entities for those files only
5. **Added files:** chunk, embed, extract entities
6. Re-run L6 cross-repo resolution for affected entities
7. Re-run L7 LLM inference for changed entities only (docstrings, summaries)
8. Update wiki pages that reference changed files
9. Mark group diagrams as stale

### Job Prioritization

- Webhook-triggered jobs: highest priority (real-time update expectation)
- Manual triggers: medium priority
- Poll-triggered jobs: lowest priority (background maintenance)
- Concurrent job limit per worker (configurable, default: 3)
- Jobs for the same repo are serialized (no concurrent indexing of same repo)

---

## 11. LLM Provider Layer

### Provider Interface

```python
class LLMProvider(ABC):
    async def generate(prompt, system, model, **kwargs) -> str
    async def generate_stream(prompt, system, model, **kwargs) -> AsyncIterator[str]
    def list_models() -> list[ModelInfo]
    def supports_function_calling() -> bool
    def token_count(text, model) -> int
    def cost_per_token(model) -> CostInfo

class EmbeddingProvider(ABC):
    async def embed(texts: list[str], model) -> list[list[float]]
    async def embed_batch(texts, model, batch_size) -> list[list[float]]
    def dimensions(model) -> int
    def max_tokens(model) -> int
```

### Three Provider Modes

**Built-in Providers** — ship with DeepWiki: OpenAI, Google Gemini, Anthropic Claude, AWS Bedrock, Azure OpenAI, Ollama, DeepSeek. Each implements LLMProvider + EmbeddingProvider.

**Proxy Mode** — for orgs running LLM proxies: LiteLLM, OpenRouter, vLLM, any OpenAI-compatible API. Single config: `base_url + api_key`. Uses OpenAI SDK under the hood. Model list auto-discovered via `/models`.

**Community Providers** — plugin system: implement LLMProvider interface, register via entry point or plugin directory, auto-discovered at startup.

### Operation → Model Routing

Each operation type can use a different provider/model:

| Operation | Recommended Tier |
|---|---|
| wiki_generation | High quality (GPT-4o / Claude Opus) |
| chat_quick | Fast (GPT-4o-mini / Gemini Flash) |
| chat_conversational | Balanced (GPT-4o / Claude Sonnet) |
| deep_research | Highest quality (o3 / Claude Opus) |
| docstring_generation | Fast + cheap (Gemini Flash) |
| entity_extraction | Structured output (GPT-4o) |
| diagram_generation | Mermaid-capable (GPT-4o / Claude) |
| embedding | Dedicated (text-embedding-3-large) |

### Routing Config

**ProviderConfig** — `id, name, provider_type, base_url (nullable), encrypted_api_key, extra_config (JSON), is_active, is_default, rate_limit_rpm, rate_limit_tpm, created_by`

**ModelRoutingRule** — `id, operation_type, provider_config_id, model_name, priority (1=primary, 2=fallback), max_tokens, temperature, cost_cap_per_request_usd, is_active`

Features:
- Fallback chain: primary → secondary → tertiary provider per operation
- Rate limiting per provider
- Cost caps: per-user / per-day / per-month
- Circuit breaker: auto-failover if provider error rate exceeds threshold
- User can select model in chat UI (if admin allows)

---

## 12. Admin Dashboard & Analytics

### Dashboard Views

**System Overview:**
- Total repos indexed, wikis generated, entities extracted
- Job queue status: running, queued, failed (last 24h)
- System health: API latency, error rate, queue depth
- Storage usage: vector store size, wiki storage, DB size

**Repo Management:**
- All indexed repos with status, last indexed, webhook status
- Ungrouped repos requiring assignment
- Bulk operations: assign to group, trigger re-index, remove
- Repo discovery: newly accessible repos from GitHub App

**Repo Group Management:**
- Create, edit, archive groups
- Assign repos via glob patterns
- View group diagrams and their staleness status

**User Management:**
- User list with roles, last login, auth method
- Team management: create teams, assign members
- OIDC/SAML provider configuration
- RepoCredential management

### Analytics

**Usage Analytics:**
- Most viewed wikis and pages
- Most active chat users
- Search query patterns (what are people asking?)
- Research reports generated

**Cost Tracking:**
- Token spend per provider / per model / per operation type
- Cost per team / per user / per repo group
- Daily/weekly/monthly cost trends
- Cost alerts: configurable thresholds

**LLMUsageLog** — `id, user_id, repo_id, provider, model, prompt_tokens, completion_tokens, cost_usd, operation_type, created_at`

**WikiViewEvent** — `id, wiki_id, page_id, user_id, session_id, created_at`

### Health Monitoring

- Webhook delivery status per repo
- Ingestion job success/failure rates
- LLM provider availability and latency
- Vector store query performance
- Entity graph size and growth trends

---

## 13. API & Integrations

### Public API

REST + optional GraphQL API for programmatic access:
- **Wiki API:** get wiki pages, search wiki content
- **Entity Graph API:** query entities, relations, traverse graph
- **Chat API:** send messages, get responses (streaming)
- **Diagram API:** get diagrams by type, scope, group
- **Search API:** vector search, entity search, full-text search
- **Admin API:** repo management, user management, config

All endpoints authenticated via API key or JWT.

### Embeddable Widget

`<script>` tag that adds DeepWiki chat to any internal tool:
- Drop into Backstage, internal portal, Confluence, any web page
- Configurable: scope, theme, position
- Authenticated via iframe token or API key

### IDE Extensions

VS Code / JetBrains plugin:
- Hover a function → see AI docstring from DeepWiki
- Right-click → "Show blast radius"
- Sidebar: chat with DeepWiki from IDE
- Go-to-wiki: jump from code to relevant wiki page

### CLI Tool

```bash
deepwiki ask "how does auth work?" --scope payments-domain
deepwiki search "payment error handling" --repo acme/payment-service
deepwiki diagram architecture --group payments-domain
deepwiki status  # show indexing status, job queue
```

### Slack / Teams Bot

```
@deepwiki how does the payment flow work?
@deepwiki blast-radius acme/payment-service/src/charge.py
@deepwiki diagram sequence --group payments-domain "order creation"
```

### GitHub App

- Auto-comment on PRs with: blast radius, related wiki sections, cross-repo impact
- Webhook receiver for push events
- Repo discovery via installation

---

## 14. Multi-Tenancy (Future)

Designed as single-tenant by default. Multi-tenant mode for:
- MSPs hosting for clients
- Large enterprises with isolated business units
- Eventual SaaS offering

**Approach:** Row-level security in PostgreSQL (tenant_id on all tables). Per-tenant LLM provider config, cost tracking, admin. Shared infrastructure, isolated data.

Not in initial build. Architecture supports it via tenant_id column that can be added later without schema redesign.

---

## 15. Project Decomposition

This is too large for a single implementation cycle. Recommended sub-projects in build order:

### Phase 1: Foundation (Core Platform)
- PostgreSQL + pgvector + Redis infrastructure
- Auth module (email/password + OIDC)
- Repository management + RepoCredential
- Ingestion pipeline (webhook + polling + manual trigger) — all three triggers from day one
- Upgraded RAG pipeline with pluggable vector store
- Basic wiki generation (existing functionality, refactored into modules)
- LLM provider layer (pluggable interface)
- Admin dashboard (basic — repos, users, jobs)

### Phase 2: Intelligence Layer
- Entity graph (L1 static analysis + L6 cross-repo resolution)
- Repo Groups + scoped Q&A
- Auto-generated diagrams (top 6 structural diagrams)
- AI docstrings (L7)
- Floating chat widget
- Git-backed wiki versioning

### Phase 3: Deep Features
- Remaining extraction layers (L2-L5)
- All 20 diagram types
- Deep Research mode
- Blast radius analysis
- PR context injection (GitHub App)
- Codebase health scores
- Anomaly & drift detection
- Cost tracking & analytics

### Phase 4: Platform & Ecosystem
- Entity Graph Explorer (full visual UI)
- Live wiki features (auto-updating blocks, bi-directional editing, inline threads)
- Collaborative annotations
- Interactive queryable diagrams
- Onboarding mode
- Natural language graph queries

### Phase 5: Integrations
- Public API (REST + GraphQL)
- Embeddable widget
- IDE extensions (VS Code, JetBrains)
- CLI tool
- Slack/Teams bot
- SAML auth
- Multi-tenancy support
- Additional polling configuration UI

---

## 16. Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| Backend | FastAPI, Python 3.11+, Poetry 2.0.1 |
| Database | PostgreSQL + pgvector + Apache AGE |
| Cache/Queue | Redis |
| Vector (local) | FAISS |
| Vector (scale) | Qdrant (optional) |
| Diagrams | Mermaid (client-side rendering) |
| Auth | python-jose (JWT), authlib (OIDC/SAML) |
| Job Queue | arq (async Redis-backed, lightweight, Python asyncio-native) |
| Graph Queries | Apache AGE (Cypher) / PostgreSQL recursive CTEs |
| LLM Providers | OpenAI, Gemini, Claude, Bedrock, Azure, Ollama, OpenRouter |
| AST Parsing | tree-sitter (multi-language) |
| LSP | pyright, tsserver, gopls (via subprocess) |
| Git | gitpython / subprocess |
| Deployment | Docker, docker-compose |
