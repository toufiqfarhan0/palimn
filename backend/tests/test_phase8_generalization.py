"""Phase 8 Comprehensive Generalized Memory & Multi-Session Composition Tests."""
import pytest
from backend.app.hydra.client import InMemoryGraphStore, HydraClient
from backend.app.memory.generalized_extractor import GeneralizedMemoryExtractor
from backend.app.memory.composer import MemoryComposer
from backend.app.memory.temporal_resolver import TemporalResolver
from backend.app.retrieval.graph_retriever import GraphRetriever
from backend.app.retrieval.query_analyzer import QueryAnalyzer


@pytest.fixture
def hydra_client():
    client = HydraClient()
    client._in_memory_store.clear()
    return client


@pytest.fixture
def analyzer():
    return QueryAnalyzer()


@pytest.fixture
def extractor():
    return GeneralizedMemoryExtractor()


@pytest.fixture
def composer():
    return MemoryComposer()


@pytest.fixture
def resolver():
    return TemporalResolver()


# ---------------------------------------------------------------------
# TEST A: INTERNET SPEED
# ---------------------------------------------------------------------
@pytest.mark.asyncio
async def test_scenario_a_internet_speed(hydra_client, analyzer):
    """Test generalized system attribute extraction (internet speed: 500 Mbps)."""
    hydra_client._in_memory_store.merge_node("u_test", "User", {"id": "u_test", "name": "User"})
    hydra_client._in_memory_store.merge_node("s1", "Session", {"id": "s1", "user_id": "u_test", "date": "2026-01-01"})
    hydra_client._in_memory_store.merge_node("m1", "Message", {
        "id": "m1",
        "session_id": "s1",
        "user_id": "u_test",
        "role": "user",
        "content": "My internet speed is 500 Mbps.",
        "timestamp": "2026-01-01T10:00:00Z",
    })

    retriever = GraphRetriever(hydra_client)
    intent = analyzer.analyze("What is my internet speed?", user_id="u_test")
    facts, _ = await retriever.retrieve_candidates(intent)

    assert len(facts) == 1
    assert "500 mbps" in facts[0].object.lower()


# ---------------------------------------------------------------------
# TEST B: SHIRT COUNT
# ---------------------------------------------------------------------
@pytest.mark.asyncio
async def test_scenario_b_shirt_count(hydra_client, analyzer):
    """Test generalized count/quantity attribute extraction (7 shirts)."""
    hydra_client._in_memory_store.merge_node("u_test", "User", {"id": "u_test", "name": "User"})
    hydra_client._in_memory_store.merge_node("s1", "Session", {"id": "s1", "user_id": "u_test", "date": "2026-01-01"})
    hydra_client._in_memory_store.merge_node("m1", "Message", {
        "id": "m1",
        "session_id": "s1",
        "user_id": "u_test",
        "role": "user",
        "content": "I have 7 shirts for my upcoming vacation.",
        "timestamp": "2026-01-01T10:00:00Z",
    })

    retriever = GraphRetriever(hydra_client)
    intent = analyzer.analyze("How many shirts do I have?", user_id="u_test")
    facts, _ = await retriever.retrieve_candidates(intent)

    assert len(facts) == 1
    assert facts[0].object == "7"


# ---------------------------------------------------------------------
# TEST C: STUDY ABROAD
# ---------------------------------------------------------------------
@pytest.mark.asyncio
async def test_scenario_c_study_abroad(hydra_client, analyzer):
    """Test generalized study abroad event extraction (University of Melbourne)."""
    hydra_client._in_memory_store.merge_node("u_test", "User", {"id": "u_test", "name": "User"})
    hydra_client._in_memory_store.merge_node("s1", "Session", {"id": "s1", "user_id": "u_test", "date": "2026-01-01"})
    hydra_client._in_memory_store.merge_node("m1", "Message", {
        "id": "m1",
        "session_id": "s1",
        "user_id": "u_test",
        "role": "user",
        "content": "I studied abroad at the University of Melbourne in Australia.",
        "timestamp": "2026-01-01T10:00:00Z",
    })

    retriever = GraphRetriever(hydra_client)
    intent = analyzer.analyze("Where did I study abroad?", user_id="u_test")
    facts, _ = await retriever.retrieve_candidates(intent)

    assert len(facts) == 1
    assert "university of melbourne" in facts[0].object.lower()


