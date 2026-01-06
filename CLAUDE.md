# DeepWiki Django Migration Plan

## Executive Summary

This document outlines a comprehensive plan to migrate DeepWiki from a FastAPI + Next.js architecture to a Django-exclusive architecture. The goal is to consolidate the backend API and frontend rendering into a single Django application, eliminating the need for separate FastAPI and Node.js processes.

## Current Architecture

### Backend (FastAPI)
- **Location**: `api/` directory
- **Framework**: FastAPI with Uvicorn
- **Key Features**:
  - RESTful API endpoints for wiki generation
  - WebSocket support for real-time chat
  - Streaming responses for chat completions
  - RAG (Retrieval Augmented Generation) system
  - Multi-provider LLM support (Google, OpenAI, OpenRouter, Ollama, Bedrock, Azure, Dashscope)
  - Wiki cache management (file-based)
  - Repository cloning and processing
  - Export functionality (Markdown/JSON)
  - Authentication/authorization system

### Frontend (Next.js/React)
- **Location**: `reference_impl/` directory
- **Framework**: Next.js 14+ with App Router, React, TypeScript
- **Key Features**:
  - Server-side rendering (SSR)
  - Client-side routing
  - Multi-language support (i18n)
  - Theme support (light/dark mode)
  - Interactive UI components
  - WebSocket client for real-time chat
  - Model configuration UI
  - Repository input and configuration

### Current Django Setup
- **Location**: `autodocs/` (project), `autodocumenter/` (app)
- **Status**: Basic skeleton with minimal functionality
- **Current State**: Empty views, no models, basic URL routing

## Target Architecture

### Single Django Application
- **Framework**: Django 6.0
- **Architecture**: Monolithic Django app with:
  - Django REST Framework (DRF) for API endpoints
  - Django Channels for WebSocket support
  - Django templates with HTMX for dynamic UI (alternative to React)
  - OR Server-Side Rendered React with Django (hybrid approach)

## Migration Strategy

We propose a **phased migration approach** with three possible frontend strategies:

### Frontend Strategy Options

#### Option A: Django Templates + HTMX (Recommended for simplicity)
- **Pros**: Full Django integration, no build step, simpler deployment
- **Cons**: Less interactive than React, requires rewriting UI components

#### Option B: Django + Server-Side React (Hybrid)
- **Pros**: Keeps React components, better for complex UI
- **Cons**: Requires build pipeline, more complex setup

#### Option C: Django + Separate React SPA
- **Pros**: Minimal frontend changes, clear separation
- **Cons**: Still requires Node.js for build, doesn't fully consolidate stack

**Recommendation**: Start with Option A (Django Templates + HTMX) for maximum simplification, with Option B as a fallback if UI complexity demands it.

## Detailed Migration Plan

### Phase 1: Django Backend Setup (Weeks 1-2)

#### 1.1 Project Configuration
- [ ] Update `autodocs/settings.py` with production-ready configurations:
  - Configure CORS settings
  - Set up static and media files
  - Configure logging
  - Add Django REST Framework
  - Add Django Channels
  - Configure ASGI for WebSocket support
  - Add environment variable management (django-environ)
  - Configure security settings

#### 1.2 Database Design
- [ ] Design Django models for:
  - `WikiCache`: Store generated wiki data (replace file-based cache)
  - `Repository`: Track processed repositories
  - `ProcessedProject`: Store project metadata
  - `ChatSession`: Store chat history
  - `UserConfiguration`: Store user preferences and settings

- [ ] Create migrations for all models
- [ ] Consider using PostgreSQL instead of SQLite for production

#### 1.3 Core App Structure
- [ ] Reorganize `autodocumenter` app:
  - `models.py`: Django models
  - `views.py`: DRF ViewSets and API views
  - `serializers.py`: DRF serializers
  - `urls.py`: URL routing
  - `consumers.py`: Django Channels WebSocket consumers
  - `tasks.py`: Background tasks (Celery/Django-Q)
  - `services/`: Business logic layer
  - `utils/`: Utility functions

### Phase 2: API Migration (Weeks 3-5)

#### 2.1 RESTful Endpoints Migration
Migrate all FastAPI endpoints to Django REST Framework:

| FastAPI Endpoint | Django Endpoint | Notes |
|-----------------|-----------------|-------|
| `GET /` | `api/` | Root endpoint with API info |
| `GET /health` | `api/health/` | Health check |
| `GET /lang/config` | `api/config/language/` | Language configuration |
| `GET /auth/status` | `api/auth/status/` | Auth status check |
| `POST /auth/validate` | `api/auth/validate/` | Auth validation |
| `GET /models/config` | `api/models/config/` | Model configuration |
| `POST /export/wiki` | `api/wiki/export/` | Wiki export |
| `GET /local_repo/structure` | `api/repos/local/structure/` | Local repo structure |
| `GET /api/wiki_cache` | `api/wiki/cache/` | Get wiki cache |
| `POST /api/wiki_cache` | `api/wiki/cache/` | Save wiki cache |
| `DELETE /api/wiki_cache` | `api/wiki/cache/` | Delete wiki cache |
| `GET /api/processed_projects` | `api/projects/processed/` | List processed projects |
| `POST /chat/completions/stream` | `api/chat/completions/stream/` | Streaming chat (HTTP) |

#### 2.2 WebSocket Migration
- [ ] Migrate WebSocket endpoint to Django Channels:
  - Current: `ws://localhost:8001/ws/chat`
  - Target: `ws://localhost:8000/ws/chat/`
- [ ] Implement Django Channels consumer for chat
- [ ] Configure Redis (or alternative) for channel layers
- [ ] Handle WebSocket connection lifecycle
- [ ] Implement streaming message handling

#### 2.3 Service Layer Migration
Create Django services by migrating existing modules:

- [ ] **Config Service** (`api/config.py` → `services/config.py`)
  - Environment variable management
  - Provider configuration
  - Model configuration loader

- [ ] **Data Pipeline Service** (`api/data_pipeline.py` → `services/data_pipeline.py`)
  - Repository cloning
  - File processing
  - Token counting
  - Database management

- [ ] **RAG Service** (`api/rag.py` → `services/rag.py`)
  - Vector database integration
  - Document retrieval
  - Memory management
  - Context building

- [ ] **LLM Client Services** (Keep in `services/llm/`)
  - `openai_client.py`
  - `google_client.py`
  - `openrouter_client.py`
  - `ollama_client.py`
  - `bedrock_client.py`
  - `azure_client.py`
  - `dashscope_client.py`

- [ ] **Wiki Service** (New service combining wiki logic)
  - Wiki generation orchestration
  - Cache management
  - Export functionality

- [ ] **Repository Service** (New service)
  - Repository validation
  - Access token handling
  - Repository metadata extraction

### Phase 3: Background Tasks (Week 6)

#### 3.1 Task Queue Setup
- [ ] Choose task queue system:
  - **Option A**: Celery + Redis (more powerful, standard choice)
  - **Option B**: Django-Q (simpler, Django-native)
  - **Recommendation**: Celery for production scalability

#### 3.2 Task Migration
- [ ] Create async tasks for long-running operations:
  - Repository cloning
  - Wiki generation
  - Embedding generation
  - Large file processing

#### 3.3 Task Monitoring
- [ ] Set up task monitoring (Flower for Celery)
- [ ] Implement task status endpoints
- [ ] Add progress tracking for frontend

### Phase 4: Frontend Migration (Weeks 7-10)

#### 4.1 Frontend Strategy A: Django Templates + HTMX

**Step 1: Template Structure**
- [ ] Create Django template hierarchy:
  - `base.html`: Base layout with theme support
  - `home.html`: Home page with repository input
  - `wiki.html`: Wiki display page
  - `chat.html`: Chat interface
  - `projects.html`: Processed projects list
  - `components/`: Reusable template fragments

**Step 2: Static Assets**
- [ ] Migrate CSS from `reference_impl/app/globals.css`
- [ ] Set up Tailwind CSS with Django
- [ ] Migrate theme toggle functionality
- [ ] Set up icon library (replace react-icons)

**Step 3: HTMX Integration**
- [ ] Install and configure HTMX
- [ ] Implement dynamic loading patterns
- [ ] Create HTMX-powered components:
  - Model selection modal
  - Configuration modal
  - Project list with auto-refresh
  - File tree view

