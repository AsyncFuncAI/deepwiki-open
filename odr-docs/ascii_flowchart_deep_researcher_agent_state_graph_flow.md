# Deep Researcher Agent State Graph Flow

This flowchart visualizes the internal StateGraph flow of the Deep Researcher agent. It illustrates the main agent's progression from initial clarification to final report generation, highlighting the nested Supervisor and Researcher subgraphs that handle iterative planning and research using langgraph.types.Command for state transitions.

```ascii
┌──────────────────────────────────────────────────────────────────────────────┐
│                  Deep Researcher Agent State Graph Flow                      │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                              ┌─────────┐
                              │  START  │
                              └─────────┘
                                    │
                                    │ Command(goto="clarify_with_user")
                                    ▼
                        ┌─────────────────────┐
                        │ Clarify with User   │
                        │ (Returns ClarifyWithUser)
                        └─────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │ Yes (clarify needed)  │ No (ready to research)│
          │ Command(goto=END)     │ Command(goto="write_research_brief")
          ▼                       ▼                       ▼
    ┌─────────┐             ┌───────────────────┐
    │   END   │             │ Write Research    │
    └─────────┘             │ Brief             │
                            │ (Returns ResearchQuestion)
                            └───────────────────┘
                                    │
                                    │ Command(goto="research_supervisor")
                                    ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │                  Research Supervisor (Subgraph)                      │
    │  (See "Supervisor Subgraph Flow" below)                                │
    │  Orchestrates research iterations using ConductResearch/ResearchComplete.
    └────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Command(goto="final_report_generation")
                                    ▼
                        ┌─────────────────────┐
                        │ Final Report        │
                        │ Generation          │
                        └─────────────────────┘
                                    │
                                    │ Command(goto=END)
                                    ▼
                              ┌─────────┐
                              │   END   │
                              └─────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                    Supervisor Subgraph Flow (Internal)                       │
└──────────────────────────────────────────────────────────────────────────────┘
                              ┌─────────┐
                              │  START  │
                              └─────────┘
                                    │
                                    │ Command(goto="supervisor")
                                    ▼
                        ┌─────────────────────┐
                        │     Supervisor      │
                        │ (Plans research,    │
                        │  uses ConductResearch,
                        │  ResearchComplete tools)
                        └─────────────────────┘
                                    │
                                    │ Command(goto="supervisor_tools")
                                    ▼
                        ┌─────────────────────┐
                        │  Supervisor Tools   │
                        │ (Executes tools,    │
                        │  gathers results)   │
                        └─────────────────────┘
          ┌───────────────────────┼───────────────────────┐
          │ Loop: Cmd(goto="supervisor")                  │ Exit: Cmd(goto=END)
          │ (if more research needed)                     │ (if research complete)
          ▼                                               ▼
    ┌─────────────────────┐                             ┌─────────┐
    │     Supervisor      │◄────────────────────────────┤   END   │
    └─────────────────────┘                             └─────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                     Researcher Subgraph Flow (Internal)                      │
└──────────────────────────────────────────────────────────────────────────────┘
                              ┌─────────┐
                              │  START  │
                              └─────────┘
                                    │
                                    │ Command(goto="researcher")
                                    ▼
                        ┌─────────────────────┐
                        │     Researcher      │
                        │ (Performs actual    │
                        │  research using tools) 
                        └─────────────────────┘
                                    │
                                    │ Command(goto="researcher_tools")
                                    ▼
                        ┌─────────────────────┐
                        │  Researcher Tools   │
                        │ (Executes tools,    │
                        │  gathers observations)
                        └─────────────────────┘
          ┌───────────────────────┼───────────────────────┐
          │ Loop: Cmd(goto="researcher")                  │ Exit: Cmd(goto="compress_research")
          │ (if more tool calls needed)                   │ (if done with tools)
          ▼                                               ▼
    ┌─────────────────────┐                             ┌───────────────────┐
    │     Researcher      │◄────────────────────────────┤ Compress Research │
    └─────────────────────┘                             └───────────────────┘
                                                                    │
                                                                    │ Command(goto=END)
                                                                    ▼
                                                              ┌─────────┐
                                                              │   END   │
                                                              └─────────┘
```

---

*Generated by ASCII Research Agent - Clean architectural visualization*