# ---------------------------------------------------------------------
# TEST D: MULTI-MESSAGE COST COMPOSITION
# ---------------------------------------------------------------------
@pytest.mark.asyncio
async def test_scenario_d_multi_message_cost(hydra_client, analyzer):
    """Test cross-message composition for item purchase + cost ($1,200 laptop)."""
    hydra_client._in_memory_store.merge_node("u_test", "User", {"id": "u_test", "name": "User"})
    hydra_client._in_memory_store.merge_node("s1", "Session", {"id": "s1", "user_id": "u_test", "date": "2026-01-01"})
    hydra_client._in_memory_store.merge_node("m1", "Message", {
        "id": "m1",
        "session_id": "s1",
        "user_id": "u_test",
        "role": "user",
        "content": "I bought a laptop yesterday.",
        "timestamp": "2026-01-01T10:00:00Z",
    })
    hydra_client._in_memory_store.merge_node("m2", "Message", {
        "id": "m2",
        "session_id": "s1",
        "user_id": "u_test",
        "role": "user",
        "content": "The laptop cost $1,200.",
        "timestamp": "2026-01-01T10:05:00Z",
    })

    retriever = GraphRetriever(hydra_client)
    intent = analyzer.analyze("How much did I spend on the laptop?", user_id="u_test")
    facts, _ = await retriever.retrieve_candidates(intent)

    assert len(facts) == 1
    assert "$1,200" in facts[0].object or "1200" in facts[0].object


# ---------------------------------------------------------------------
# TEST E: MULTI-SESSION EMPLOYMENT & ROLE COMPOSITION
# ---------------------------------------------------------------------
@pytest.mark.asyncio
async def test_scenario_e_multi_session_employment(hydra_client, analyzer):
    """Test cross-session composition for company + role promotion (engineering manager at Company A)."""
    hydra_client._in_memory_store.merge_node("u_test", "User", {"id": "u_test", "name": "User"})
    hydra_client._in_memory_store.merge_node("s1", "Session", {"id": "s1", "user_id": "u_test", "date": "2026-01-01"})
    hydra_client._in_memory_store.merge_node("s2", "Session", {"id": "s2", "user_id": "u_test", "date": "2026-03-01"})
    hydra_client._in_memory_store.merge_edge("s1", "s2", "PRECEDES")

    hydra_client._in_memory_store.merge_node("m1", "Message", {
        "id": "m1",
        "session_id": "s1",
        "user_id": "u_test",
        "role": "user",
        "content": "I started working at Company A.",
        "timestamp": "2026-01-01T10:00:00Z",
    })
    hydra_client._in_memory_store.merge_node("m2", "Message", {
        "id": "m2",
        "session_id": "s2",
        "user_id": "u_test",
        "role": "user",
        "content": "I was promoted to engineering manager.",
        "timestamp": "2026-03-01T14:00:00Z",
    })

    retriever = GraphRetriever(hydra_client)
    intent = analyzer.analyze("What role do I have at Company A?", user_id="u_test")
    facts, _ = await retriever.retrieve_candidates(intent)

    assert len(facts) == 1
    assert "engineering manager" in facts[0].object.lower()


# ---------------------------------------------------------------------
# TEST F: MULTI-SESSION PURCHASE & COST COMPOSITION
# ---------------------------------------------------------------------
@pytest.mark.asyncio
async def test_scenario_f_multi_session_purchase(hydra_client, analyzer):
    """Test cross-session composition for purchase (S1: tennis racket) + cost (S2: $800)."""
    hydra_client._in_memory_store.merge_node("u_test", "User", {"id": "u_test", "name": "User"})
    hydra_client._in_memory_store.merge_node("s1", "Session", {"id": "s1", "user_id": "u_test", "date": "2026-01-01"})
    hydra_client._in_memory_store.merge_node("s2", "Session", {"id": "s2", "user_id": "u_test", "date": "2026-04-01"})
    hydra_client._in_memory_store.merge_edge("s1", "s2", "PRECEDES")

    hydra_client._in_memory_store.merge_node("m1", "Message", {
        "id": "m1",
        "session_id": "s1",
        "user_id": "u_test",
        "role": "user",
        "content": "I bought a tennis racket.",
        "timestamp": "2026-01-01T10:00:00Z",
    })
    hydra_client._in_memory_store.merge_node("m2", "Message", {
        "id": "m2",
        "session_id": "s2",
        "user_id": "u_test",
        "role": "user",
        "content": "The racket cost $800.",
        "timestamp": "2026-04-01T11:00:00Z",
    })

    retriever = GraphRetriever(hydra_client)
    intent = analyzer.analyze("How much did I spend on the tennis racket?", user_id="u_test")
    facts, _ = await retriever.retrieve_candidates(intent)

    assert len(facts) == 1
    assert "$800" in facts[0].object or "800" in facts[0].object


