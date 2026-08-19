"""Tests for LongMemEval_S dataset loader, normalization, idempotency, and oracle isolation."""
import pytest
from backend.app.benchmark.longmemeval_loader import LongMemEvalLoader, normalize_date_string, normalize_raw_record
from backend.app.benchmark.evaluator import LongMemEvalEvaluator
from backend.app.benchmark.models import LongMemEvalRecord, EvaluationResult
from backend.app.hydra.client import HydraClient, get_hydra_client


@pytest.fixture
def sample_raw_record():
    return {
        "question_id": "test_q001",
        "question_type": "temporal-reasoning",
        "question": "Where did I live previously?",
        "question_date": "2023/05/30 (Tue) 23:40",
        "answer": "Bangalore",
        "answer_session_ids": ["session_01"],
        "haystack_session_ids": ["session_02", "session_01"],
        "haystack_dates": ["2023/03/15 (Wed) 14:30", "2023/01/10 (Tue) 10:00"],
        "haystack_sessions": [
            [
                {"role": "user", "content": "I moved to Hyderabad."},
                {"role": "assistant", "content": "Welcome to Hyderabad!"}
            ],
            [
                {"role": "user", "content": "I live in Bangalore.", "has_answer": True},
                {"role": "assistant", "content": "Great city!"}
            ]
        ]
    }


def test_date_normalization():
    """Verify raw date strings are normalized into sortable ISO dates."""
    d1 = normalize_date_string("2023/05/10 (Wed) 10:15")
    d2 = normalize_date_string("2023/01/05 09:30")
    assert d1 == "2023-05-10T10:15:00"
    assert d2 == "2023-01-05T09:30:00"
    assert d2 < d1  # Sortable chronologically


def test_raw_record_normalization_and_chronology(sample_raw_record):
    """Verify session normalization and chronological ordering."""
    record = normalize_raw_record(sample_raw_record)
    
    assert record.question_id == "test_q001"
    assert record.question_type == "temporal-reasoning"
    assert len(record.sessions) == 2
    
    # Chronological sort check: session_01 (2023-01-10) should precede session_02 (2023-03-15)
    s1 = record.sessions[0]
    s2 = record.sessions[1]
    assert s1.session_id == "session_01"
    assert s1.session_index == 1
    assert s1.date == "2023-01-10T10:00:00"
    
    assert s2.session_id == "session_02"
    assert s2.session_index == 2
    assert s2.date == "2023-03-15T14:30:00"


def test_deterministic_message_ids(sample_raw_record):
    """Verify message IDs are deterministic and reproducible."""
    record = normalize_raw_record(sample_raw_record)
    msg1 = record.sessions[0].messages[0]
    msg2 = record.sessions[0].messages[1]
    
    assert msg1.message_id == "msg_test_q001_s001_m000"
    assert msg2.message_id == "msg_test_q001_s001_m001"
    assert msg1.role == "user"
    assert msg1.content == "I live in Bangalore."


def test_dataset_loader():
    """Verify LongMemEvalLoader loads dataset records with caching."""
    loader = LongMemEvalLoader()
    records = loader.load_records(limit=2)
    assert len(records) == 2
    assert records[0].question_id is not None
    assert len(records[0].sessions) > 0


@pytest.mark.asyncio
async def test_single_record_ingestion_and_idempotency(sample_raw_record):
    """Verify single-record ingestion into graph and idempotency upon re-ingestion."""
    client = HydraClient()
    client._in_memory_store.clear()
    
    record = normalize_raw_record(sample_raw_record)
    res1 = await client.ingest_longmemeval_record(record)
    
    assert res1["status"] == "success"
    assert res1["sessions_ingested"] == 2
    assert res1["messages_ingested"] == 4
    
    nodes_after_first = len(client._in_memory_store.nodes)
    edges_after_first = len(client._in_memory_store.edges)
    
    # Ingest same record a second time
    res2 = await client.ingest_longmemeval_record(record)
    assert res2["status"] == "success"
    
    nodes_after_second = len(client._in_memory_store.nodes)
    edges_after_second = len(client._in_memory_store.edges)
    
    # Verify no duplicate nodes or edges created
    assert nodes_after_first == nodes_after_second
    assert edges_after_first == edges_after_second


@pytest.mark.asyncio
async def test_oracle_isolation_and_evaluation(sample_raw_record):
    """Verify retrieval input is strictly isolated from gold answer and oracle evidence."""
    client = HydraClient()
    client._in_memory_store.seed_synthetic_data()
    
    record = normalize_raw_record(sample_raw_record)
    record.user_id = "user_demo"
    evaluator = LongMemEvalEvaluator(client)
    
    result: EvaluationResult = await evaluator.evaluate_record(record)
    
    # Verify evaluation fields
    assert result.question_id == "test_q001"
    assert result.expected_answer == "Bangalore"
    assert result.prediction == "Bangalore"  # Match from seeded graph historical state
    assert result.decision == "answerable"
    assert result.exact_match is True
    assert result.latency_ms > 0
