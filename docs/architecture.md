---
title: Architecture
sidebar_label: Architecture
---

# 🔍 How It Works

DeepWiki uses AI to:

1. Clone and analyze the GitHub, GitLab, or Bitbucket repository (including private repos with token authentication)
2. Create embeddings of the code for smart retrieval
3. Generate documentation with context-aware AI (using Google Gemini, OpenAI, OpenRouter, or local Ollama models)
4. Create visual diagrams to explain code relationships
5. Organize everything into a structured wiki
6. Enable intelligent Q&A with the repository through the Ask feature
7. Provide in-depth research capabilities with DeepResearch

```mermaid
graph TD
    A[User inputs GitHub/GitLab/Bitbucket repo] --> AA{Private repo?}
    AA -->|Yes| AB[Add access token]
    AA -->|No| B[Clone Repository]
    AB --> B
    B --> C[Analyze Code Structure]
    C --> D[Create Code Embeddings]

    D --> M{Select Model Provider}
    M -->|Google Gemini| E1[Generate with Gemini]
    M -->|OpenAI| E2[Generate with OpenAI]
    M -->|OpenRouter| E3[Generate with OpenRouter]
    M -->|Local Ollama| E4[Generate with Ollama]

    E1 --> E[Generate Documentation]
    E2 --> E
    E3 --> E
    E4 --> E

    D --> F[Create Visual Diagrams]
    E --> G[Organize as Wiki]
    F --> G
    G --> H[Interactive DeepWiki]

    classDef process stroke-width:2px;
    classDef data stroke-width:2px;
    classDef result stroke-width:2px;
    classDef decision stroke-width:2px;

    class A,D data;
    class AA,M decision;
    class B,C,E,F,G,AB,E1,E2,E3,E4 process;
    class H result;
```