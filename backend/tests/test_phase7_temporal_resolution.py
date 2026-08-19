"""Phase 7 Multi-session temporal resolution and conflict detection unit tests."""
import pytest
from backend.app.memory.models import FactCandidate
from backend.app.memory.structured_extractor import StructuredFactExtractor
from backend.app.memory.temporal_resolver import TemporalResolver
from backend.app.retrieval.query_analyzer import QueryAnalyzer


@pytest.fixture
def extractor():
    return StructuredFactExtractor()


@pytest.fixture
def resolver():
    return TemporalResolver()


@pytest.fixture
def analyzer():
    return QueryAnalyzer()


def test_scenario_a_multi_session_location(extractor, resolver, analyzer):
    # Session 1: "I live in Bangalore."
    cands_s1 = extractor.extract_from_message(
        "I live in Bangalore.", session_id="session_01", message_id="m1", timestamp="2026-01-01T10:00:00"
    )
    # Session 2: "I moved to Hyderabad."
    cands_s2 = extractor.extract_from_message(
        "I moved to Hyderabad.", session_id="session_02", message_id="m2", timestamp="2026-02-01T10:00:00"
    )
    all_cands = cands_s1 + cands_s2

    # Query 1: "Where do I live now?" -> Hyderabad
    intent_now = analyzer.analyze("Where do I live now?")
    res_now = resolver.resolve_facts_for_query(all_cands, intent_now)
    assert res_now.decision == "answerable"
    assert res_now.answer == "Hyderabad"

    # Query 2: "Where did I live before Hyderabad?" -> Bangalore
    intent_before = analyzer.analyze("Where did I live before Hyderabad?")
    res_before = resolver.resolve_facts_for_query(all_cands, intent_before)
    assert res_before.decision == "answerable"
    assert res_before.answer == "Bangalore"


def test_scenario_b_multi_session_identity_revision(extractor, resolver, analyzer):
    # Session 1: "My last name is Johnson."
    cands_s1 = extractor.extract_from_message(
        "My last name is Johnson.", session_id="session_01", message_id="m1", timestamp="2026-01-01T10:00:00"
    )
    # Session 2: "I changed my last name to Smith."
    cands_s2 = extractor.extract_from_message(
        "I changed my last name to Smith.", session_id="session_02", message_id="m2", timestamp="2026-02-01T10:00:00"
    )
    all_cands = cands_s1 + cands_s2

    # Query 1: "What was my last name before I changed it?" -> Johnson
    intent_before = analyzer.analyze("What was my last name before I changed it?")
    res_before = resolver.resolve_facts_for_query(all_cands, intent_before)
    assert res_before.decision == "answerable"
    assert res_before.answer == "Johnson"

    # Query 2: "What is my last name now?" -> Smith
    intent_now = analyzer.analyze("What is my last name now?")
    res_now = resolver.resolve_facts_for_query(all_cands, intent_now)
    assert res_now.decision == "answerable"
    assert res_now.answer == "Smith"


def test_scenario_c_multi_session_employment_lineage(resolver, analyzer):
    # Hand-constructed or extracted facts across 3 sessions
    cands = [
        FactCandidate(
            subject="user",
            predicate="works_at",
            object="Company A",
            source_session_id="session_01",
            source_message_id="m1",
            source_timestamp="2026-01-01T10:00:00",
            qualifiers={"status": "previous"},
            confidence=0.95,
            evidence_span="I worked at Company A.",
        ),
        FactCandidate(
            subject="user",
            predicate="works_at",
            object="Company B",
            source_session_id="session_03",
            source_message_id="m3",
            source_timestamp="2026-03-01T10:00:00",
            qualifiers={"status": "current"},
            confidence=0.95,
            evidence_span="I joined Company B.",
        ),
    ]

    # Query 1: "Where do I work now?" -> Company B
    intent_now = analyzer.analyze("Where do I work now?")
    res_now = resolver.resolve_facts_for_query(cands, intent_now)
    assert res_now.decision == "answerable"
    assert res_now.answer == "Company B"

    # Query 2: "Where did I work before Company B?" -> Company A
    intent_before = analyzer.analyze("Where did I work before Company B?")
    res_before = resolver.resolve_facts_for_query(cands, intent_before)
    assert res_before.decision == "answerable"
    assert res_before.answer == "Company A"


def test_scenario_d_conflict_abstention(resolver, analyzer):
    # Two simultaneous conflicting facts with identical score and no temporal order
    cands = [
        FactCandidate(
            subject="user",
            predicate="lives_in",
            object="Paris",
            source_session_id="session_01",
            source_message_id="m1",
            source_timestamp="2026-01-01T10:00:00",
            confidence=0.95,
            evidence_span="I live in Paris.",
        ),
        FactCandidate(
            subject="user",
            predicate="lives_in",
            object="London",
            source_session_id="session_01",
            source_message_id="m2",
            source_timestamp="2026-01-01T10:00:00",
            confidence=0.95,
            evidence_span="I live in London.",
        ),
    ]

    intent = analyzer.analyze("Where do I live?")
    # Neither historical nor current keyword, same timestamp -> conflict detected -> abstain
    res = resolver.resolve_facts_for_query(cands, intent)
    assert res.decision == "abstain"
    assert res.reason == "conflicting_evidence"
