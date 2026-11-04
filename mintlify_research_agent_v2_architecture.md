# Mintlify Research Agent v2 - Architecture Overview

## Current v1 Architecture Analysis

The current `mintlify_research_agent.py` implements a **sequential pipeline** with these stages:

1. **MintlifyFileTreeAnalyzer** - Analyzes entire repository structure
2. **MintlifyTopicGenerator** - Generates topics for the whole repository  
3. **MintlifyTopicResearcher** - Researches topics sequentially with some parallelization
4. **MintlifyContentSynthesizer** - Creates MDX files and docs.json
5. **MintlifyMDXValidator** - Validates and fixes MDX parsing errors

## Proposed v2 Architecture - Folder-Specific Parallel Processing

```ascii
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        MINTLIFY RESEARCH AGENT V2                               │
│                     Folder-Specific Parallel Processing                         │
└─────────────────────────────────────────────────────────────────────────────────┘

INPUT: Target Folder Path (e.g., "/api", "/components", "/utils")
   │
   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 1: ENHANCED FOLDER STRUCTURE ANALYZER                                   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  PHASE 1A: STRUCTURAL ANALYSIS                                         │   │
│  │  • Scan folder tree and file types                                     │   │
│  │  • Detect framework patterns (Express, FastAPI, Next.js, etc.)        │   │
│  │  • Identify file categories (routes, models, utils, tests, etc.)      │   │
│  │  • Filter out non-documentation files (logs, builds, node_modules)    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                           │
│                                    ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  PHASE 1B: PARALLEL FILE SCREENING (CHEAPEST MODEL)                   │   │
│  │                                                                         │   │
│  │  File 1 ──┐    File 2 ──┐    File 3 ──┐    File N ──┐                │   │
│  │           │             │             │             │                 │   │
│  │           ▼             ▼             ▼             ▼                 │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │   │
│  │  │ Screener 1  │ │ Screener 2  │ │ Screener 3  │ │ Screener N  │     │   │
│  │  │             │ │             │ │             │ │             │     │   │
│  │  │ • Read file │ │ • Read file │ │ • Read file │ │ • Read file │     │   │
│  │  │ • Summarize │ │ • Summarize │ │ • Summarize │ │ • Summarize │     │   │
│  │  │ • Score     │ │ • Score     │ │ • Score     │ │ • Score     │     │   │
│  │  │ • Classify  │ │ • Classify  │ │ • Classify  │ │ • Classify  │     │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘     │   │
│  │           │             │             │             │                 │   │
│  │           ▼             ▼             ▼             ▼                 │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │              FILE SCREENING RESULTS                             │ │   │
│  │  │                                                                 │ │   │
│  │  │  HIGH PRIORITY (Score 8-10):                                   │ │   │
│  │  │  • /api/routes/auth.js - "Authentication endpoints"            │ │   │
│  │  │  • /api/routes/users.js - "User management API"               │ │   │
│  │  │                                                                 │ │   │
│  │  │  MEDIUM PRIORITY (Score 5-7):                                  │ │   │
│  │  │  • /api/utils/validation.js - "Input validation helpers"      │ │   │
│  │  │                                                                 │ │   │
│  │  │  LOW PRIORITY (Score 2-4):                                     │ │   │
│  │  │  • /api/tests/auth.test.js - "Test file for auth"             │ │   │
│  │  │                                                                 │ │   │
│  │  │  SKIP (Score 0-1):                                             │ │   │
│  │  │  • /api/node_modules/* - "Dependencies"                       │ │   │
│  │  │  • /api/logs/debug.log - "Log file"                           │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                           │
│                                    ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  PHASE 1C: INTELLIGENT GROUPING & RESOURCE PLANNING                   │   │
│  │  • Group related files into logical documentation units               │   │
│  │  • Apply resource limits (max 20 parallel sub-agents)                 │   │
│  │  • Prioritize high-impact files                                       │   │
│  │  • Create execution batches if needed                                 │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 2: INTELLIGENT TASK PLANNER                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  IntelligentTaskPlanner                                                 │   │
│  │  • Generates task plan like your example:                              │   │
│  │    [ ] Examine all route files to understand overall structure/overview   │   │
│  │    [ ] Create Mintlify MDX documentation for all-access routes        │   │
│  │    [ ] Create Mintlify MDX documentation for beats routes             │   │
│  │    [ ] Create Mintlify MDX documentation for chain routes             │   │
│  │    [ ] ... (one task per logical grouping)                            │   │
│  │  • Each task targets a specific MDX file output                       │   │
│  │  • Tasks are designed for parallel execution                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 3: PARALLEL TASK EXECUTION ENGINE                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    TASK DISTRIBUTION                                    │   │
│  │                                                                         │   │
│  │  Task 1 ──┐    Task 2 ──┐    Task 3 ──┐    Task N ──┐                │   │
│  │           │             │             │             │                 │   │
│  │           ▼             ▼             ▼             ▼                 │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │   │
│  │  │ SubAgent 1  │ │ SubAgent 2  │ │ SubAgent 3  │ │ SubAgent N  │     │   │
│  │  │             │ │             │ │             │ │             │     │   │
│  │  │ • RAG Query │ │ • RAG Query │ │ • RAG Query │ │ • RAG Query │     │   │
│  │  │ • Research  │ │ • Research  │ │ • Research  │ │ • Research  │     │   │
│  │  │ • MDX Gen   │ │ • MDX Gen   │ │ • MDX Gen   │ │ • MDX Gen   │     │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘     │   │
│  │           │             │             │             │                 │   │
│  │           ▼             ▼             ▼             ▼                 │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │              PARALLEL EXECUTION RESULTS                         │ │   │
│  │  │  • all-access-routes.mdx                                        │ │   │
│  │  │  • beats-routes.mdx                                             │ │   │
│  │  │  • chain-routes.mdx                                             │ │   │
│  │  │  • ... (all MDX files generated in parallel)                   │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  STAGE 4: AGGREGATION & VALIDATION                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  ResultAggregator & MDXValidator                                        │   │
│  │  • Collects all parallel results                                       │   │
│  │  • Generates folder-specific docs.json                                 │   │
│  │  • Validates MDX syntax using @mdx-js/mdx                             │   │
│  │  • Fixes parsing errors with LLM sub-agents                           │   │
│  │  • Creates final documentation structure                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘

OUTPUT: Complete Mintlify documentation for the specified folder
```