**Step 4: WebSocket Integration**
- [ ] Implement WebSocket client in vanilla JS
- [ ] Create chat interface with message streaming
- [ ] Handle connection lifecycle in UI

**Step 5: Internationalization (i18n)**
- [ ] Configure Django i18n framework
- [ ] Migrate translation files from `reference_impl/messages/`
- [ ] Implement language selector
- [ ] Set up language context in templates

**Step 6: State Management**
- [ ] Implement client-side state with localStorage
- [ ] Create configuration persistence system
- [ ] Handle cache management in browser

#### 4.2 Frontend Strategy B: Django + Server-Side React (Alternative)

**Step 1: React Build Pipeline**
- [ ] Set up django-webpack-loader
- [ ] Configure Webpack for React builds
- [ ] Integrate build output with Django static files

**Step 2: Server-Side Rendering Setup**
- [ ] Configure React SSR with Django
- [ ] Set up hydration strategy
- [ ] Implement component loading system

**Step 3: Component Migration**
- [ ] Migrate React components from `reference_impl/components/`
- [ ] Update API calls to use Django endpoints
- [ ] Adjust WebSocket client for Django Channels

**Step 4: Routing**
- [ ] Map Next.js routes to Django URLs
- [ ] Implement client-side routing with React Router
- [ ] Handle authentication-protected routes

### Phase 5: Data Migration (Week 11)

#### 5.1 File-Based Cache Migration
- [ ] Create management command to migrate existing cache files
- [ ] Script to read from `~/.adalflow/wikicache/*.json`
- [ ] Parse and insert into Django database models
- [ ] Validate data integrity after migration
- [ ] Keep file-based cache as backup initially

#### 5.2 Configuration Migration
- [ ] Migrate configuration from `api/config/` JSON files
- [ ] Consider database-backed configuration vs file-based
- [ ] Implement configuration UI in Django admin

### Phase 6: Testing & Quality Assurance (Week 12)

#### 6.1 Backend Testing
- [ ] Write Django tests for all API endpoints
- [ ] Test WebSocket functionality
- [ ] Test authentication and authorization
- [ ] Test RAG pipeline
- [ ] Test all LLM provider integrations
- [ ] Load testing for concurrent users

#### 6.2 Frontend Testing
- [ ] Test all UI interactions
- [ ] Test WebSocket reconnection logic
- [ ] Test multi-language support
- [ ] Test theme switching
- [ ] Cross-browser testing

#### 6.3 Integration Testing
- [ ] End-to-end tests for wiki generation
- [ ] Test chat functionality with different models
- [ ] Test export functionality
- [ ] Test cache management

### Phase 7: Deployment & DevOps (Week 13)

#### 7.1 Docker Configuration
- [ ] Update Dockerfile for Django-only stack
- [ ] Remove Node.js from Docker image
- [ ] Configure ASGI server (Daphne or Uvicorn with Django)
- [ ] Set up Redis for Channels and Celery
- [ ] Update docker-compose.yml:
  - Django/ASGI container
  - PostgreSQL container
  - Redis container
  - Celery worker container
  - Celery beat container (if needed)

#### 7.2 Environment Configuration
- [ ] Update environment variables for Django
- [ ] Configure production settings
- [ ] Set up secrets management
- [ ] Configure logging and monitoring

#### 7.3 Reverse Proxy
- [ ] Configure Nginx for:
  - Static file serving
  - WebSocket proxy
  - HTTPS termination
  - Load balancing (if needed)

#### 7.4 Database Setup
- [ ] Configure PostgreSQL for production
- [ ] Set up database backups
- [ ] Configure connection pooling
- [ ] Plan for database migrations

### Phase 8: Documentation & Cleanup (Week 14)

#### 8.1 Documentation
- [ ] Update README.md with new setup instructions
- [ ] Document Django architecture
- [ ] Create API documentation (DRF automatic docs)
- [ ] Update deployment guide
- [ ] Create development setup guide

#### 8.2 Code Cleanup
- [ ] Remove `api/` directory (FastAPI code)
- [ ] Remove `reference_impl/` directory (Next.js code)
- [ ] Remove unused dependencies
- [ ] Remove Node.js related files (package.json, etc.)
- [ ] Archive old code in separate branch

