# PALIMN: Temporal Memory for AI Agents

> **HackHydra 2026 — Track 3: Memory + Context Retrieval**
> Cross-session continuity, chronological reasoning, explicit revision lineage, and calibrated abstention for long-horizon AI agents.

---

## Key Differentiators

Unlike flat vector search engines that suffer from recency bias or overwrite historical data, **PALIMN** represents agent memories as an evolving temporal graph in **HydraDB Cloud**:

1. **Explicit Revision Lineage (`SUPERSEDES`)**: Preserves the complete historical evolution of facts across 40+ sessions (~115K tokens) without destructive overwrites.
2. **First-Class Abstention**: Distinguishes answerable questions from `insufficient_evidence`, `no_matching_memory`, and `temporal_ambiguity` with calibrated confidence.
3. **Graph-Native Hybrid Retrieval**: Combines Cypher traversals in HydraDB Cloud with temporal window ranking and evidence provenance.
4. **Deterministic Graph Foundation**: Clean separation between graph-native temporal logic and downstream LLM synthesis.
5. **LongMemEval_S Benchmark Suite**: Reproducible evaluation harness with verified empirical metrics.

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
     (Dedicated Graph Database Namespace)
```

- **Frontend**: React 18, Vite, TypeScript (strict mode), Tailwind CSS (Dark Graphite / Violet UI), React Flow graph inspector.
- **Backend**: FastAPI, Pydantic v2, Async HTTPX client.
- **Database**: HydraDB Cloud (`HYDRA_MODE`, `HYDRA_DB_API_KEY`, `HYDRA_DB_DATABASE`, `HYDRA_DB_BASE_URL`).

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

Run Backend:
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Run Backend Tests:
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
│   │   └── hydra/               # HydraDB Cloud client, schema, Cypher queries
│   ├── tests/                   # Pytest async test suite
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
│   ├── data/                    # Dataset storage
│   └── results/                 # Verified benchmark artifacts
├── scripts/
│   ├── ingest_longmemeval.py    # Ingestion script
│   ├── reset_database.py        # Safe database reset
│   └── run_benchmark.py         # CLI benchmark runner
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

## Health Check & Verification

Test backend health endpoint directly:
```bash
curl http://localhost:8000/api/health
```

Sample JSON response:
```json
{
  "status": "ok",
  "service": "PALIMN",
  "version": "0.1.0",
  "timestamp": "2026-08-19T04:20:00.000000+00:00",
  "environment": "development",
  "hydradb": {
    "connected": false,
    "status": "unconfigured",
    "reason": "HydraDB credentials not configured",
    "database": "palimn-memory",
    "mode": "cloud",
    "base_url": null
  }
}
```

---

## License

MIT License.
