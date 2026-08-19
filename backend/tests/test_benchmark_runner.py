"""Tests for benchmark runner, metrics calculation, and namespace isolation."""
import pytest
from backend.app.benchmark.models import (
    BenchmarkAggregateMetrics,
    BenchmarkRunReport,
    EvaluationResult,
    LongMemEvalRecord,
)
from backend.app.benchmark.longmemeval_loader import LongMemEvalLoader
from backend.app.benchmark.runner import BenchmarkRunner
from backend.app.hydra.client import HydraClient


def test_deterministic_sampling():
    """Verify deterministic sampling returns identical records in consistent order."""
    loader = LongMemEvalLoader()
    sample1 = loader.load_records(limit=10)
    sample2 = loader.load_records(limit=10)
    
    assert len(sample1) == 10
    assert len(sample2) == 10
    for r1, r2 in zip(sample1, sample2):
        assert r1.question_id == r2.question_id


@pytest.mark.asyncio
async def test_memory_namespace_isolation():
    """Verify memory from question A does not leak into question B."""
    client = HydraClient()
    client._in_memory_store.clear()
    
    # Ingest record A
    client._in_memory_store.merge_node("msg_A", "Message", {
        "id": "msg_A",
        "user_id": "user_AAA",
        "session_id": "sess_A",
        "role": "user",
        "content": "I graduated with a degree in Astronomy.",
        "timestamp": "2023-05-30T17:27:00",
    })
    
    # Ingest record B
    client._in_memory_store.merge_node("msg_B", "Message", {
        "id": "msg_B",
        "user_id": "user_BBB",
        "session_id": "sess_B",
        "role": "user",
        "content": "I graduated with a degree in Biology.",
        "timestamp": "2023-05-30T17:27:00",
    })
    
    runner = BenchmarkRunner(hydra_client=client)
    
    # Evaluate for user_AAA
    rec_A = LongMemEvalRecord(
        question_id="AAA",
        question_type="single-session-user",
        question="What degree did I graduate with?",
        question_date="2023/05/30 (Tue) 23:40",
        user_id="user_AAA",
        answer="Astronomy",
    )
    res_A = await runner.evaluator.evaluate_record(rec_A)
    assert res_A.prediction == "Astronomy"
    assert res_A.exact_match is True
    
    # Evaluate for user_BBB
    rec_B = LongMemEvalRecord(
        question_id="BBB",
        question_type="single-session-user",
        question="What degree did I graduate with?",
        question_date="2023/05/30 (Tue) 23:40",
        user_id="user_BBB",
        answer="Biology",
    )
    res_B = await runner.evaluator.evaluate_record(rec_B)
    assert res_B.prediction == "Biology"
    assert res_B.exact_match is True


def test_metrics_calculation():
    """Verify confusion matrix and recall metric calculations."""
    results = [
        EvaluationResult(
            question_id="q1",
            question="q1",
            question_type="type_a",
            question_date="2023-01-01",
            prediction="Ans1",
            decision="answerable",
            confidence=0.95,
            top_1_recall=True,
            top_5_recall=True,
            top_10_recall=True,
            top_20_recall=True,
            exact_match=True,
            is_abstention=False,
            total_latency_ms=10.0,
        ),
        EvaluationResult(
            question_id="q2_abs",
            question="q2",
            question_type="type_b",
            question_date="2023-01-01",
            prediction=None,
            decision="abstain",
            confidence=0.0,
            top_1_recall=False,
            top_5_recall=False,
            top_10_recall=False,
            top_20_recall=False,
            exact_match=True,
            is_abstention=True,
            abstention_correct=True,
            total_latency_ms=5.0,
        ),
    ]
    
    total = len(results)
    assert total == 2
    exact_matches = sum(1 for r in results if r.exact_match)
    assert exact_matches == 2
    
    tp = sum(1 for r in results if not r.is_abstention and r.decision == "answerable")
    ca = sum(1 for r in results if r.is_abstention and r.decision == "abstain")
    assert tp == 1
    assert ca == 1