# ---------------------------------------------------------------------
# TEST G: SUBJECT PRESERVATION & ABSTENTION
# ---------------------------------------------------------------------
@pytest.mark.asyncio
async def test_scenario_g_subject_preservation(hydra_client, analyzer):
    """Test subject attribution (Sister works at Google vs where do I work)."""
    hydra_client._in_memory_store.merge_node("u_test", "User", {"id": "u_test", "name": "User"})
    hydra_client._in_memory_store.merge_node("s1", "Session", {"id": "s1", "user_id": "u_test", "date": "2026-01-01"})
    hydra_client._in_memory_store.merge_node("m1", "Message", {
        "id": "m1",
        "session_id": "s1",
        "user_id": "u_test",
        "role": "user",
        "content": "My sister works at Google.",
        "timestamp": "2026-01-01T10:00:00Z",
    })

    retriever = GraphRetriever(hydra_client)

    # 1. Ask about sister -> should answer Google
    intent_sister = analyzer.analyze("Where does my sister work?", user_id="u_test")
    facts_sister, _ = await retriever.retrieve_candidates(intent_sister)
    assert len(facts_sister) == 1
    assert "google" in facts_sister[0].object.lower()

    # 2. Ask about user -> should abstain (provenance preservation)
    intent_user = analyzer.analyze("Where do I work?", user_id="u_test")
    facts_user, _ = await retriever.retrieve_candidates(intent_user)
    assert len(facts_user) == 0


# ---------------------------------------------------------------------
# TEST H: ENTITY AMBIGUITY ABSTENTION
# ---------------------------------------------------------------------
@pytest.mark.asyncio
async def test_scenario_h_entity_ambiguity(hydra_client, analyzer):
    """Test conservative abstention on ambiguous umbrella queries (sibling)."""
    hydra_client._in_memory_store.merge_node("u_test", "User", {"id": "u_test", "name": "User"})
    hydra_client._in_memory_store.merge_node("s1", "Session", {"id": "s1", "user_id": "u_test", "date": "2026-01-01"})
    hydra_client._in_memory_store.merge_node("m1", "Message", {
        "id": "m1",
        "session_id": "s1",
        "user_id": "u_test",
        "role": "user",
        "content": "My sister works at Google.",
        "timestamp": "2026-01-01T10:00:00Z",
    })
    hydra_client._in_memory_store.merge_node("m2", "Message", {
        "id": "m2",
        "session_id": "s1",
        "user_id": "u_test",
        "role": "user",
        "content": "My brother works at Microsoft.",
        "timestamp": "2026-01-01T10:05:00Z",
    })

    retriever = GraphRetriever(hydra_client)
    intent = analyzer.analyze("Where does my sibling work?", user_id="u_test")
    facts, _ = await retriever.retrieve_candidates(intent)

    # Should abstain due to entity ambiguity between sister and brother
    assert len(facts) == 0


# ---------------------------------------------------------------------
# TEST I: TEMPORAL REVISION (PREVIOUS VS CURRENT)
# ---------------------------------------------------------------------
@pytest.mark.asyncio
async def test_scenario_i_temporal_revision(hydra_client, analyzer):
    """Test multi-session temporal revision resolution (Johnson -> Smith)."""
    hydra_client._in_memory_store.merge_node("u_test", "User", {"id": "u_test", "name": "User"})
    hydra_client._in_memory_store.merge_node("s1", "Session", {"id": "s1", "user_id": "u_test", "date": "2026-01-01"})
    hydra_client._in_memory_store.merge_node("s2", "Session", {"id": "s2", "user_id": "u_test", "date": "2026-06-01"})
    hydra_client._in_memory_store.merge_edge("s1", "s2", "PRECEDES")

    hydra_client._in_memory_store.merge_node("m1", "Message", {
        "id": "m1",
        "session_id": "s1",
        "user_id": "u_test",
        "role": "user",
        "content": "My last name is Johnson.",
        "timestamp": "2026-01-01T10:00:00Z",
    })
    hydra_client._in_memory_store.merge_node("m2", "Message", {
        "id": "m2",
        "session_id": "s2",
        "user_id": "u_test",
        "role": "user",
        "content": "I changed my last name to Smith.",
        "timestamp": "2026-06-01T15:00:00Z",
    })

    retriever = GraphRetriever(hydra_client)

    # 1. Historical question: before I changed it -> Johnson
    intent_hist = analyzer.analyze("What was my last name before I changed it?", user_id="u_test")
    facts_hist, _ = await retriever.retrieve_candidates(intent_hist)
    assert len(facts_hist) == 1
    assert "johnson" in facts_hist[0].object.lower()

    # 2. Current question: what is my last name now -> Smith
    intent_curr = analyzer.analyze("What is my last name now?", user_id="u_test")
    facts_curr, _ = await retriever.retrieve_candidates(intent_curr)
    assert len(facts_curr) == 1
    assert "smith" in facts_curr[0].object.lower()


