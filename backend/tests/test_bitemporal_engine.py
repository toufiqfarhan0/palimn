"""Comprehensive unit tests for PALIMN Bi-Temporal Memory Engine (Valid Time Tv vs. Assertion Time Ta)."""
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.hydra.client import HydraClient, InMemoryGraphStore
from backend.app.memory.models import (
    FactInput,
    StructuredIngestRequest,
    DecisionType,
    MemoryStatus,
)


@pytest.fixture
def hydra_client():
    """Create fresh isolated client for bi-temporal unit tests with retroactive updates."""
    client = HydraClient(mode="local")
    client._in_memory_store = InMemoryGraphStore()
    client._in_memory_store.seed_synthetic_data()
    
    # Update Bangalore to cover 2021 to 2025 validity window
    client._in_memory_store.nodes["fact_001"]["properties"]["valid_from"] = "2021-01-01"
    
    # Add retroactive Tokyo memory in session_03
    client._in_memory_store.merge_node("session_03", "Session", {
        "id": "session_03",
        "session_index": 3,
        "date": "2025-05-20",
        "created_at": "2025-05-20T11:00:00Z",
        "user_id": "user_demo",
    })
    client._in_memory_store.merge_node("msg_03", "Message", {
        "id": "msg_03",
        "session_id": "session_03",
        "user_id": "user_demo",
        "role": "user",
        "content": "Back in 2019 to 2020 I lived in Tokyo.",
        "timestamp": "2025-05-20T11:00:00Z",
    })
    client._in_memory_store.merge_node("entity_tokyo", "Entity", {
        "id": "entity_tokyo",
        "name": "Tokyo",
        "entity_type": "Location",
        "created_at": "2025-05-20T11:00:00Z",
    })
    client._in_memory_store.merge_node("fact_retro_01", "Fact", {
        "id": "fact_retro_01",
        "memory_id": "fact_retro_01",
        "subject": "user_demo",
        "predicate": "lives_in",
        "object": "Tokyo",
        "session_id": "session_03",
        "message_id": "msg_03",
        "session_date": "2025-05-20",
        "created_at": "2025-05-20T11:00:00Z",
        "valid_from": "2019-01-01",
        "valid_until": "2020-12-31",
        "asserted_at": "2025-05-20T11:00:00Z",
        "assertion_session_id": "session_03",
        "is_retroactive": True,
        "status": MemoryStatus.HISTORICAL.value,
        "confidence": 1.0,
    })
    client._in_memory_store.merge_edge("user_demo", "session_03", "HAS_SESSION")
    client._in_memory_store.merge_edge("session_02", "session_03", "PRECEDES")
    client._in_memory_store.merge_edge("session_03", "msg_03", "CONTAINS")
    client._in_memory_store.merge_edge("msg_03", "entity_tokyo", "MENTIONS")
    client._in_memory_store.merge_edge("msg_03", "fact_retro_01", "SUPPORTS")
    client._in_memory_store.merge_edge("fact_retro_01", "msg_03", "SUPPORTED_BY")
    client._in_memory_store.merge_edge("fact_retro_01", "entity_tokyo", "ABOUT")
    client._in_memory_store.merge_edge("fact_001", "fact_retro_01", "SUPERSEDES")

    return client


@pytest.mark.asyncio
async def test_bitemporal_seed_data_integrity(hydra_client: HydraClient):
    """Verify synthetic dataset has multi-session bi-temporal coordinates and retroactive updates."""
    timeline = await hydra_client.get_bi_temporal_timeline("user_demo", "lives_in")
    assert len(timeline) == 3

    # Check Tokyo (retroactive historical fact)
    tokyo = next(e for e in timeline if e.object == "Tokyo")
    assert tokyo.valid_from == "2019-01-01"
    assert tokyo.valid_until == "2020-12-31"
    assert tokyo.assertion_session_id == "session_03"
    assert tokyo.is_retroactive is True

    # Check Bangalore
    blr = next(e for e in timeline if e.object == "Bangalore")
    assert blr.valid_from == "2021-01-01"
    assert blr.valid_until == "2025-03-15"
    assert blr.assertion_session_id == "session_01"

    # Check Hyderabad
    hyd = next(e for e in timeline if e.object == "Hyderabad")
    assert hyd.valid_from == "2025-03-15"
    assert hyd.valid_until is None
    assert hyd.status == MemoryStatus.ACTIVE


@pytest.mark.asyncio
async def test_valid_time_historical_query(hydra_client: HydraClient):
    """Querying real-world valid time Tv='2020-05-01' correctly resolves Tokyo."""
    fact_2020 = await hydra_client.find_fact_as_of_valid_time("user_demo", "lives_in", "2020-05-01")
    assert fact_2020 is not None
    assert fact_2020.object == "Tokyo"
    assert fact_2020.is_retroactive is True


@pytest.mark.asyncio
async def test_valid_time_past_bangalore(hydra_client: HydraClient):
    """Querying real-world valid time Tv='2022-06-01' correctly resolves Bangalore."""
    fact_2022 = await hydra_client.find_fact_as_of_valid_time("user_demo", "lives_in", "2022-06-01")
    assert fact_2022 is not None
    assert fact_2022.object == "Bangalore"


