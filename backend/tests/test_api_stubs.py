"""Tests for chat, memory, graph, and benchmark API endpoints."""
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.hydra.client import HydraClient, get_hydra_client


@pytest.mark.asyncio
async def test_chat_abstention_unconfigured():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/chat", json={"question": "Where does the user live?"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["decision"] == "abstain"
        assert "evidence" in data
        assert isinstance(data["evidence"], list)


@pytest.mark.asyncio
async def test_graph_endpoint_unconfigured():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/graph")
        assert resp.status_code == 200
        data = resp.json()
        assert data["nodes"] == []
        assert data["edges"] == []
        assert data["total_nodes"] == 0


@pytest.mark.asyncio
async def test_benchmark_results_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/benchmark/results")
        assert resp.status_code == 200
        data = resp.json()
        assert "runs" in data
