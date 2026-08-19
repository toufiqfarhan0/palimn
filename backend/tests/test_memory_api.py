"""Tests for Memory API endpoints in Phase 2."""
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.mark.asyncio
async def test_get_memory_by_id_success():
    """Verify GET /api/memory/{id} returns fact with provenance."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/memory/fact_001")
        assert resp.status_code == 200
        data = resp.json()
        assert data["memory_id"] == "fact_001"
        assert data["object"] == "Bangalore"
        assert data["status"] == "superseded"
        assert data["provenance"]["session_id"] == "session_01"


@pytest.mark.asyncio
async def test_get_memory_by_id_not_found():
    """Verify GET /api/memory/{id} returns 404 for nonexistent fact."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/memory/fact_nonexistent_999")
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_search_memories_by_status():
    """Verify search filter by active vs superseded status."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp_active = await client.get("/api/memory/search?status=active")
        assert resp_active.status_code == 200
        active_data = resp_active.json()
        assert len(active_data) == 1
        assert active_data[0]["object"] == "Hyderabad"

        resp_superseded = await client.get("/api/memory/search?status=superseded")
        assert resp_superseded.status_code == 200
        superseded_data = resp_superseded.json()
        assert len(superseded_data) == 1
        assert superseded_data[0]["object"] == "Bangalore"


@pytest.mark.asyncio
async def test_structured_ingest():
    """Verify POST /api/memory/ingest with structured input."""
    payload = {
        "user_id": "user_demo",
        "session_id": "session_03",
        "session_date": "2025-06-01",
        "message_id": "msg_03",
        "content": "I moved to Chennai.",
        "facts": [
            {
                "subject": "user_demo",
                "predicate": "lives_in",
                "object": "Chennai"
            }
        ]
    }
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/memory/ingest", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["session_id"] == "session_03"
        assert data["facts_extracted"] == 1
        assert data["revisions_detected"] == 1  # Should detect revision of previous active fact (Hyderabad)

        # Verify new active fact is Chennai
        chat_resp = await client.post("/api/chat", json={"question": "Where do I live now?"})
        assert chat_resp.json()["answer"] == "Chennai"


@pytest.mark.asyncio
async def test_graph_endpoint_has_nodes_and_edges():
    """Verify GET /api/graph returns seeded nodes and edges."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/graph")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_nodes"] >= 9
        assert data["total_edges"] >= 14
        edge_types = {e["type"] for e in data["edges"]}
        assert "SUPERSEDES" in edge_types
        assert "PRECEDES" in edge_types
        assert "HAS_SESSION" in edge_types
        assert "ABOUT" in edge_types