@pytest.mark.asyncio
async def test_valid_time_current_hyderabad(hydra_client: HydraClient):
    """Querying real-world valid time Tv='2025-04-01' correctly resolves active Hyderabad."""
    fact_2025 = await hydra_client.find_fact_as_of_valid_time("user_demo", "lives_in", "2025-04-01")
    assert fact_2025 is not None
    assert fact_2025.object == "Hyderabad"


@pytest.mark.asyncio
async def test_valid_time_out_of_bounds_abstains(hydra_client: HydraClient):
    """Querying a date before any recorded validity interval returns None."""
    fact_2015 = await hydra_client.find_fact_as_of_valid_time("user_demo", "lives_in", "2015-01-01")
    assert fact_2015 is None


@pytest.mark.asyncio
async def test_assertion_time_point_in_time_reconstruction(hydra_client: HydraClient):
    """Querying agent knowledge as of Session 01 (2025-01-10) only sees Bangalore."""
    fact_s1 = await hydra_client.find_fact_as_of_assertion_time("user_demo", "lives_in", "2025-01-10")
    assert fact_s1 is not None
    assert fact_s1.object == "Bangalore"

    # In Session 02 (2025-03-15), agent learned about Hyderabad
    fact_s2 = await hydra_client.find_fact_as_of_assertion_time("user_demo", "lives_in", "2025-03-15")
    assert fact_s2 is not None
    assert fact_s2.object == "Hyderabad"


@pytest.mark.asyncio
async def test_2d_bitemporal_coordinate_matrix(hydra_client: HydraClient):
    """Verify 2D (Valid Time x Assertion Time) matrix query behavior."""
    # Question: What did the agent know in Session 01 about the user's location in 2020?
    # Expected: Nothing! (Tokyo was only learned in Session 03)
    fact_early = await hydra_client.find_bi_temporal_fact(
        subject="user_demo",
        predicate="lives_in",
        as_of_valid_time="2020-06-01",
        as_of_assertion_time="2025-01-10",
    )
    assert fact_early is None

    # Question: What does the agent know in Session 03 about the user's location in 2020?
    # Expected: Tokyo (learned retroactively in Session 03)
    fact_retro = await hydra_client.find_bi_temporal_fact(
        subject="user_demo",
        predicate="lives_in",
        as_of_valid_time="2020-06-01",
        as_of_assertion_time="2025-05-20",
    )
    assert fact_retro is not None
    assert fact_retro.object == "Tokyo"


@pytest.mark.asyncio
async def test_bitemporal_api_endpoints(hydra_client: HydraClient):
    """Test FastAPI REST endpoints for Bi-Temporal query and timeline."""
    from backend.app.hydra.client import get_hydra_client
    app.dependency_overrides[get_hydra_client] = lambda: hydra_client
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # 1. Timeline endpoint
            tl_res = await ac.get("/api/memory/bitemporal/timeline?subject=user_demo&predicate=lives_in")
            assert tl_res.status_code == 200
            tl_data = tl_res.json()
            assert len(tl_data) >= 3

            # 2. 2D Bi-temporal query endpoint (Valid 2022)
            q_res = await ac.post(
                "/api/memory/bitemporal/query",
                json={
                    "subject": "user_demo",
                    "predicate": "lives_in",
                    "as_of_valid_time": "2022-01-01",
                },
            )
            assert q_res.status_code == 200
            q_data = q_res.json()
            assert q_data["decision"] == "answerable"
            assert q_data["matched_fact"]["object"] == "Bangalore"

            # 3. 2D Bi-temporal query endpoint (Valid 2020)
            q_res_tokyo = await ac.post(
                "/api/memory/bitemporal/query",
                json={
                    "subject": "user_demo",
                    "predicate": "lives_in",
                    "as_of_valid_time": "2020-06-01",
                },
            )
            assert q_res_tokyo.status_code == 200
            assert q_res_tokyo.json()["matched_fact"]["object"] == "Tokyo"
    finally:
        app.dependency_overrides.pop(get_hydra_client, None)


@pytest.mark.asyncio
async def test_chat_point_in_time_nl_queries(hydra_client: HydraClient):
    """Test natural language chat query resolving point-in-time years."""
    from backend.app.hydra.client import get_hydra_client
    app.dependency_overrides[get_hydra_client] = lambda: hydra_client
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            # Query for 2021
            res_2021 = await ac.post(
                "/api/chat",
                json={"question": "Where did I live in 2021?"},
            )
            assert res_2021.status_code == 200
            data_2021 = res_2021.json()
            assert data_2021["decision"] == "answerable"
            assert data_2021["answer"] == "Bangalore"

            # Query for 2019 / 2020 (Tokyo retroactive)
            res_2019 = await ac.post(
                "/api/chat",
                json={"question": "Where did I live in 2019?"},
            )
            assert res_2019.status_code == 200
            data_2019 = res_2019.json()
            assert data_2019["decision"] == "answerable"
            assert data_2019["answer"] == "Tokyo"

            # Current location
            res_now = await ac.post(
                "/api/chat",
                json={"question": "Where do I live now?"},
            )
            assert res_now.status_code == 200
            data_now = res_now.json()
            assert data_now["decision"] == "answerable"
            assert data_now["answer"] == "Hyderabad"
    finally:
        app.dependency_overrides.pop(get_hydra_client, None)


