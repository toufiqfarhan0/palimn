"""Tests for Phase 5 deterministic open-domain retrieval, fact extraction, and temporal filtering."""
import pytest
from backend.app.memory.fact_extractor import DeterministicFactExtractor
from backend.app.memory.models import DecisionType, MemoryStatus
from backend.app.retrieval.candidate_retriever import CandidateRetriever
from backend.app.retrieval.graph_retriever import GraphRetriever
from backend.app.retrieval.query_analyzer import QueryAnalyzer, QueryIntent
from backend.app.retrieval.query_normalizer import (
    extract_query_concepts,
    normalize_query_text,
    stem_token,
)
from backend.app.hydra.client import HydraClient


def test_query_normalization_and_stemming():
    """Verify consistent normalization and stemming across morphological variants."""
    assert stem_token("graduated") == "graduat"
    assert stem_token("graduate") == "graduat"
    assert stem_token("graduation") == "graduat"
    assert stem_token("degrees") == "degree"
    assert stem_token("degree") == "degree"
    assert stem_token("commute") == "commut"
    assert stem_token("commuting") == "commut"
    assert stem_token("playlist") == "playlist"


def test_concept_extraction():
    """Verify concept extraction and term weighting from open-domain questions."""
    q = "What degree did I graduate with?"
    keywords, concepts, weights = extract_query_concepts(q)
    assert "degree" in keywords
    assert "graduate" in keywords
    assert "graduat" in concepts
    assert "what" not in keywords  # Stopword removed
    assert "did" not in keywords   # Stopword removed
    assert weights["degree"] >= 1.0


def test_query_analyzer_preserves_location_queries():
    """Verify Phase 2 location and session queries are preserved 100%."""
    analyzer = QueryAnalyzer()
    
    i1 = analyzer.analyze("Where do I live now?")
    assert i1.query_type == "current_state"
    assert i1.predicate == "lives_in"
    
    i2 = analyzer.analyze("Where did I live before Hyderabad?")
    assert i2.query_type == "historical_state"
    assert i2.reference_object == "Hyderabad"
    
    i3 = analyzer.analyze("Where did I live in Session 01?")
    assert i3.query_type == "session_scoped"
    assert i3.session_id == "session_01"


def test_query_analyzer_open_domain():
    """Verify open-domain queries are categorized as open_domain with extracted concepts."""
    analyzer = QueryAnalyzer()
    i = analyzer.analyze("What degree did I graduate with?", user_id="user_test")
    assert i.query_type == "open_domain"
    assert i.subject == "user_test"
    assert "degree" in i.keywords
    assert "graduat" in i.concepts


def test_deterministic_fact_extraction():
    """Verify regex-based fact extraction extracts correct objects without hardcoding."""
    extractor = DeterministicFactExtractor()
    
    # 1. Education
    text1 = "I graduated with a degree in Business Administration, which has definitely helped me."
    facts1 = extractor.extract_from_message(text1, session_id="s1", message_id="m1")
    assert len(facts1) >= 1
    assert facts1[0].predicate == "graduated_with"
    assert facts1[0].object == "Business Administration"
    
    # 2. Commute / Work
    text2 = "My daily commute to work is 45 minutes each way."
    facts2 = extractor.extract_from_message(text2, session_id="s2", message_id="m2")
    assert len(facts2) >= 1
    assert facts2[0].predicate == "commute_duration"
    assert "45 minutes" in facts2[0].object
    
    # 3. Media / Playlist
    text3 = "I created a playlist called Summer Vibes for road trips."
    facts3 = extractor.extract_from_message(text3, session_id="s3", message_id="m3")
    assert len(facts3) >= 1
    assert facts3[0].predicate == "playlist_name"
    assert facts3[0].object == "Summer Vibes"


