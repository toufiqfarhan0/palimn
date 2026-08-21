# PALIMN: Temporal Memory for AI Agents

> **HackHydra 2026 — Track 3: Memory + Context Retrieval**
> Cross-session continuity, chronological reasoning, explicit revision lineage, and calibrated abstention for long-horizon AI agents.

---
## Key Features & Differentiators

Unlike flat vector search engines that suffer from recency bias or overwrite historical data, **PALIMN** represents agent memories as an evolving temporal graph in **HydraDB Cloud** (Database: `palimn-memory`):

1. **Explicit Revision Lineage (`SUPERSEDES`)**: Preserves the complete historical evolution of facts across 40+ sessions (~115K tokens) without destructive overwrites.
2. **Decoupled Bi-Temporal Memory Engine ($T_v \times T_a$)**: Decouples real-world **Valid Time** ($T_v$, when a fact occurred in reality) from agent **Assertion Time** ($T_a$, when the agent learned it). Enables retroactive updates (e.g. learning in Session 3 about events from 2019–2020) and calibrated point-in-time flashback reconstruction with zero knowledge leakage.
3. **First-Class Abstention Engine**: Distinguishes answerable questions from `insufficient_evidence`, `no_matching_memory`, and `conflicting_evidence` with calibrated confidence.
4. **Bi-Temporal Matrix Inspector**: Interactive 2D slice evaluator with scenario presets and real-time fact lineage ribbons.
5. **Temporal Diff Inspector**: Side-by-side memory mutation tracking to observe fact state changes and decay evolution over time.
6. **Visual Query Builder**: Interactive filter constructor for metadata predicates, point-in-time bounds, and intent constraints.
7. **Developer & SDK Integration Hub**: Ready-to-use snippets for Python SDK, TypeScript/Node, cURL, and LangChain/LlamaIndex adapters with an interactive test runner.
8. **LongMemEval Benchmark Suite & Batch Exporter**: Reproducible evaluation harness with latency histograms, recall metrics, and JSON/CSV export capabilities.
9. **Graph-Native Retrieval in HydraDB**: Native graph traversals linking entities, sessions, and temporal validity intervals rather than flat vector embeddings.

---

## Architecture

```
Browser (React 18 + Vite + Tailwind + Interactive Graph Canvas + Bi-Temporal Inspector)
                      │
                      ▼
            FastAPI Backend Engine
                      │
                      ▼
                 HydraDB Cloud
           (Database: palimn-memory)
```

- **Frontend**: React 18, Vite, TypeScript (strict mode), Tailwind CSS, Lucide Icons, Plus Jakarta Sans typography.
- **Backend**: FastAPI, Pydantic v2, Async HTTPX client.
- **Database**: HydraDB Cloud (`HYDRA_MODE=cloud`, `HYDRA_DB_API_KEY`, `HYDRA_DB_DATABASE=palimn-memory`, `HYDRA_DB_BASE_URL=https://api.hydradb.com`).
- **Benchmark**: LongMemEval dataset loader with chronological session normalization and oracle isolation.

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

Run Backend Server:
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Run Backend Tests (83 Tests Passing):
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

## Temporal Query Matrix (Verified)

| # | Question / Query Slice | Expected Output | Decision | Mechanism |
|---|---|---|---|---|
| **1** | *"Where do I live now?"* | `Hyderabad` | `answerable` | Active fact retrieval (`status: 'active'`) |
| **2** | *"Where did I live before Hyderabad?"* | `Bangalore` | `answerable` | `SUPERSEDES` revision lineage traversal |
| **3** | *"Where did I live in 2021?"* | `Bangalore` | `answerable` | Valid-time point-in-time extraction ($T_v=\text{'2021'}$) |
| **4** | *"Where did I live in 2019?"* | `Tokyo` | `answerable` | Retroactive memory resolution ($T_v=\text{'2019-2020'}$) |
| **5** | *"Where did I live in Session 01?"* | `Bangalore` | `answerable` | Session-scoped temporal filtering |
| **6** | *"Where did I live in Session 02?"* | `Hyderabad` | `answerable` | Session-scoped temporal filtering |
| **7** | *"Where did I live in Session 99?"* | *None* | `abstain` (`no_matching_memory`) | Missing-information abstention |
| **8** | *$T_v=\text{'2020'} \times T_a=\text{'2025-01'}$* | *None* | `abstain` | Knowledge leakage prevention (Tokyo not yet asserted) |
| **9** | *"What city do I currently live in?"* | `Hyderabad` | `answerable` | Current-state retrieval |
| **10** | *"What city did I previously live in?"* | `Bangalore` | `answerable` | Historical-state retrieval |

---

## LongMemEval Integration

- **Dataset**: `LongMemEval` multi-session evaluation instances (30–40 sessions, ~115K tokens).
- **Oracle Isolation**: The retrieval engine operates strictly on question content and time context. Gold answers and oracle evidence flags are evaluated only in a separate post-retrieval layer.
- **Reproducibility**: Ingestion generates deterministic message IDs (`msg_{qid}_s{sidx}_m{midx}`) and preserves strict chronological session ordering.

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
│   │   ├── benchmark/           # LongMemEval loader, models, and oracle-isolated evaluator
│   │   └── hydra/               # HydraDB Cloud client, schema, Cypher queries
│   ├── tests/                   # Pytest async test suite (74 tests)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # VisualQueryBuilder, TemporalDiffInspector, LiveSimulator, IntegrationHub
│   │   ├── pages/               # HomePage, ChatPage, GraphPage, BenchmarkPage, ArchitecturePage
│   │   └── lib/api.ts           # Typed API Client
│   ├── package.json
│   └── vite.config.ts
├── benchmark/
│   ├── runner.py                # LongMemEval benchmark executor
│   ├── evaluator.py             # Empirical metrics calculator
│   └── results/                 # Verified benchmark artifacts
├── scripts/
│   ├── generate_voiceover.py    # Neural TTS voiceover generator for demo
│   ├── seed_temporal_memory.py  # Idempotent synthetic memory graph seeder
│   ├── ingest_longmemeval.py    # Controlled LongMemEval ingestion script
│   └── reset_database.py        # Safe database reset
├── docs/
│   ├── architecture.md          # System architecture
│   ├── memory-model.md          # Graph ontology and revision rules
│   └── benchmark.md             # Benchmark methodology
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## License

MIT License.

