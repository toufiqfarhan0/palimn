"""Comprehensive test suite for PALIMN Track 3 Advanced Features."""
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.sdk.palimn_sdk import PalimnMemory, PalimnLangChainMemory, PalimnCrewAIMemory


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.asyncio
async def test_arena_presets_endpoint():
    """Verify that all adversarial arena presets are loaded."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/arena/presets")
        assert res.status_code == 200
        data = res.json()
        assert "unmentioned_fact" in data
        assert "explicit_negation" in data
        assert "temporal_ambiguity" in data
        assert "counterfactual_future" in data


@pytest.mark.asyncio
async def test_arena_evaluate_preset():
    """Verify side-by-side evaluation on the unmentioned_fact preset."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "query": "What is Alice's favorite sushi restaurant in Kyoto?",
            "scenario_type": "unmentioned_fact",
        }
        res = await client.post("/api/arena/compare", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["palimn_hydra"]["decision"] == "abstain"
        assert data["palimn_hydra"]["abstention_reason"] == "NO_RECORDED_EVIDENCE"
        assert data["vector_rag"]["hallucinated"] is True
        assert "CERT-" in data["palimn_hydra"]["certificate_id"]


@pytest.mark.asyncio
async def test_multi_hop_weaver():
    """Verify multi-hop cross-session graph traversal."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "query": "What database is Alice's team deploying in production?",
            "source_entity": "Alice",
        }
        res = await client.post("/api/memory/multi-hop-weaver", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["hops_count"] == 3
        assert len(data["causal_chain"]) == 3
        assert "HydraDB Cloud" in data["synthesized_answer"]
        assert len(data["graph_nodes"]) >= 3
        assert len(data["graph_links"]) >= 3


@pytest.mark.asyncio
async def test_cost_telemetry_endpoint():
    """Verify 115k context vs HydraDB token cost savings calculations."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/memory/cost-telemetry")
        assert res.status_code == 200
        data = res.json()
        assert data["session_tokens_total"] == 115000
        assert data["retrieved_subgraph_tokens"] == 320
        assert "99.72%" in data["compression_ratio"]
        assert len(data["table"]) >= 4


@pytest.mark.asyncio
async def test_decay_simulate_endpoint():
    """Verify categorical dynamic temporal decay simulation."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Transient state (rapid decay, half-life 3 days)
        payload = {
            "category": "transient_state",
            "days_elapsed": 10.0,
            "initial_confidence": 0.98,
        }
        res = await client.post("/api/memory/decay-simulate", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["half_life_days"] == 3.0
        assert data["current_confidence"] < 0.20  # Expired after 10 days
        assert len(data["curve"]) == 11

        # Permanent identity (no decay)
        payload_perm = {
            "category": "permanent_identity",
            "days_elapsed": 100.0,
            "initial_confidence": 0.99,
        }
        res_perm = await client.post("/api/memory/decay-simulate", json=payload_perm)
        assert res_perm.status_code == 200
        data_perm = res_perm.json()
        assert data_perm["current_confidence"] >= 0.98


@pytest.mark.asyncio
async def test_multi_dataset_benchmarks():
    """Verify benchmark API for LongMemEval_S, LongMemEval_V2, and BEAM datasets."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # BEAM dataset
        res_beam = await client.get("/api/benchmark/results?dataset=BEAM")
        assert res_beam.status_code == 200
        beam_data = res_beam.json()
        assert beam_data["latest_run"]["sample_size"] == 400
        assert "BEAM" in beam_data["latest_run"]["dataset"]

        # LongMemEval_V2
        res_v2 = await client.get("/api/benchmark/results?dataset=LongMemEval_V2")
        assert res_v2.status_code == 200
        v2_data = res_v2.json()
        assert v2_data["latest_run"]["sample_size"] == 350

        # LongMemEval_S
        res_s = await client.get("/api/benchmark/results?dataset=LongMemEval_S")
        assert res_s.status_code == 200
        s_data = res_s.json()
        assert s_data["latest_run"]["sample_size"] == 500


def test_sdk_classes():
    """Verify agent SDK adapters initialize and support methods."""
    mem = PalimnMemory(base_url="http://localhost:8000")
    assert mem.database == "palimn-memory"

    lc = PalimnLangChainMemory(palimn_client=mem)
    assert lc.memory_key == "history"
    lc.save_context({"input": "Hello"}, {"output": "Hi there"})

    crew = PalimnCrewAIMemory(palimn_client=mem)
    crew.save("User prefers dark mode")
