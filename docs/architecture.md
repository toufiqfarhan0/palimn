# PALIMN Architecture

**Temporal Memory for AI Agents** — HackHydra 2026 Track 3

## Overview

PALIMN is an agent memory layer designed to maintain cross-session continuity over 30–40 conversation sessions (~115,000 tokens). Unlike standard vector search which collapses temporal revision lineage into flat cosine similarity, PALIMN builds and queries a temporal memory graph stored in **HydraDB Cloud**.

```
[ User Query / Chat UI ]
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│                   FastAPI Backend                       │
│                                                         │
│  1. Query Analyzer       (Entities, Predicates, Time)   │
│  2. Graph Retriever      (HydraDB Cypher Traversal)     │
│  3. Temporal Ranker      (Revision & Validity Filter)   │
│  4. Evidence Aggregator  (Provenance & Confidence)      │
│  5. Decision Engine      (Answerable vs. Abstain)       │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    HydraDB Cloud                        │
│                                                         │
│  Nodes: User, Session, Message, Entity, Fact, Event     │
│  Edges: SUPERSEDES, CONTRADICTS, ABOUT, SUPPORTS        │
└─────────────────────────────────────────────────────────┘
```

## Core Design Principles

1. **Explicit Revision Lineage**: When newer facts contradict older facts (e.g. moving from Bangalore to Hyderabad), the graph does not overwrite or delete historical memory. It sets `status = 'superseded'` on the previous fact and links the new fact with a `[:SUPERSEDES]` relationship.
2. **First-Class Abstention**: When information is absent, contradictory, or ambiguous, PALIMN abstains with structured reasoning rather than hallucinating answers.
3. **Graph-Native Traversal**: Multi-hop and temporal queries leverage indexed Cypher traversals in HydraDB Cloud rather than brute-force vector scans.
4. **Resilient Cloud Integration**: HydraDB Cloud communication is strictly encapsulated in `backend/app/hydra/client.py` with non-blocking status verification and zero local container dependencies.
