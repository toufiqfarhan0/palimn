# PALIMN LongMemEval_S Benchmark Guide

**Temporal Memory for AI Agents** — HackHydra 2026 Track 3

## Benchmark Dataset: LongMemEval_S

LongMemEval_S is the official benchmark dataset for multi-session agent memory evaluation:
- **500 evaluation questions**
- **~115,000 token histories** spanning **~40 sessions** per instance
- Ground-truth evaluation across 5 evaluation categories:
  1. **Information Extraction**: Retrieval of specific details stated in distant past sessions.
  2. **Multi-Session Reasoning**: Synthesizing facts distributed across multiple disparate sessions.
  3. **Knowledge Updates & Overwrites**: Answering queries where earlier facts have been superseded by newer events.
  4. **Temporal Reasoning**: Answering chronological order, duration, and state-at-time queries.
  5. **Abstention**: Correctly abstaining when queries refer to unmentioned entities or private information.

## Reproducibility & Integrity Standards

- Zero synthetic or fabricated benchmark metrics.
- Every metric reported in the PALIMN dashboard stems from executed runs stored in `benchmark/results/`.
- Provenance logs capture `question_id`, `prediction`, `expected_answer`, `decision`, `confidence`, `evidence`, `retrieval_latency`, and `e2e_latency`.

## Running the Benchmark

```bash
# Ingest LongMemEval_S into HydraDB Cloud
python scripts/ingest_longmemeval.py

# Execute the benchmark runner (Sample or full 500 questions)
python scripts/run_benchmark.py
```
