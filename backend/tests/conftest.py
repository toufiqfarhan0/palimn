"""Shared fixtures for PALIMN test suites."""
import pytest
from backend.app.hydra.client import get_hydra_client


@pytest.fixture(autouse=True)
def reset_temporal_memory_state():
    """Ensure every test runs against a clean seeded baseline temporal graph in local test mode."""
    client = get_hydra_client()
    original_mode = client.mode
    client.mode = "local"
    client._in_memory_store.clear()
    client._in_memory_store.seed_synthetic_data()
    yield
    client._in_memory_store.clear()
    client._in_memory_store.seed_synthetic_data()
    client.mode = original_mode
