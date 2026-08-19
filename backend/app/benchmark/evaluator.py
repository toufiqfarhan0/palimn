"""Evaluation engine for comparing retrieval results against LongMemEval gold answers."""
import time
from typing import TYPE_CHECKING, Any, Optional
from backend.app.benchmark.models import EvaluationResult, LongMemEvalRecord
from backend.app.retrieval.graph_retriever import GraphRetriever
from backend.app.retrieval.query_analyzer import QueryAnalyzer
from backend.app.retrieval.evidence import EvidenceAggregator

if TYPE_CHECKING:
    from backend.app.hydra.client import HydraClient


class LongMemEvalEvaluator:
    """Performs strict oracle-isolated evaluation on LongMemEval_S records."""

    def __init__(self, hydra_client: Any):
        self.hydra = hydra_client
        self.analyzer = QueryAnalyzer()
        self.evidence_agg = EvidenceAggregator()

    async def evaluate_record(self, record: LongMemEvalRecord) -> EvaluationResult:
        """Run single record evaluation with strict separation between retrieval and oracle."""
        start_time = time.perf_counter()

        # ==========================================================
        # RETRIEVAL PHASE (STRICTLY NO ACCESS TO GOLD ANSWER/EVIDENCE)
        # ==========================================================
        # Only query text, user id, and question date are passed into retrieval
        intent = self.analyzer.analyze(
            record.question,
            user_id=record.user_id,
            time_context=record.question_date,
        )
        retriever = GraphRetriever(self.hydra)
        candidates, reasoning = await retriever.retrieve_candidates(intent)

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        if candidates:
            prediction = candidates[0].object
            decision = "answerable"
            confidence = candidates[0].confidence
            retrieved_memory_ids = [c.memory_id for c in candidates]
            retrieved_session_ids = [c.session_id for c in candidates]
        else:
            prediction = None
            decision = "abstain"
            confidence = 0.0
            retrieved_memory_ids = []
            retrieved_session_ids = []

        # ==========================================================
        # EVALUATION PHASE (POST-RETRIEVAL ORACLE COMPARISON ONLY)
        # ==========================================================
        expected_str = str(record.answer).strip().lower() if record.answer is not None else ""
        pred_str = str(prediction).strip().lower() if prediction is not None else ""

        is_abstention_q = record.question_id.endswith("_abs")
        
        if is_abstention_q:
            abstention_correct = (decision == "abstain")
            exact_match = abstention_correct
        else:
            abstention_correct = False
            exact_match = (
                bool(pred_str) and (pred_str in expected_str or expected_str in pred_str)
            )

        return EvaluationResult(
            question_id=record.question_id,
            question=record.question,
            prediction=prediction,
            decision=decision,
            confidence=confidence,
            retrieved_memory_ids=retrieved_memory_ids,
            retrieved_session_ids=retrieved_session_ids,
            latency_ms=latency_ms,
            expected_answer=str(record.answer) if record.answer is not None else None,
            question_type=record.question_type,
            exact_match=exact_match,
            is_abstention=is_abstention_q,
            abstention_correct=abstention_correct,
        )
