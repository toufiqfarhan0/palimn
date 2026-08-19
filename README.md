# PALIMN: Temporal Memory for AI Agents

> **HackHydra 2026 — Track 3: Memory + Context Retrieval**
> Cross-session continuity, chronological reasoning, explicit revision lineage, and calibrated abstention for long-horizon AI agents.

---

## Key Differentiators

Unlike flat vector search engines that suffer from recency bias or overwrite historical data, **PALIMN** represents agent memories as an evolving temporal graph in **HydraDB Cloud** (Database: `palimn-memory`):

1. **Explicit Revision Lineage (`SUPERSEDES`)**: Preserves the complete historical evolution of facts across 40+ sessions (~115K tokens) without destructive overwrites.
2. **First-Class Abstention**: Distinguishes answerable questions from `insufficient_evidence`, `no_matching_memory`, and `temporal_ambiguity` with calibrated confidence.
3. **Graph-Native Hybrid Retrieval**: Combines Cypher traversals in HydraDB Cloud with temporal window ranking and evidence provenance.
4. **Deterministic Graph Foundation**: Clean separation between graph-native temporal logic and downstream LLM synthesis. *PALIMN does not use an LLM in Phase 2 or Phase 3.*
5. **LongMemEval_S Benchmark Suite**: Reproducible evaluation harness with verified empirical metrics and strict oracle isolation.

---

## Architecture

```
Browser (React + Vite + Tailwind + React Flow)
                      │
                      ▼
            FastAPI Backend Engine
                      │
                      ▼
                HydraDB Cloud
          (Database: palimn-memory)
```

- **Frontend**: React 18, Vite, TypeScript (strict mode), Tailwind CSS (Dark Graphite / Violet UI), React Flow graph inspector.
- **Backend**: FastAPI, Pydantic v2, Async HTTPX client.
- **Database**: HydraDB Cloud (`HYDRA_MODE=cloud`, `HYDRA_DB_API_KEY`, `HYDRA_DB_DATABASE=palimn-memory`, `HYDRA_DB_BASE_URL=https://api.hydradb.com`).
- **Benchmark**: LongMemEval_S dataset loader with chronological session normalization and oracle isolation.

---

## Quickstart Setup

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your **HydraDB Cloud** credentials from the [HydraDB Dashboard](https://dashboard.hydradb.com/databases):
```env
HYDRA_MODE=cloud
HYDRA_DB_API_KEY=your_hydradb_api_key_here
HYDRA_DB_DATABASE=palimn-memory
HYDRA_DB_BASE_URL=https://api.hydradb.com
PORT=8000
```
*(Note: If credentials are not yet configured, the system starts safely and reports `HydraDB (Unconfigured)` in the health status indicator without crashing).*

### 3. Backend Setup
```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r backend/requirements.txt
```

Seed the Synthetic Temporal Memory Graph:
```bash
python scripts/seed_temporal_memory.py
```

Ingest a LongMemEval_S Record (Single-Record Controlled Scope):
```bash
python scripts/ingest_longmemeval.py --question-id e47becba
```

Run One-Question Evaluation:
```bash
python scripts/run_one_question_eval.py --question-id e47becba
```

Run Backend Server:
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Run Backend Tests (35 Tests):
```bash
pytest -v
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Temporal Query Matrix (Phase 2 Verified)

| # | Question | Expected Output | Decision | Mechanism |
|---|---|---|---|---|
| **1** | *"Where do I live now?"* | `Hyderabad` | `answerable` | Active fact retrieval (`status: 'active'`) |
| **2** | *"Where did I live before Hyderabad?"* | `Bangalore` | `answerable` | `SUPERSEDES` revision lineage traversal |
| **3** | *"Where did I live in Session 01?"* | `Bangalore` | `answerable` | Session-scoped temporal filtering |
| **4** | *"Where did I live in Session 02?"* | `Hyderabad` | `answerable` | Session-scoped temporal filtering |
| **5** | *"Where did I live in Session 99?"* | *None* | `abstain` (`no_matching_memory`) | Missing-information abstention |
| **6** | *"What city do I currently live in?"* | `Hyderabad` | `answerable` | Current-state retrieval |
| **7** | *"What city did I previously live in?"* | `Bangalore` | `answerable` | Historical-state retrieval |

---

## LongMemEval_S Integration (Phase 3 Verified)

- **Dataset**: `LongMemEval_S` (`longmemeval_s_cleaned.json`) containing 500 multi-session evaluation instances.
- **Exclusions**: LongMemEval V2 and BEAM are **not** currently used.
- **Oracle Isolation**: The retrieval engine operates strictly on question content and time context. Gold answers and oracle evidence flags are evaluated only in a separate post-retrieval layer.
- **Reproducibility**: Ingestion generates deterministic message IDs (`msg_{qid}_s{sidx}_m{midx}`) and preserves strict chronological `[:PRECEDES]` session ordering.

---

## Project Structure

```
palimn/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entrypoint & middleware
│   │   ├── core/config.py       # Pydantic Settings & environment validation
│   │   ├── api/                 # API Routers (health, chat, memory, graph, benchmark)
│   │   ├── memory/              # Extraction, entities, temporal grounder, revisions
│   │   ├── retrieval/           # Query analysis, graph retrieval, temporal ranking, evidence
│   │   ├── benchmark/           # LongMemEval_S loader, models, and oracle-isolated evaluator
│   │   └── hydra/               # HydraDB Cloud client, schema, Cypher queries
│   ├── tests/                   # Pytest async test suite (35 tests)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, HealthBadge, NodeInspector
│   │   ├── pages/               # ChatPage, GraphPage, BenchmarkPage
│   │   └── lib/api.ts           # Typed API Client
│   ├── package.json
│   └── vite.config.ts
├── benchmark/
│   ├── runner.py                # LongMemEval_S benchmark executor
│   ├── evaluator.py             # Empirical metrics calculator
│   ├── data/                    # Dataset storage (gitignored)
│   └── results/                 # Verified benchmark artifacts
├── scripts/
│   ├── seed_temporal_memory.py  # Idempotent synthetic memory graph seeder
│   ├── ingest_longmemeval.py    # Controlled LongMemEval_S ingestion script
│   ├── run_one_question_eval.py # Single-question oracle-isolated evaluation script
│   ├── reset_database.py        # Safe database reset
│   └── run_benchmark.py         # CLI benchmark runner
├── docs/
│   ├── architecture.md          # System architecture
│   ├── memory-model.md          # Graph ontology and revision rules
│   └── benchmark.md             # Benchmark methodology & LongMemEval_S schema
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## License

MIT License.
