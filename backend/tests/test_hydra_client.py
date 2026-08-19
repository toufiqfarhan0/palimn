"""Tests for HydraClient isolation and unconfigured safety."""
import pytest
from backend.app.hydra.client import HydraClient


@pytest.mark.asyncio
async def test_hydra_client_unconfigured_health():
    client = HydraClient(base_url="", api_key="")
    assert not client.is_configured
    health = await client.health_check()
    assert health["connected"] is False
    assert health["status"] == "unconfigured"
    assert health["database"] == "palimn-memory"
    assert health["mode"] == "cloud"


@pytest.mark.asyncio
async def test_hydra_client_unconfigured_query_raises():
    client = HydraClient(base_url="", api_key="")
    with pytest.raises(ConnectionError, match="HydraDB credentials not configured"):
        await client.execute_query("MATCH (n) RETURN n")


@pytest.mark.asyncio
async def test_hydra_client_custom_headers():
    client = HydraClient(
        base_url="https://api.hydradb.com",
        api_key="test-api-key",
        database="palimn-memory",
        mode="cloud",
    )
    assert client.is_configured
    headers = client._get_headers()
    assert headers["Authorization"] == "Bearer test-api-key"
    assert headers["X-Hydra-Database"] == "palimn-memory"
    assert headers["X-Hydra-Mode"] == "cloud"