#### 8.3 Migration Guide
- [ ] Create migration guide for existing users
- [ ] Document breaking changes
- [ ] Provide data migration scripts
- [ ] Update Docker instructions

## Technical Considerations

### 1. Real-Time Streaming
**Challenge**: Django traditionally doesn't handle streaming as well as FastAPI
**Solution**:
- Use Django Channels with WebSocket for bidirectional streaming
- Use Django StreamingHttpResponse for HTTP streaming
- Consider ASGI server (Daphne/Uvicorn) for better async support

### 2. Async/Await Support
**Challenge**: Current code uses async/await extensively
**Solution**:
- Django 4.1+ has good async support
- Use async views where needed
- Consider sync_to_async and async_to_sync wrappers for legacy code
- Use Django ORM async API for database operations

### 3. Performance
**Challenge**: Ensuring performance matches or exceeds current setup
**Solution**:
- Use Django caching framework (Redis)
- Implement database query optimization
- Use database connection pooling
- Consider read replicas for scaling
- Profile and optimize hot paths

### 4. WebSocket Scalability
**Challenge**: WebSocket connections with multiple workers
**Solution**:
- Use Redis as channel layer backend
- Configure appropriate number of Daphne workers
- Consider sticky sessions if using load balancer
- Monitor connection limits

### 5. File Storage
**Challenge**: Currently uses local filesystem for repos and cache
**Solution**:
- Keep local filesystem initially
- Plan for future S3/cloud storage integration
- Use Django's FileField for uploaded files
- Consider Django Storages for cloud backends

### 6. LLM Client Integration
**Challenge**: Preserving existing LLM client implementations
**Solution**:
- Keep existing client code with minimal changes
- Wrap clients in Django service layer
- Use dependency injection for testing
- Maintain provider configuration system

## Dependencies

### Remove (No Longer Needed)
- FastAPI
- Uvicorn (replaced by Daphne or kept for ASGI)
- Next.js
- React (if using Option A)
- Node.js build tools

### Add (Django Ecosystem)
- Django 6.0
- Django REST Framework
- Django Channels
- Daphne (ASGI server)
- django-cors-headers
- django-environ
- drf-spectacular (API documentation)
- Celery (task queue)
- Redis (cache & channels)
- psycopg2-binary (PostgreSQL)
- channels-redis
- django-htmx (if using Option A)

### Keep (Core Dependencies)
- adalflow
- google-generativeai
- openai
- tiktoken
- faiss-cpu
- langchain-community
- numpy
- All existing LLM provider SDKs

## Folder Structure (After Migration)

```
deepwiki-dj/
├── manage.py
├── autodocs/                    # Django project
│   ├── __init__.py
│   ├── settings/               # Split settings
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   ├── asgi.py                 # ASGI config for Channels
│   ├── wsgi.py
│   ├── celery.py               # Celery config
│   └── routing.py              # WebSocket routing
│
├── autodocumenter/             # Main Django app (renamed to 'wiki' or 'core'?)
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py               # Django models
│   ├── serializers.py          # DRF serializers
│   ├── urls.py
│   ├── views.py                # DRF views
│   ├── consumers.py            # WebSocket consumers
│   ├── tasks.py                # Celery tasks
│   │
│   ├── services/               # Business logic layer
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── data_pipeline.py
│   │   ├── rag.py
│   │   ├── wiki.py
│   │   ├── repository.py
│   │   └── llm/               # LLM clients
│   │       ├── __init__.py
│   │       ├── base.py
│   │       ├── openai_client.py
│   │       ├── google_client.py
│   │       ├── openrouter_client.py
│   │       ├── ollama_client.py
│   │       ├── bedrock_client.py
│   │       ├── azure_client.py
│   │       └── dashscope_client.py
│   │
│   ├── management/
│   │   └── commands/
│   │       ├── migrate_cache.py
│   │       └── cleanup_repos.py
│   │
│   ├── migrations/
│   ├── templates/              # Django templates (if Option A)
│   │   ├── base.html
│   │   ├── home.html
│   │   ├── wiki.html
│   │   ├── chat.html
│   │   └── components/
│   │
│   ├── static/                 # Static assets (if Option A)
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   │
│   └── tests/
│       ├── test_models.py
│       ├── test_views.py
│       ├── test_services.py
│       └── test_consumers.py
│
├── config/                     # Configuration files (from api/config/)
│   ├── generator.json
│   ├── embedder.json
│   └── repo.json
│
├── static/                     # Collected static files
├── media/                      # User uploads
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── nginx.conf
│
├── docs/                       # Documentation
│   ├── api.md
│   ├── deployment.md
│   └── migration.md
│
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
│
├── .env.example
├── pytest.ini
├── README.md
└── CLAUDE.md                   # This file
```