# ---------------------------------------------------------------------
# TEST J: MULTI-SESSION MAX / EXTREMUM RESOLUTION (TIKTOK FOLLOWERS)
# ---------------------------------------------------------------------
@pytest.mark.asyncio
async def test_scenario_j_multi_session_max_followers(hydra_client, analyzer):
    """Test multi-session maximum follower gain resolution across platforms."""
    hydra_client._in_memory_store.merge_node("u_test", "User", {"id": "u_test", "name": "User"})
    hydra_client._in_memory_store.merge_node("s1", "Session", {"id": "s1", "user_id": "u_test", "date": "2026-01-01"})
    hydra_client._in_memory_store.merge_node("s2", "Session", {"id": "s2", "user_id": "u_test", "date": "2026-02-01"})
    hydra_client._in_memory_store.merge_edge("s1", "s2", "PRECEDES")

    hydra_client._in_memory_store.merge_node("m1", "Message", {
        "id": "m1",
        "session_id": "s1",
        "user_id": "u_test",
        "role": "user",
        "content": "On Twitter my follower count jumped from 420 to 540 over the past month.",
        "timestamp": "2026-01-01T10:00:00Z",
    })
    hydra_client._in_memory_store.merge_node("m2", "Message", {
        "id": "m2",
        "session_id": "s2",
        "user_id": "u_test",
        "role": "user",
        "content": "On TikTok where I've gained around 200 followers over the past three weeks.",
        "timestamp": "2026-02-01T15:00:00Z",
    })

    retriever = GraphRetriever(hydra_client)
    intent = analyzer.analyze("Which social media platform did I gain the most followers on over the past month?", user_id="u_test")
    facts, _ = await retriever.retrieve_candidates(intent)

    assert len(facts) == 1
    assert "tiktok" in facts[0].object.lower()


# ---------------------------------------------------------------------
# TEST K: MULTI-SESSION STORE SPENDING (THRIVE MARKET)
# ---------------------------------------------------------------------
@pytest.mark.asyncio
async def test_scenario_k_multi_session_store_spend(hydra_client, analyzer):
    """Test multi-session comparison of grocery store spending."""
    hydra_client._in_memory_store.merge_node("u_test", "User", {"id": "u_test", "name": "User"})
    hydra_client._in_memory_store.merge_node("s1", "Session", {"id": "s1", "user_id": "u_test", "date": "2026-01-01"})
    hydra_client._in_memory_store.merge_node("s2", "Session", {"id": "s2", "user_id": "u_test", "date": "2026-02-01"})
    hydra_client._in_memory_store.merge_edge("s1", "s2", "PRECEDES")

    hydra_client._in_memory_store.merge_node("m1", "Message", {
        "id": "m1",
        "session_id": "s1",
        "user_id": "u_test",
        "role": "user",
        "content": "I spent $120 at Trader Joe's this week.",
        "timestamp": "2026-01-01T10:00:00Z",
    })
    hydra_client._in_memory_store.merge_node("m2", "Message", {
        "id": "m2",
        "session_id": "s2",
        "user_id": "u_test",
        "role": "user",
        "content": "I spent $350 at Thrive Market this month.",
        "timestamp": "2026-02-01T15:00:00Z",
    })

    retriever = GraphRetriever(hydra_client)
    intent = analyzer.analyze("Which grocery store did I spend the most money at in the past month?", user_id="u_test")
    facts, _ = await retriever.retrieve_candidates(intent)

    assert len(facts) == 1
    assert "thrive market" in facts[0].object.lower()

