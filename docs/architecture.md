# PALIMN Architecture

**Temporal Memory for AI Agents** — HackHydra 2026 Track 3

## Overview

PALIMN is an agent memory layer designed to maintain cross-session continuity over 30–40 conversation sessions (~115,000 tokens). Unlike standard vector search which collapses temporal revision lineage into flat cosine similarity, PALIMN builds and queries a temporal memory graph stored in **HydraDB Cloud** (dedicated database: `palimn-memory`).

> **Note on Phase 2**: PALIMN operates completely without an LLM or vector embeddings in Phase 2. All extraction, revision tracking, traversal, and abstention decisions are deterministic.

```
[ User Query / Chat UI / API ]
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│                   FastAPI Backend                       │
│                                                         │
│  1. Query Analyzer       (Deterministic Intent Parse)   │
│  2. Graph Retriever      (HydraDB Cypher Traversal)     │
│  3. Temporal Ranker      (Revision & Validity Filter)   │
│  4. Evidence Aggregator  (Provenance & Confidence)      │
│  5. Decision Engine      (Answerable vs. Abstain)       │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    HydraDB Cloud                        │
│            (Database: palimn-memory)                    │
│                                                         │
│  Nodes: User, Session, Message, Entity, Fact, Event,    │
│         Preference, Topic                               │
│  Edges: HAS_SESSION, PRECEDES, CONTAINS, MENTIONS,      │
│         SUPPORTS, SUPPORTED_BY, ABOUT, SUPERSEDES,      │
│         CONTRADICTS, RELATED_TO, OCCURRED_IN            │
└─────────────────────────────────────────────────────────┘
```

## Core Design Principles

1. **Explicit Revision Lineage (`SUPERSEDES`)**: When newer facts contradict older facts (e.g. moving from Bangalore to Hyderabad), the graph preserves both facts. The previous fact is transitioned to `status = 'superseded'` with `valid_until` updated, and the new fact points backwards via `[:SUPERSEDES]`.
2. **First-Class Abstention**: When information is absent (e.g. Session 99) or unrecorded, PALIMN abstains deterministically with structured reasoning rather than hallucinating answers.
3. **Graph-Native Traversal**: Multi-hop and temporal queries leverage indexed Cypher traversals in HydraDB Cloud rather than brute-force vector scans.
4. **Resilient Cloud Integration**: HydraDB Cloud communication is strictly encapsulated in `backend/app/hydra/client.py` with fallback synchronization for offline deterministic test execution.
