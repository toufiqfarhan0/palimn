"""Evaluation engine for comparing retrieval results against LongMemEval gold answers."""
import time
from typing import TYPE_CHECKING, Any, List, Optional
from backend.app.benchmark.models import EvaluationResult, LongMemEvalRecord
from backend.app.memory.fact_extractor import DeterministicFactExtractor
from backend.app.retrieval.candidate_retriever import CandidateRetriever
from backend.app.retrieval.graph_retriever import GraphRetriever
from backend.app.retrieval.query_analyzer import QueryAnalyzer, QueryIntent

if TYPE_CHECKING:
    from backend.app.hydra.client import HydraClient


class LongMemEvalEvaluator:
    """Performs strict oracle-isolated evaluation on LongMemEval_S records."""

    def __init__(self, hydra_client: Any):
        self.hydra = hydra_client
        self.analyzer = QueryAnalyzer()
        self.extractor = DeterministicFactExtractor()
        self.candidate_retriever = CandidateRetriever(self.hydra)
        self.graph_retriever = GraphRetriever(self.hydra)

    async def evaluate_record(self, record: LongMemEvalRecord) -> EvaluationResult:
        """Run single record evaluation with strict separation between retrieval and oracle."""
        t_start = time.perf_counter()

        # ==========================================================
        # RETRIEVAL PHASE (STRICTLY NO ACCESS TO GOLD ANSWER/EVIDENCE)
        # ==========================================================
        # 1. Query Analysis
        t_qa_start = time.perf_counter()
        intent: QueryIntent = self.analyzer.analyze(
            record.question,
            user_id=record.user_id,
            time_context=record.question_date,
        )
        t_qa_ms = round((time.perf_counter() - t_qa_start) * 1000, 2)

        # 2. Candidate Retrieval & Scoring
        t_ret_start = time.perf_counter()
        candidates = await self.candidate_retriever.retrieve_candidate_messages_async(intent, top_k=20)
        t_ret_ms = round((time.perf_counter() - t_ret_start) * 1000, 2)

        # 3. Fact Extraction & Resolution
        t_fe_start = time.perf_counter()
        retrieved_facts, reasoning = await self.graph_retriever.retrieve_candidates(intent)
        t_fe_ms = round((time.perf_counter() - t_fe_start) * 1000, 2)

        t_total_ms = round((time.perf_counter() - t_start) * 1000, 2)

        if retrieved_facts:
            prediction = retrieved_facts[0].object
            decision = "answerable"
            confidence = retrieved_facts[0].confidence
            retrieved_memory_ids = [f.memory_id for f in retrieved_facts]
            retrieved_session_ids = [f.session_id for f in retrieved_facts]
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

        is_abstention_q = record.question_id.endswith("_abs") or (record.answer is None)
        
        # Calculate Top-K Retrieval Recall against gold answer session IDs
        target_session_ids = set(record.answer_session_ids)
        cand_sids_1 = {c.session_id for c in candidates[:1]}
        cand_sids_5 = {c.session_id for c in candidates[:5]}
        cand_sids_10 = {c.session_id for c in candidates[:10]}
        cand_sids_20 = {c.session_id for c in candidates[:20]}

        top_1_recall = bool(target_session_ids & cand_sids_1) if target_session_ids else False
        top_5_recall = bool(target_session_ids & cand_sids_5) if target_session_ids else False
        top_10_recall = bool(target_session_ids & cand_sids_10) if target_session_ids else False
        top_20_recall = bool(target_session_ids & cand_sids_20) if target_session_ids else False

        if is_abstention_q:
            abstention_correct = (decision == "abstain")
            exact_match = abstention_correct
            partial_match = exact_match
        else:
            abstention_correct = False
            exact_match = (
                bool(pred_str) and (pred_str in expected_str or expected_str in pred_str)
            )
            # Partial token overlap match
            pred_tokens = set(pred_str.split())
            exp_tokens = set(expected_str.split())
            partial_match = exact_match or (bool(pred_tokens & exp_tokens))

        # Failure Classification (Step 29 Taxonomy)
        failure_cat = None
        if not exact_match:
            q_lower = record.question.lower()
            if intent.query_type == "unknown":
                failure_cat = "query_understanding"
            elif not top_20_recall and target_session_ids:
                failure_cat = "candidate_retrieval"
            elif is_abstention_q and decision != "abstain":
                failure_cat = "abstention"
            elif decision == "abstain" and not is_abstention_q:
                if record.question_type == "multi-session":
                    if len(record.answer_session_ids) > 1:
                        failure_cat = "cross_session_composition"
                    else:
                        failure_cat = "cross_message_composition"
                elif top_20_recall:
                    failure_cat = "fact_extraction"
                else:
                    failure_cat = "candidate_retrieval"
            elif retrieved_facts and not exact_match:
                if any(w in q_lower for w in ["before", "previously", "prior", "last name before", "did i live before"]):
                    failure_cat = "revision_resolution"
                elif any(w in q_lower for w in ["now", "currently", "today"]):
                    failure_cat = "temporal_reasoning"
                elif record.question_type == "multi-session":
                    failure_cat = "cross_session_composition"
                elif partial_match:
                    failure_cat = "entity_binding"
                else:
                    failure_cat = "fact_extraction"
            else:
                failure_cat = "other"

        return EvaluationResult(
            question_id=record.question_id,
            question=record.question,
            question_type=record.question_type,
            question_date=record.question_date,
            prediction=prediction,
            decision=decision,
            confidence=confidence,
            retrieved_memory_ids=retrieved_memory_ids,
            retrieved_session_ids=retrieved_session_ids,
            evidence_count=len(retrieved_facts),
            top_1_recall=top_1_recall,
            top_5_recall=top_5_recall,
            top_10_recall=top_10_recall,
            top_20_recall=top_20_recall,
            expected_answer=str(record.answer) if record.answer is not None else None,
            exact_match=exact_match,
            partial_match=partial_match,
            is_abstention=is_abstention_q,
            abstention_correct=abstention_correct,
            failure_category=failure_cat,
            query_analysis_latency_ms=t_qa_ms,
            retrieval_latency_ms=t_ret_ms,
            extraction_latency_ms=t_fe_ms,
            total_latency_ms=t_total_ms,
        )
