# PALIMN LongMemEval_S Benchmark Guide & Full Evaluation

**PALIMN: Temporal Memory for AI Agents** — HackHydra 2026 Track 3

---

## 1. Benchmark Overview: LongMemEval_S

PALIMN uses the complete **LongMemEval_S** (`longmemeval_s_cleaned.json`) benchmark dataset for multi-session agent memory evaluation:
- **500 evaluation questions** (Complete benchmark, zero cherry-picking, zero skipping)
- **23,867 sessions** across **500 user histories**
- **246,750 conversation messages**
- **Official Repository**: [https://github.com/xiaowu0162/LongMemEval](https://github.com/xiaowu0162/LongMemEval)

> **Architectural Guardrails**:
> - **LongMemEval_S** is the **ONLY** dataset evaluated.
> - **LongMemEval V2** and **BEAM** are **NOT** used.
> - **0 LLM calls**
> - **0 Embeddings**
> - **0 Vector databases**
> - **0 External ML models**
> - **HydraDB Cloud** is the primary persistent temporal graph engine.

---

## 2. Benchmark Methodology & Strict Oracle Isolation

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
- Each question is mapped to its own isolated user namespace (`user_<question_id>`), ensuring zero cross-record leakage.

---

## 3. Benchmark Comparisons (Phase 7 vs Phase 8 vs Phase 9)

| Metric | Phase 7 (Dev Sample) | Phase 8 (Dev Sample) | Phase 9 (Full Benchmark) |
| :--- | :--- | :--- | :--- |
| **Total Questions** | 10 | 100 | **500** |
| **Exact Match Accuracy** | 20.00% (2/10) | 20.00% (20/100) | **7.60% (38/500)** |
| **Recall@1** | 70.00% | 85.00% | **80.80%** |
| **Recall@5** | 90.00% | 96.00% | **91.60%** |
| **Recall@10** | 90.00% | 99.00% | **94.40%** |
| **Recall@20** | 100.00% | 100.00% | **96.60%** |
| **Multi-Session Accuracy** | 0.00% (0/2) | 10.00% (2/20) | **9.02% (12/133)** |
| **Single-Session Accuracy** | 33.33% (1/3) | 26.67% (8/30) | **11.54% (18/156)** |
| **Single-Session-User Accuracy**| 33.33% | 35.00% | **24.29% (17/70)** |
| **False Answer Rate (Abstention Subset)** | 0.00% | 0.00% | **30.00% (9/30)** |
| **Overall False Answer Rate** | 0.00% | 0.00% | **1.80% (9/500)** |
| **Correct Abstention Rate** | 100.00% | 100.00% | **70.00% (21/30)** |
| **False Abstention Rate** | 87.50% | 78.89% | **74.68% (351/470)** |
| **Average Latency** | 760.00 ms | 929.01 ms | **495.02 ms** |
| **P50 Latency** | 720.00 ms | 736.49 ms | **349.56 ms** |
| **P95 Latency** | 1050.00 ms | 1450.00 ms | **968.76 ms** |
| **Max Latency** | 1200.00 ms | 2150.00 ms | **26106.01 ms** |

---

## 4. Question Type Breakdown (Full 500 Questions)

| Question Type | Count | Exact Match | Recall@5 | Answerable / Abstain | Avg Latency |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `single-session-user` | 70 | **24.29%** | 95.71% | 19 / 51 | 475.12 ms |
| `multi-session` | 133 | **9.02%** | 96.99% | 40 / 93 | 428.22 ms |
| `single-session-preference` | 30 | **0.00%** | 40.00% | 3 / 27 | 325.87 ms |
| `temporal-reasoning` | 133 | **3.01%** | 90.98% | 34 / 99 | 382.19 ms |
| `knowledge-update` | 78 | **5.13%** | 98.72% | 20 / 58 | 775.71 ms |
| `single-session-assistant` | 56 | **1.79%** | 92.86% | 12 / 44 | 646.15 ms |
| **Total / Aggregate** | **500** | **7.60%** | **91.60%** | **128 / 372** | **495.02 ms** |

---

## 5. Failure Taxonomy & Bottleneck Analysis

Out of 462 non-exact match outcomes:

| Failure Category | Count | Percentage | Primary Cause |
| :--- | :--- | :--- | :--- |
| **`fact_extraction`** | 302 | 65.37% | Deterministic open-domain pattern absence; system safely abstains |
| **`cross_session_composition`** | 118 | 25.54% | Facts distributed across multiple haystack sessions without LLM synthesis |
| **`candidate_retrieval`** | 17 | 3.68% | Target session not captured within Top-20 retrieved messages |
| **`entity_binding`** | 12 | 2.60% | Extracted entity contains partial tokens or modifiers |
| **`abstention`** | 9 | 1.95% | False answer on unanswerable query turn |
| **`revision_resolution`** | 3 | 0.65% | Predecessor/historical state resolution edge mismatch |
| **`temporal_reasoning`** | 1 | 0.22% | Temporal anchor misaligned with question date |

### Key Diagnostic Conclusion
- **Retrieval is NOT the bottleneck**: HydraDB graph candidate retrieval achieves **96.60% Recall@20** and **91.60% Recall@5**.
- **Downstream Extraction / Composition is the bottleneck**: In a 100% deterministic, 0-LLM pipeline, unbounded natural language variations in open-domain questions cannot all be parsed by non-ML rules, causing the conservative decision engine to abstain rather than hallucinate.

---

## 6. How to Run the Benchmark

```bash
# Ingest and evaluate full 500-question benchmark
python scripts/run_benchmark.py --limit 500 --output benchmark/results/longmemeval_s_500_results.json

# Analyze failures
python scripts/analyze_failures.py --report benchmark/results/longmemeval_s_500_results.json
```
