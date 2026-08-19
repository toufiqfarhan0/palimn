# PALIMN LongMemEval_S Benchmark Guide

**Temporal Memory for AI Agents** — HackHydra 2026 Track 3

## Benchmark Overview: LongMemEval_S

PALIMN uses **LongMemEval_S** (`longmemeval_s_cleaned.json`) as its primary benchmark dataset for multi-session agent memory evaluation:
- **500 evaluation questions**
- **~115,000 token histories** spanning **~40–55 sessions** (~500–600 turns) per instance
- **Official Repository**: [https://github.com/xiaowu0162/LongMemEval](https://github.com/xiaowu0162/LongMemEval)

> **Important Scope Restrictions**:
> - **LongMemEval_S** is the **ONLY** dataset integrated in Phase 3.
> - **LongMemEval V2** is **NOT** currently used.
> - **BEAM** is **NOT** currently used.
> - The raw dataset is kept in local/temporary storage and **never committed to Git**.
> - **No LLM** is used in Phase 3. Ingestion faithfully maps conversation turns and chronology directly into HydraDB Cloud.

---

## Discovered Dataset Schema

Each instance in `longmemeval_s_cleaned.json` is a JSON object with the following fields:

| Field | Type | Description | Oracle/Evaluation Only? |
| :--- | :--- | :--- | :--- |
| `question_id` | `string` | Unique identifier (e.g. `e47becba`, `gpt4_59149c77`, ending in `_abs` for abstention) | No |
| `question_type` | `string` | Task category (`single-session-user`, `temporal-reasoning`, `knowledge-update`, `multi-session`, etc.) | No |
| `question` | `string` | The prompt question testing agent memory | No |
| `question_date` | `string` | Natural date string of the question turn (e.g. `2023/05/30 (Tue) 23:40`) | No |
| `haystack_session_ids` | `list[string]`| List of session IDs in the history | No |
| `haystack_dates` | `list[string]`| List of date strings for each session | No |
| `haystack_sessions` | `list[list[turn]]` | List of chat sessions, where each turn is `{"role": "user"|"assistant", "content": "..."}` | No |
| `answer` | `string|int|float` | Expected ground truth answer | **YES (Oracle)** |
| `answer_session_ids` | `list[string]` | Session IDs containing the gold evidence | **YES (Oracle)** |
| `has_answer` | `bool` | Turn-level oracle evidence indicator | **YES (Oracle)** |

---

## Strict Oracle Isolation Architecture

To guarantee evaluation integrity and prevent oracle leakage:

```
┌────────────────────────────────────────────────────────┐
│               RETRIEVAL INPUT LAYER                    │
│   question, question_date, user_id, graph snapshot     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               RETRIEVAL ENGINE (PALIMN)                │
│   Deterministic query decomposition & graph traversal  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               RETRIEVAL OUTPUT                         │
│   prediction, decision, confidence, evidence           │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼  [Post-Retrieval Comparison Only]
┌────────────────────────────────────────────────────────┐
│               EVALUATION LAYER                         │
│   expected_answer, answer_session_ids, exact_match     │
└────────────────────────────────────────────────────────┘
```

- The retrieval engine **NEVER** accesses `answer`, `answer_session_ids`, or `has_answer`.
- Gold metadata is evaluated only after predictions and decisions are generated.

---

## Ingesting LongMemEval_S into HydraDB Cloud

Single-record ingestion is the controlled Phase 3 scope:

```bash
# Ingest single record by ID
python scripts/ingest_longmemeval.py --question-id e47becba

# Ingest first N records (default: 1)
python scripts/ingest_longmemeval.py --limit 1
```

Evaluate single question with oracle isolation:
```bash
python scripts/run_one_question_eval.py --question-id e47becba
```
