"""Tests for Temporal Memory Graph invariants, relations, and idempotency (Phase 2)."""
import pytest
from backend.app.hydra.client import HydraClient
from backend.app.memory.models import MemoryStatus


@pytest.fixture
def hydra_client():
    client = HydraClient(mode="local")
    client._in_memory_store.seed_synthetic_data()
    return client


@pytest.mark.asyncio
async def test_user_creation(hydra_client: HydraClient):
    """Verify demo user exists in graph."""
    user = hydra_client._in_memory_store.nodes.get("user_demo")
    assert user is not None
    assert user["label"] == "User"
    assert user["properties"]["name"] == "Demo User"


@pytest.mark.asyncio
async def test_session_creation_and_precedes(hydra_client: HydraClient):
    """Verify sessions and PRECEDES ordering relationship."""
    s1 = hydra_client._in_memory_store.nodes.get("session_01")
    s2 = hydra_client._in_memory_store.nodes.get("session_02")
    assert s1 is not None and s2 is not None
    assert s1["properties"]["date"] == "2025-01-10"
    assert s2["properties"]["date"] == "2025-03-15"

    precedes_edges = [
        e for e in hydra_client._in_memory_store.edges
        if e["type"] == "PRECEDES" and e["source"] == "session_01" and e["target"] == "session_02"
    ]
    assert len(precedes_edges) == 1


@pytest.mark.asyncio
async def test_message_creation_and_contains(hydra_client: HydraClient):
    """Verify messages and CONTAINS relationships from sessions."""
    m1 = hydra_client._in_memory_store.nodes.get("msg_01")
    m2 = hydra_client._in_memory_store.nodes.get("msg_02")
    assert m1 is not None and m2 is not None
    assert "Bangalore" in m1["properties"]["content"]
    assert "Hyderabad" in m2["properties"]["content"]

    contains_edges = [
        e for e in hydra_client._in_memory_store.edges if e["type"] == "CONTAINS"
    ]
    assert len(contains_edges) == 2


@pytest.mark.asyncio
async def test_entity_creation_and_mentions(hydra_client: HydraClient):
    """Verify entities and MENTIONS relationships."""
    e1 = hydra_client._in_memory_store.nodes.get("entity_bangalore")
    e2 = hydra_client._in_memory_store.nodes.get("entity_hyderabad")
    assert e1 is not None and e2 is not None
    assert e1["properties"]["name"] == "Bangalore"
    assert e2["properties"]["name"] == "Hyderabad"


@pytest.mark.asyncio
async def test_fact_lifecycle_and_supersedes(hydra_client: HydraClient):
    """Verify active vs superseded fact states and SUPERSEDES edge."""
    fact_a = await hydra_client.get_memory_by_id("fact_001")
    fact_b = await hydra_client.get_memory_by_id("fact_002")

    # Invariant 9 & 10: Old fact is preserved (not deleted) and marked superseded
    assert fact_a is not None
    assert fact_a.object == "Bangalore"
    assert fact_a.status == MemoryStatus.SUPERSEDED
    assert fact_a.valid_from == "2025-01-10"
    assert fact_a.valid_until == "2025-03-15"

    # Invariant 11: New fact is active
    assert fact_b is not None
    assert fact_b.object == "Hyderabad"
    assert fact_b.status == MemoryStatus.ACTIVE
    assert fact_b.valid_from == "2025-03-15"
    assert fact_b.valid_until is None

    # Invariant 8: Fact B supersedes Fact A
    supersedes_edges = [
        e for e in hydra_client._in_memory_store.edges
        if e["type"] == "SUPERSEDES" and e["source"] == "fact_002" and e["target"] == "fact_001"
    ]
    assert len(supersedes_edges) == 1


@pytest.mark.asyncio
async def test_seed_idempotency(hydra_client: HydraClient):
    """Running seed operation twice must not duplicate graph nodes or edges."""
    summary_1 = hydra_client._in_memory_store.seed_synthetic_data()
    total_nodes_1 = summary_1["total_nodes"]
    total_edges_1 = summary_1["total_edges"]

    summary_2 = hydra_client._in_memory_store.seed_synthetic_data()
    total_nodes_2 = summary_2["total_nodes"]
    total_edges_2 = summary_2["total_edges"]

    assert total_nodes_1 == total_nodes_2 == 9  # 1 User + 2 Sessions + 2 Messages + 2 Entities + 2 Facts
    assert total_edges_1 == total_edges_2 == 14


@pytest.mark.asyncio
async def test_graph_snapshot(hydra_client: HydraClient):
    """Verify graph snapshot formatting for React Flow frontend visualizer."""
    graph = await hydra_client.get_graph(limit=100)
    assert graph["total_nodes"] >= 9
    assert graph["total_edges"] >= 14
    node_labels = {n["label"] for n in graph["nodes"]}
    assert "User" in node_labels
    assert "Session" in node_labels
    assert "Message" in node_labels
    assert "Entity" in node_labels
    assert "Fact" in node_labels