## Key Improvements in v2

### 1. **Folder-Specific Focus**
- Instead of analyzing entire repository, focus on specific folder path
- Generate documentation tailored to that folder's purpose and structure
- More targeted and relevant documentation

### 2. **Multi-Phase File Screening**
- **Phase 1A**: Quick structural analysis and framework detection
- **Phase 1B**: Parallel file screening using cheapest model to classify and score files
- **Phase 1C**: Intelligent grouping and resource planning with limits (max 20 sub-agents)
- Prevents system overload from spawning hundreds of parallel agents

### 3. **Intelligent Task Planning**
- AI-generated task plan that understands the folder structure
- Each task corresponds to a logical documentation unit
- Tasks are designed for parallel execution from the start
- Resource-aware planning prevents system crashes

### 4. **True Parallel Processing**
- Each task runs as an independent sub-agent
- All sub-agents execute simultaneously using genai-processors
- Massive performance improvement over sequential processing
- Smart batching for large folder structures

### 5. **Smart Task Distribution with Resource Management**
```ascii
┌─────────────────────────────────────────────────────────────────┐
│                    RESOURCE-AWARE ARCHITECTURE                  │
│                                                                 │
│  500 Files Discovered                                          │
│       │                                                        │
│       ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  SCREENING PHASE (Parallel, Cheap Model)               │   │
│  │  • 500 files → 500 screeners (lightweight)            │   │
│  │  • Fast classification and scoring                     │   │
│  │  • Filter out 300 irrelevant files                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                        │
│       ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GROUPING PHASE                                         │   │
│  │  • 200 relevant files → 15 logical groups             │   │
│  │  • Group by: routes, models, utils, components        │   │
│  │  • Respect resource limits (max 20 sub-agents)        │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                                        │
│       ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  EXECUTION PHASE (Parallel, Smart Model)               │   │
│  │  • 15 sub-agents (each handles multiple files)        │   │
│  │  • Rich documentation generation                       │   │
│  │  • Proper resource utilization                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 6. **Enhanced RAG Strategy**
- Each sub-agent gets a focused file scope for RAG queries
- More precise and relevant documentation content
- Reduced context pollution from irrelevant files

### 7. **Scalable Architecture with Cost Optimization**
- **Screening Phase**: Use cheapest model (e.g., `gemini-2.0-flash-thinking`) for file classification
- **Documentation Phase**: Use smarter model (e.g., `gemini-2.5-pro`) only for selected files
- **Batch Processing**: Group related files to reduce context switching
- **Progressive Enhancement**: Generate core docs first, then expand

## Implementation Components

### Core Classes:
1. **EnhancedFolderStructureAnalyzer** - Multi-phase folder analysis with file screening
2. **FileScreener** - Lightweight parallel file classification using cheapest model
3. **IntelligentTaskPlanner** - Creates resource-aware parallel task execution plan
4. **ParallelTaskExecutor** - Manages sub-agent distribution with resource limits
5. **MintlifySubAgent** - Individual task processor (inherits from PartProcessor)
6. **ResultAggregator** - Collects and synthesizes parallel results
7. **MDXValidator** - Validates and fixes generated MDX files

### Enhanced Workflow:
```
Input Folder → Structural Analysis → File Screening → Intelligent Grouping →
Resource Planning → Parallel Execution → Aggregation → Validation → Output
```

### Framework-Specific Intelligence:
```ascii
┌─────────────────────────────────────────────────────────────────┐
│                    FRAMEWORK DETECTION                         │
│                                                                 │
│  Express.js Detected:                                          │
│  ├── routes/*.js → HIGH PRIORITY (API endpoints)              │
│  ├── middleware/*.js → MEDIUM PRIORITY (middleware docs)      │
│  ├── models/*.js → HIGH PRIORITY (data models)               │
│  ├── controllers/*.js → HIGH PRIORITY (business logic)       │
│  ├── utils/*.js → MEDIUM PRIORITY (utilities)                │
│  └── tests/*.js → LOW PRIORITY (testing docs)                │
│                                                                 │
│  Next.js Detected:                                             │
│  ├── pages/api/*.js → HIGH PRIORITY (API routes)             │
│  ├── components/*.jsx → HIGH PRIORITY (UI components)        │
│  ├── hooks/*.js → MEDIUM PRIORITY (custom hooks)             │
│  ├── utils/*.js → MEDIUM PRIORITY (utilities)                │
│  └── __tests__/*.js → LOW PRIORITY (tests)                   │
│                                                                 │
│  FastAPI Detected:                                             │
│  ├── routers/*.py → HIGH PRIORITY (API endpoints)            │
│  ├── models/*.py → HIGH PRIORITY (data models)               │
│  ├── dependencies/*.py → MEDIUM PRIORITY (dependencies)      │
│  └── tests/*.py → LOW PRIORITY (tests)                       │
└─────────────────────────────────────────────────────────────────┘
```

### File Scoring System (0-10):
- **10**: Core API endpoints, main components, public interfaces
- **8-9**: Important business logic, key utilities, configuration
- **5-7**: Supporting files, helpers, secondary features
- **2-4**: Tests, examples, documentation files
- **0-1**: Build files, logs, dependencies, generated code

This architecture will be significantly faster and more scalable than the current sequential approach, while providing more focused and relevant documentation for specific folder structures. The multi-phase screening prevents system overload and optimizes cost by using cheaper models for classification before expensive documentation generation.