## Risk Assessment

### High Risk
1. **WebSocket functionality regression**: Requires careful testing
2. **Performance degradation**: Need to profile and optimize
3. **LLM client compatibility issues**: Test all providers thoroughly

### Medium Risk
1. **Frontend UX changes**: User training may be needed if using Django templates
2. **Data migration errors**: Need robust validation
3. **Deployment complexity**: New Docker setup requires testing

### Low Risk
1. **API endpoint compatibility**: DRF is well-documented and stable
2. **Django ecosystem maturity**: Django is battle-tested
3. **Authentication/authorization**: Django has excellent built-in support

## Success Criteria

### Must Have
- [ ] All existing FastAPI endpoints working in Django
- [ ] WebSocket chat functionality preserved
- [ ] All LLM providers working correctly
- [ ] Wiki generation produces identical results
- [ ] Cache system working (DB or file-based)
- [ ] Export functionality working
- [ ] Authentication working
- [ ] Docker deployment working

### Should Have
- [ ] Improved performance over current setup
- [ ] Better error handling and logging
- [ ] Comprehensive test coverage (>80%)
- [ ] API documentation (DRF Spectacular)
- [ ] Admin interface for cache management
- [ ] Background task monitoring

### Nice to Have
- [ ] Improved UI/UX
- [ ] Real-time task progress indicators
- [ ] Enhanced admin dashboard
- [ ] API rate limiting
- [ ] Improved caching strategy
- [ ] Multi-tenancy support

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| 1. Django Backend Setup | 2 weeks | Django configured, models created |
| 2. API Migration | 3 weeks | All REST endpoints migrated |
| 3. Background Tasks | 1 week | Celery configured, tasks migrated |
| 4. Frontend Migration | 4 weeks | New UI functional |
| 5. Data Migration | 1 week | Existing data migrated |
| 6. Testing & QA | 1 week | All tests passing |
| 7. Deployment & DevOps | 1 week | Production deployment ready |
| 8. Documentation & Cleanup | 1 week | Complete documentation |
| **Total** | **14 weeks** | **Full Django migration** |

## Rollback Plan

If critical issues arise during migration:

1. **Keep old code in separate branch**: `main-fastapi-nextjs`
2. **Parallel deployment**: Run both stacks temporarily
3. **Feature flags**: Enable gradual rollout of Django features
4. **Data backup**: Regular backups of cache and database
5. **Monitoring**: Set up alerts for errors and performance issues

## Next Steps

1. **Review and approve this plan**
2. **Set up development environment**
3. **Create feature branch**: `django-migration`
4. **Start Phase 1: Django Backend Setup**
5. **Regular check-ins and progress reviews**

## Questions & Decisions Needed

1. **Frontend Strategy**: Confirm Option A (Django Templates + HTMX) or Option B (Django + React)?
2. **Task Queue**: Confirm Celery vs Django-Q?
3. **Database**: Confirm PostgreSQL for production?
4. **Cache Strategy**: Database vs continue with file-based?
5. **Deployment Timeline**: Phased rollout or big bang?
6. **User Communication**: How to communicate changes to existing users?

## References

- Django Documentation: https://docs.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/
- Django Channels: https://channels.readthedocs.io/
- HTMX Documentation: https://htmx.org/docs/
- Celery Documentation: https://docs.celeryproject.org/

---

**Document Version**: 1.0
**Last Updated**: 2026-01-06
**Author**: Claude
**Status**: Draft - Pending Approval
