"""Tests for GET /api/health endpoint and graceful status reporting."""
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.hydra.client import HydraClient, get_hydra_client


@pytest.mark.asyncio
async def test_health_unconfigured():
    """Verify health endpoint does not crash when HydraDB is unconfigured."""
    unconfigured_client = HydraClient(base_url="", api_key="")
    app.dependency_overrides[get_hydra_client] = lambda: unconfigured_client

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "PALIMN"
        assert data["hydradb"]["connected"] is False
        assert data["hydradb"]["status"] == "unconfigured"
        assert data["hydradb"]["database"] == "palimn-memory"
        assert data["hydradb"]["mode"] == "cloud"
        assert "not configured" in data["hydradb"]["reason"]

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_root_endpoint():
    """Verify root info endpoint."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["app"] == "PALIMN"
        assert "Temporal Memory" in data["tagline"]