@pytest.mark.asyncio
async def test_candidate_retrieval_and_user_priority():
    """Verify user messages score higher than assistant messages containing the same terms."""
    client = HydraClient(mode="local")
    client._in_memory_store.clear()
    
    # Add User node
    client._in_memory_store.merge_node("user_test", "User", {"id": "user_test"})
    
    # Add User Message (Primary)
    client._in_memory_store.merge_node("msg_user_1", "Message", {
        "id": "msg_user_1",
        "user_id": "user_test",
        "session_id": "sess_1",
        "role": "user",
        "content": "I graduated with a degree in Business Administration.",
        "timestamp": "2023-05-30T17:27:00",
    })
    
    # Add Assistant Message (Secondary)
    client._in_memory_store.merge_node("msg_asst_1", "Message", {
        "id": "msg_asst_1",
        "user_id": "user_test",
        "session_id": "sess_1",
        "role": "assistant",
        "content": "Congratulations on your degree in Business Administration!",
        "timestamp": "2023-05-30T17:28:00",
    })
    
    analyzer = QueryAnalyzer()
    intent = analyzer.analyze("What degree did I graduate with?", user_id="user_test")
    
    candidate_retriever = CandidateRetriever(client)
    cands = candidate_retriever.retrieve_candidate_messages(intent)
    
    assert len(cands) >= 2
    assert cands[0].message_id == "msg_user_1"  # User message ranked #1
    assert cands[0].score > cands[1].score       # Higher score due to 1.5x user multiplier


@pytest.mark.asyncio
async def test_temporal_filtering_prevents_future_leakage():
    """Verify temporal context filters out future messages."""
    client = HydraClient(mode="local")
    client._in_memory_store.clear()
    
    # Message before question date
    client._in_memory_store.merge_node("msg_past", "Message", {
        "id": "msg_past",
        "user_id": "user_test",
        "session_id": "sess_past",
        "role": "user",
        "content": "I graduated with a degree in Business Administration.",
        "timestamp": "2023-05-20T10:00:00",
    })
    
    # Message after question date
    client._in_memory_store.merge_node("msg_future", "Message", {
        "id": "msg_future",
        "user_id": "user_test",
        "session_id": "sess_future",
        "role": "user",
        "content": "I graduated with a degree in Computer Science.",
        "timestamp": "2023-06-05T10:00:00",
    })
    
    analyzer = QueryAnalyzer()
    intent = analyzer.analyze(
        "What degree did I graduate with?",
        user_id="user_test",
        time_context="2023-05-30T23:40:00",
    )
    
    candidate_retriever = CandidateRetriever(client)
    cands = candidate_retriever.retrieve_candidate_messages(intent)
    
    cand_ids = [c.message_id for c in cands]
    assert "msg_past" in cand_ids
    assert "msg_future" not in cand_ids  # Future message strictly excluded


@pytest.mark.asyncio
async def test_open_domain_e2e_answerable():
    """Verify full end-to-end open-domain retrieval produces answer and provenance."""
    client = HydraClient(mode="local")
    client._in_memory_store.clear()
    
    client._in_memory_store.merge_node("msg_1", "Message", {
        "id": "msg_1",
        "user_id": "user_e47becba",
        "session_id": "sess_degree",
        "role": "user",
        "content": "I graduated with a degree in Business Administration, which has helped me.",
        "timestamp": "2023-05-30T17:27:00",
    })
    
    analyzer = QueryAnalyzer()
    intent = analyzer.analyze(
        "What degree did I graduate with?",
        user_id="user_e47becba",
        time_context="2023-05-30T23:40:00",
    )
    
    retriever = GraphRetriever(client)
    facts, reasoning = await retriever.retrieve_candidates(intent)
    
    assert len(facts) == 1
    assert facts[0].object == "Business Administration"
    assert facts[0].predicate == "graduated_with"
    assert facts[0].confidence >= 0.9
    assert facts[0].provenance is not None
    assert facts[0].provenance.message_id == "msg_1"


@pytest.mark.asyncio
async def test_open_domain_abstention_on_unrecorded():
    """Verify unrecorded open-domain query returns abstention without hallucination."""
    client = HydraClient(mode="local")
    client._in_memory_store.clear()
    
    analyzer = QueryAnalyzer()
    intent = analyzer.analyze("What is the name of my pet parrot?", user_id="user_demo")
    
    retriever = GraphRetriever(client)
    facts, reasoning = await retriever.retrieve_candidates(intent)
    
    assert facts == []
    assert "No relevant message" in reasoning
