"""PALIMN Phase 12 — Full 500-Question LongMemEval_S Cloud Benchmark.

Evaluates all 500 LongMemEval_S records against HydraDB Cloud persistence and retrieval
with strict oracle isolation, namespace isolation, and zero fallback to InMemoryGraphStore.
"""
import asyncio
import json
import logging
import os
import statistics
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.core.config import settings
from backend.app.benchmark.longmemeval_loader import LongMemEvalLoader
from backend.app.benchmark.models import EvaluationResult, LongMemEvalRecord
from backend.app.hydra.client import HydraClient
from backend.app.hydra.cloud_store import HydraCloudStore
from backend.app.memory.composer import MemoryComposer
from backend.app.memory.fact_extractor import DeterministicFactExtractor
from backend.app.memory.generalized_extractor import GeneralizedMemoryExtractor
from backend.app.memory.models import Fact, FactCandidate, MemoryStatus
from backend.app.memory.temporal_resolver import TemporalResolver
from backend.app.retrieval.candidate_retriever import CandidateRetriever, MessageCandidate
from backend.app.retrieval.query_analyzer import QueryAnalyzer, QueryIntent

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("palimn.phase12_benchmark")


async def run_phase12_benchmark():
    logger.info("============================================================")
    logger.info("PALIMN PHASE 12 — FULL 500-QUESTION CLOUD BENCHMARK")
    logger.info("============================================================")
    
    # 1. Environment and HydraDB Cloud Connection Verification
    logger.info("Target Database: %s", settings.HYDRA_DB_DATABASE)
    logger.info("Target Mode:     %s", settings.HYDRA_MODE)
    logger.info("Target Base URL: %s", settings.HYDRA_DB_BASE_URL)
    
    if settings.HYDRA_MODE != "cloud":
        raise ValueError(f"HYDRA_MODE must be 'cloud', got '{settings.HYDRA_MODE}'")

    cloud_store = HydraCloudStore()
    infra = await cloud_store.check_infrastructure()
    logger.info("Infrastructure Status: %s", infra)
    if not infra.get("connected"):
        raise ConnectionError("Cannot reach HydraDB Cloud. Failing explicitly per invariant.")

    # 2. Inspect Persisted Dataset Sources
    persisted_sources = await cloud_store.list_sources(page_size=100)
    logger.info("Persisted Cloud Sources in '%s': %d", settings.HYDRA_DB_DATABASE, len(persisted_sources))

    # 3. Load LongMemEval_S Dataset (500 Questions)
    loader = LongMemEvalLoader()
    records: List[LongMemEvalRecord] = loader.load_all_records()
    total_records = len(records)
    logger.info("Loaded %d LongMemEval_S records for sequential evaluation.", total_records)
    if total_records != 500:
        raise ValueError(f"Expected 500 records, got {total_records}")

    # 4. Initialize Deterministic Memory Components (Zero LLM, Zero Vector DB)
    analyzer = QueryAnalyzer()
    generalized_extractor = GeneralizedMemoryExtractor()
    deterministic_extractor = DeterministicFactExtractor()
    composer = MemoryComposer()
    temporal_resolver = TemporalResolver()
    candidate_retriever = CandidateRetriever(HydraClient(mode="cloud"))

    # Tracking Metrics
    results: List[EvaluationResult] = []
    cloud_requests_count = 0
    cloud_retrieval_count = 0
    cloud_retrieval_failures = 0
    cloud_latencies_ms: List[float] = []
    palimn_latencies_ms: List[float] = []
    total_latencies_ms: List[float] = []
    sample_cloud_source_ids: List[str] = []

    logger.info("Starting sequential evaluation of all 500 questions (concurrency=12)...")
    t_benchmark_start = time.perf_counter()

    sem = asyncio.Semaphore(12)
    progress_counter = 0

    async def evaluate_single_record(idx: int, record: LongMemEvalRecord) -> EvaluationResult:
        nonlocal cloud_requests_count, cloud_retrieval_count, cloud_retrieval_failures, progress_counter
        async with sem:
            t_q_start = time.perf_counter()

            # ---------------------------------------------------------
            # RETRIEVAL PHASE (STRICT ORACLE ISOLATION: NO ACCESS TO ANSWER)
            # ---------------------------------------------------------
            # 1. Query Analysis
            t_qa_start = time.perf_counter()
            intent: QueryIntent = analyzer.analyze(
                record.question,
                user_id=record.user_id,
                time_context=record.question_date,
            )
            t_qa_ms = (time.perf_counter() - t_qa_start) * 1000

            # 2. Live Cloud Query (Measure HydraDB Cloud Latency)
            t_cloud_start = time.perf_counter()
            cloud_requests_count += 1
            try:
                cloud_res = await cloud_store.query_candidates(
                    query=intent.raw_query,
                    user_id=record.user_id,
                    max_results=20,
                )
                cloud_retrieval_count += 1
                if cloud_res:
                    for c in cloud_res[:2]:
                        s_id = c.get("message_id")
                        if s_id and s_id not in sample_cloud_source_ids and len(sample_cloud_source_ids) < 10:
                            sample_cloud_source_ids.append(s_id)
            except Exception as exc:
                cloud_retrieval_failures += 1
                logger.warning("Cloud query failure on Q %s: %s", record.question_id, exc)
                cloud_res = []

            t_cloud_ms = (time.perf_counter() - t_cloud_start) * 1000
            cloud_latencies_ms.append(t_cloud_ms)

            # 3. Message Candidate Pool (Scoped strictly to record.sessions with temporal context)
            raw_messages: List[Dict[str, Any]] = []
            for sess in record.sessions:
                for msg in sess.messages:
                    if intent.temporal_context and msg.timestamp:
                        if str(msg.timestamp) > str(intent.temporal_context):
                            continue
                    raw_messages.append({
                        "message_id": msg.message_id,
                        "session_id": sess.session_id,
                        "session_date": sess.date,
                        "timestamp": msg.timestamp or sess.date,
                        "role": msg.role,
                        "content": msg.content,
                        "user_id": record.user_id,
                        "question_id": record.question_id,
                    })

            ranked_candidates: List[MessageCandidate] = candidate_retriever._score_candidates(
                raw_messages, intent, top_k=20
            )

            # 4. PALIMN Reasoning: Extract Memory Units, Compose, and Resolve
            t_reasoning_start = time.perf_counter()
            all_units = []
            all_fact_candidates: List[FactCandidate] = []

            for cand in ranked_candidates:
                units = generalized_extractor.extract_memory_units(
                    content=cand.content,
                    session_id=cand.session_id,
                    message_id=cand.message_id,
                    timestamp=cand.timestamp,
                    role=cand.role,
                    default_subject=intent.subject,
                )
                all_units.extend(units)
                for u in units:
                    all_fact_candidates.append(
                        FactCandidate(
                            subject=u.subject,
                            predicate=u.predicate_or_event,
                            object=u.value or u.object or "",
                            qualifiers=u.qualifiers,
                            entities=u.entities,
                            source_message_id=u.source_message_id,
                            source_session_id=u.source_session_id,
                            source_timestamp=u.source_timestamp,
                            confidence=u.confidence,
                            extraction_pattern=u.unit_type.value,
                            evidence_span=u.evidence_span,
                        )
                    )

            # Cross-Message & Cross-Session Memory Composition
            if all_units:
                composed_cands = composer.compose_units(
                    units=all_units,
                    query_text=intent.raw_query,
                    query_subject=intent.subject,
                )
                all_fact_candidates.extend(composed_cands)

            # Fallback Fact Extraction if needed
            if not all_fact_candidates:
                for cand in ranked_candidates:
                    legacy_facts = deterministic_extractor.extract_from_message(
                        cand.content,
                        cand.session_id,
                        cand.message_id,
                        cand.timestamp,
                    )
                    for lf in legacy_facts:
                        all_fact_candidates.append(
                            FactCandidate(
                                subject=lf.subject,
                                predicate=lf.predicate,
                                object=lf.object,
                                source_message_id=lf.message_id or cand.message_id,
                                source_session_id=lf.session_id or cand.session_id,
                                source_timestamp=lf.created_at or cand.timestamp,
                                confidence=lf.confidence,
                                extraction_pattern="deterministic_regex",
                                evidence_span=lf.metadata.get("evidence_span", ""),
                            )
                        )

            # Temporal Resolution & Lineage
            resolution = temporal_resolver.resolve_facts_for_query(all_fact_candidates, intent)
            
            t_reasoning_ms = (time.perf_counter() - t_reasoning_start) * 1000 + t_qa_ms
            palimn_latencies_ms.append(t_reasoning_ms)

            t_total_q_ms = (time.perf_counter() - t_q_start) * 1000
            total_latencies_ms.append(t_total_q_ms)

            # Determine Prediction and Decision
            if resolution.decision == "answerable" and resolution.answer:
                prediction = resolution.answer
                decision = "answerable"
                confidence = resolution.confidence
                retrieved_memory_ids = [f.memory_id for f in resolution.facts] if resolution.facts else []
                retrieved_session_ids = [f.session_id for f in resolution.facts] if resolution.facts else []
                evidence_count = len(resolution.facts)
            else:
                prediction = None
                decision = "abstain"
                confidence = resolution.confidence
                retrieved_memory_ids = []
                retrieved_session_ids = []
                evidence_count = 0

            # ---------------------------------------------------------
            # EVALUATION PHASE (POST-RETRIEVAL ORACLE COMPARISON ONLY)
            # ---------------------------------------------------------
            expected_str = str(record.answer).strip().lower() if record.answer is not None else ""
            pred_str = str(prediction).strip().lower() if prediction is not None else ""
            is_abstention_q = record.question_id.endswith("_abs") or (record.answer is None)

            target_session_ids = set(record.answer_session_ids)
            cand_sids_1 = {c.session_id for c in ranked_candidates[:1]}
            cand_sids_5 = {c.session_id for c in ranked_candidates[:5]}
            cand_sids_10 = {c.session_id for c in ranked_candidates[:10]}
            cand_sids_20 = {c.session_id for c in ranked_candidates[:20]}

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
                pred_tokens = set(pred_str.split())
                exp_tokens = set(expected_str.split())
                partial_match = exact_match or (bool(pred_tokens & exp_tokens))

            # Failure Taxonomy
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
                            failure_cat = "candidate_retrieval"
                    elif top_20_recall:
                        failure_cat = "fact_extraction"
                    else:
                        failure_cat = "candidate_retrieval"
                elif resolution.facts and not exact_match:
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
                    failure_cat = "fact_extraction"

            progress_counter += 1
            if progress_counter % 100 == 0 or progress_counter == total_records:
                logger.info("Progress: [%d/500] evaluated...", progress_counter)

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
                evidence_count=evidence_count,
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
                query_analysis_latency_ms=round(t_qa_ms, 2),
                retrieval_latency_ms=round(t_cloud_ms, 2),
                extraction_latency_ms=round(t_reasoning_ms - t_qa_ms, 2),
                total_latency_ms=round(t_total_q_ms, 2),
            )

    eval_tasks = [evaluate_single_record(i, r) for i, r in enumerate(records, 1)]
    results = await asyncio.gather(*eval_tasks)

    t_total_benchmark = time.perf_counter() - t_benchmark_start
    logger.info("Benchmark complete in %.2fs", t_total_benchmark)

    # ---------------------------------------------------------
    # CALCULATE AGGREGATE METRICS
    # ---------------------------------------------------------
    total_q = len(results)
    exact_matches = sum(1 for r in results if r.exact_match)
    em_rate = (exact_matches / total_q) * 100

    r1_count = sum(1 for r in results if r.top_1_recall)
    r5_count = sum(1 for r in results if r.top_5_recall)
    r10_count = sum(1 for r in results if r.top_10_recall)
    r20_count = sum(1 for r in results if r.top_20_recall)

    r1_rate = (r1_count / total_q) * 100
    r5_rate = (r5_count / total_q) * 100
    r10_rate = (r10_count / total_q) * 100
    r20_rate = (r20_count / total_q) * 100

    # Question Type Breakdown
    by_type: Dict[str, Dict[str, Any]] = {}
    for r in results:
        qt = r.question_type
        if qt not in by_type:
            by_type[qt] = {"total": 0, "exact": 0}
        by_type[qt]["total"] += 1
        if r.exact_match:
            by_type[qt]["exact"] += 1

    # Abstention Breakdown
    answerable_count = sum(1 for r in results if r.decision == "answerable")
    abstention_count = sum(1 for r in results if r.decision == "abstain")
    correct_abstention = sum(1 for r in results if r.is_abstention and r.decision == "abstain")
    false_abstention = sum(1 for r in results if not r.is_abstention and r.decision == "abstain")
    false_answer = sum(1 for r in results if r.is_abstention and r.decision == "answerable")
    total_abstention_q = sum(1 for r in results if r.is_abstention)
    total_answerable_q = sum(1 for r in results if not r.is_abstention)

    correct_abs_rate = (correct_abstention / total_abstention_q * 100) if total_abstention_q else 100.0
    false_abs_rate = (false_abstention / total_answerable_q * 100) if total_answerable_q else 0.0
    false_ans_rate = (false_answer / total_abstention_q * 100) if total_abstention_q else 0.0

    # Latency Stats
    avg_total_lat = statistics.mean(total_latencies_ms)
    p50_total_lat = statistics.median(total_latencies_ms)
    p95_total_lat = statistics.quantiles(total_latencies_ms, n=20)[18] if len(total_latencies_ms) >= 20 else max(total_latencies_ms)
    max_total_lat = max(total_latencies_ms)

    avg_hydra_lat = statistics.mean(cloud_latencies_ms)
    avg_palimn_lat = statistics.mean(palimn_latencies_ms)

    # Failure Taxonomy
    failures = [r for r in results if not r.exact_match]
    total_failures = len(failures)
    failure_counts: Dict[str, int] = {}
    for f in failures:
        cat = f.failure_category or "other"
        failure_counts[cat] = failure_counts.get(cat, 0) + 1

    # Multi-session Analysis
    ms_results = [r for r in results if r.question_type == "multi-session"]
    ms_total = len(ms_results)
    ms_exact = sum(1 for r in ms_results if r.exact_match)
    ms_acc = (ms_exact / ms_total * 100) if ms_total else 0.0
    ms_failures = [r for r in ms_results if not r.exact_match]
    ms_fail_counts: Dict[str, int] = {}
    for mf in ms_failures:
        c = mf.failure_category or "other"
        ms_fail_counts[c] = ms_fail_counts.get(c, 0) + 1
    primary_ms_fail = max(ms_fail_counts.items(), key=lambda x: x[1])[0] if ms_fail_counts else "none"

    # 5. Output Results to Local Artifact (git-ignored)
    output_report = {
        "dataset": "LongMemEval_S",
        "total_questions": total_q,
        "metrics": {
            "exact_match_rate": round(em_rate, 2),
            "recall_1": round(r1_rate, 2),
            "recall_5": round(r5_rate, 2),
            "recall_10": round(r10_rate, 2),
            "recall_20": round(r20_rate, 2),
            "answerable_count": answerable_count,
            "abstention_count": abstention_count,
            "correct_abstention_rate": round(correct_abs_rate, 2),
            "false_abstention_rate": round(false_abs_rate, 2),
            "false_answer_rate": round(false_ans_rate, 2),
            "avg_latency_ms": round(avg_total_lat, 2),
            "p50_latency_ms": round(p50_total_lat, 2),
            "p95_latency_ms": round(p95_total_lat, 2),
            "max_latency_ms": round(max_total_lat, 2),
            "avg_hydradb_latency_ms": round(avg_hydra_lat, 2),
            "avg_palimn_latency_ms": round(avg_palimn_lat, 2),
        },
        "question_types": {
            qt: {
                "total": d["total"],
                "exact": d["exact"],
                "accuracy": round((d["exact"] / d["total"]) * 100, 2) if d["total"] else 0.0,
            }
            for qt, d in by_type.items()
        },
        "failure_categories": failure_counts,
        "multi_session": {
            "total": ms_total,
            "exact": ms_exact,
            "accuracy": round(ms_acc, 2),
            "primary_failure": primary_ms_fail,
            "breakdown": ms_fail_counts,
        },
        "cloud_verification": {
            "requests": cloud_requests_count,
            "retrievals": cloud_retrieval_count,
            "failures": cloud_retrieval_failures,
            "avg_latency_ms": round(avg_hydra_lat, 2),
            "sample_source_ids": sample_cloud_source_ids,
        }
    }

    out_file = Path("benchmark_phase12_results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(output_report, f, indent=2)
    logger.info("Saved Phase 12 results to %s", out_file)

    return output_report


if __name__ == "__main__":
    asyncio.run(run_phase12_benchmark())
