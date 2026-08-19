"""Tests for chat, memory, graph, and benchmark API endpoints."""
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.mark.asyncio
async def test_chat_abstention_on_unrecorded_topic():
    """Verify chat endpoint abstains on questions with no matching memory."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/chat", json={"question": "What spaceship does the user own?"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["decision"] == "abstain"
        assert data["reason"] == "no_matching_memory"
        assert data["evidence"] == []


@pytest.mark.asyncio
async def test_graph_endpoint_seeded():
    """Verify graph endpoint returns seeded temporal graph nodes and relationships."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/graph")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_nodes"] >= 9
        assert data["total_edges"] >= 14


@pytest.mark.asyncio
async def test_benchmark_results_endpoint():
    """Verify benchmark results structure."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/benchmark/results")
        assert resp.status_code == 200
        data = resp.json()
        assert "runs" in data
