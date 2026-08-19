0"""Phase 13: HydraDB Cloud Latency & Retrieval Diagnostic Script (READ-ONLY)."""

import asyncio
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.core.config import settings
from backend.app.benchmark.longmemeval_loader import LongMemEvalLoader, LongMemEvalRecord
from backend.app.hydra.cloud_store import HydraCloudStore
from backend.app.retrieval.candidate_retriever import CandidateRetriever
from backend.app.retrieval.query_analyzer import QueryAnalyzer, QueryIntent
from backend.app.memory.fact_extractor import DeterministicFactExtractor
from backend.app.memory.generalized_extractor import GeneralizedMemoryExtractor
from backend.app.memory.composer import MemoryComposer
from backend.app.memory.temporal_resolver import TemporalResolver, FactCandidate
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("Phase13Diagnostic")


async def main():
    print("=" * 70)
    print("PALIMN PHASE 13 — HYDRADB CLOUD LATENCY & RETRIEVAL DIAGNOSTIC")
    print("=" * 70)

    # 1. Load LongMemEval dataset
    dataset_path = PROJECT_ROOT / "temp_datasets" / "longmemeval_s_cleaned.json"
    loader = LongMemEvalLoader(str(dataset_path))
    records = loader.load_all_records()
    record_map = {r.question_id: r for r in records}
    print(f"Loaded {len(records)} records.")

    # 2. Setup PALIMN components and Cloud Store
    cloud_store = HydraCloudStore()
    analyzer = QueryAnalyzer()
    candidate_retriever = CandidateRetriever(hydra_client=cloud_store.client)
    generalized_extractor = GeneralizedMemoryExtractor()
    deterministic_extractor = DeterministicFactExtractor()
    composer = MemoryComposer()
    temporal_resolver = TemporalResolver()

    # -------------------------------------------------------------
    # STEP 1 & 2: TRACE QUESTION e47becba & HTTP BREAKDOWN
    # -------------------------------------------------------------
    target_qid = "e47becba"
    target_rec = record_map.get(target_qid)
    if not target_rec:
        for k, v in record_map.items():
            if "e47becba" in k:
                target_rec = v
                target_qid = k
                break

    if target_rec is None:
        target_rec = records[0]
        target_qid = target_rec.question_id

    print(f"\n--- STEP 1 & 2: Trace Question {target_qid} ---")
    print(f"Question: '{target_rec.question}'")
    print(f"Expected Answer: '{target_rec.answer}'")
    print(f"Target Session IDs: {target_rec.answer_session_ids}")

    # Stage 1: Query Analysis
    t0 = time.perf_counter()
    intent = analyzer.analyze(target_rec.question, user_id=target_rec.user_id, time_context=target_rec.question_date)
    t_qa = (time.perf_counter() - t0) * 1000
    print(f"1. Query Analysis Latency: {t_qa:.2f} ms (Type: {intent.query_type}, Subject: '{intent.subject}', Temporal: '{intent.temporal_context}')")

    # Stage 2: Detailed HTTP Request Breakdown for HydraDB Cloud
    # Measure raw HTTP request using httpx with event hooks
    request_timings: Dict[str, Any] = {}
    
    async def log_request(request):
        request_timings['req_start'] = time.perf_counter()
        request_timings['req_body_len'] = len(request.content) if request.content else 0
        request_timings['req_headers'] = dict(request.headers)

    async def log_response(response):
        request_timings['resp_end'] = time.perf_counter()
        request_timings['resp_status'] = response.status_code
        request_timings['resp_headers'] = dict(response.headers)
        await response.aread()
        request_timings['resp_bytes'] = len(response.content)

    headers = {
        "Authorization": f"Bearer {cloud_store.api_key}",
        "Content-Type": "application/json",
        "API-Version": "2",
    }
    payload = {
        "database": settings.HYDRA_DB_DATABASE,
        "query": intent.raw_query,
        "type": "memory",
        "max_results": 20,
        "graph_context": True,
    }
    payload_json = json.dumps(payload)

    async with httpx.AsyncClient(
        event_hooks={'request': [log_request], 'response': [log_response]},
        timeout=60.0
    ) as raw_client:
        # First query: cold connection
        t_http_start = time.perf_counter()
        resp = await raw_client.post(
            f"{settings.HYDRA_DB_BASE_URL}/query",
            headers=headers,
            content=payload_json,
        )
        t_http_total = (time.perf_counter() - t_http_start) * 1000
        
        # Second query: warm connection reuse on same client
        t_warm_start = time.perf_counter()
        resp_warm = await raw_client.post(
            f"{settings.HYDRA_DB_BASE_URL}/query",
            headers=headers,
            content=payload_json,
        )
        t_http_warm = (time.perf_counter() - t_warm_start) * 1000

    resp_data = resp.json()
    t_parse_start = time.perf_counter()
    resp_data_parsed = resp.json()
    t_json_parse = (time.perf_counter() - t_parse_start) * 1000

    print(f"\n2. HydraDB Cloud HTTP Request Breakdown:")
    print(f"   HTTP Method: POST")
    print(f"   URL: {settings.HYDRA_DB_BASE_URL}/query")
    print(f"   Status Code: {resp.status_code}")
    print(f"   Cold HTTP Latency (DNS + TLS + Connect + Server + Download): {t_http_total:.2f} ms")
    print(f"   Warm HTTP Latency (Connection Reused + Server + Download): {t_http_warm:.2f} ms")
    print(f"   Request Payload Size: {len(payload_json)} bytes")
    print(f"   Response Payload Size: {len(resp.content)} bytes")
    print(f"   Client-Side JSON Parse Time: {t_json_parse:.4f} ms")
    print(f"   Server Response Headers of Interest:")
    for h_key in ["server", "content-type", "server-timing", "x-process-time", "x-request-id", "date"]:
        if h_key in resp.headers:
            print(f"      {h_key}: {resp.headers[h_key]}")

    # Stage 3: SDK Query Timing Comparison (graph_context=True vs graph_context=False)
    print("\n--- STEP 4: graph_context=True vs graph_context=False Comparison ---")
    t_sdk_gc_true_start = time.perf_counter()
    res_gc_true = await cloud_store.client.query(
        database=settings.HYDRA_DB_DATABASE,
        query=intent.raw_query,
        type="memory",
        max_results=20,
        graph_context=True,
    )
    t_sdk_gc_true = (time.perf_counter() - t_sdk_gc_true_start) * 1000

    t_sdk_gc_false_start = time.perf_counter()
    res_gc_false = await cloud_store.client.query(
        database=settings.HYDRA_DB_DATABASE,
        query=intent.raw_query,
        type="memory",
        max_results=20,
        graph_context=False,
    )
    t_sdk_gc_false = (time.perf_counter() - t_sdk_gc_false_start) * 1000

    print(f"   SDK query with graph_context=True:  {t_sdk_gc_true:.2f} ms")
    print(f"   SDK query with graph_context=False: {t_sdk_gc_false:.2f} ms")
    print(f"   Chunks returned (graph_context=True):  {len(res_gc_true.data.chunks or []) if res_gc_true.data else 0}")
    print(f"   Chunks returned (graph_context=False): {len(res_gc_false.data.chunks or []) if res_gc_false.data else 0}")
    if res_gc_true.data and res_gc_true.data.graph_context:
        print(f"   Graph context in True response: {len(str(res_gc_true.data.graph_context))} chars")
    if res_gc_false.data and res_gc_false.data.graph_context:
        print(f"   Graph context in False response: {len(str(res_gc_false.data.graph_context))} chars")

    # Stage 4: PALIMN Candidate Scoring & Extraction
    print(f"\n--- STEP 9 & 10: Candidates & Extraction for {target_qid} ---")
    raw_messages = []
    for sess in target_rec.sessions:
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
                "user_id": target_rec.user_id,
                "question_id": target_rec.question_id,
            })

    ranked_candidates = candidate_retriever._score_candidates(raw_messages, intent, top_k=20)
    print(f"Ranked candidates count: {len(ranked_candidates)}")
    for i, cand in enumerate(ranked_candidates[:5], 1):
        is_gold = cand.session_id in target_rec.answer_session_ids
        print(f"   Top {i}: session={cand.session_id}, msg={cand.message_id}, score={cand.score:.3f}, len={len(cand.content)} chars, is_gold={is_gold}")
        print(f"          content snippet: '{cand.content[:120]}...'")

    # Extraction and Resolution
    t_extract_start = time.perf_counter()
    all_units = []
    all_fact_candidates = []
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

    if all_units:
        composed_cands = composer.compose_units(
            units=all_units,
            query_text=intent.raw_query,
            query_subject=intent.subject,
        )
        all_fact_candidates.extend(composed_cands)

    resolution = temporal_resolver.resolve_facts_for_query(all_fact_candidates, intent)
    t_extract_ms = (time.perf_counter() - t_extract_start) * 1000

    print(f"\n3. Extraction & Temporal Resolution Latency: {t_extract_ms:.2f} ms")
    print(f"   Decision: {resolution.decision}")
    print(f"   Answer: '{resolution.answer}'")
    print(f"   Confidence: {resolution.confidence}")
    print(f"   Facts count: {len(resolution.facts) if resolution.facts else 0}")
    if resolution.facts:
        for f in resolution.facts:
            print(f"      Fact: ({f.subject}, {f.predicate}, {f.object}) from session {f.session_id}")

    # -------------------------------------------------------------
    # STEP 10: INSPECT KNOWN FAILURE CASES (Recall@5 = True, EM = False)
    # -------------------------------------------------------------
    print("\n--- STEP 10: Inspecting Known Failure Cases (Recall@5=True, EM=False) ---")
    results_path = PROJECT_ROOT / "benchmark_phase12_results.json"
    # Run a quick evaluation on 5 failure cases to inspect them
    failure_sample_ids = []
    # Let's find single-session or knowledge-update questions that failed despite having candidates
    sample_records = [r for r in records if r.question_type in ("single-session-user", "knowledge-update", "temporal-reasoning")][:10]
    
    inspected_count = 0
    for r in records:
        if r.question_id == target_qid or r.answer is None:
            continue
        # Quick eval
        r_intent = analyzer.analyze(r.question, user_id=r.user_id, time_context=r.question_date)
        r_raw_msgs = []
        for sess in r.sessions:
            for msg in sess.messages:
                if r_intent.temporal_context and msg.timestamp:
                    if str(msg.timestamp) > str(r_intent.temporal_context):
                        continue
                r_raw_msgs.append({
                    "message_id": msg.message_id,
                    "session_id": sess.session_id,
                    "session_date": sess.date,
                    "timestamp": msg.timestamp or sess.date,
                    "role": msg.role,
                    "content": msg.content,
                    "user_id": r.user_id,
                    "question_id": r.question_id,
                })
        r_candidates = candidate_retriever._score_candidates(r_raw_msgs, r_intent, top_k=20)
        top5_sids = {c.session_id for c in r_candidates[:5]}
        has_recall5 = bool(set(r.answer_session_ids) & top5_sids)
        
        # Test extraction
        r_units = []
        r_facts = []
        for cand in r_candidates[:5]:
            units = generalized_extractor.extract_memory_units(
                content=cand.content,
                session_id=cand.session_id,
                message_id=cand.message_id,
                timestamp=cand.timestamp,
                role=cand.role,
                default_subject=r_intent.subject,
            )
            r_units.extend(units)
            for u in units:
                r_facts.append(FactCandidate(
                    subject=u.subject, predicate=u.predicate_or_event,
                    object=u.value or u.object or "", qualifiers=u.qualifiers,
                    entities=u.entities, source_message_id=u.source_message_id,
                    source_session_id=u.source_session_id, source_timestamp=u.source_timestamp,
                    confidence=u.confidence, extraction_pattern=u.unit_type.value,
                    evidence_span=u.evidence_span,
                ))
        if r_units:
            r_facts.extend(composer.compose_units(r_units, r_intent.raw_query, r_intent.subject))
        
        r_res = temporal_resolver.resolve_facts_for_query(r_facts, r_intent)
        pred_str = str(r_res.answer or "").strip().lower()
        exp_str = str(r.answer).strip().lower()
        em = bool(pred_str) and (pred_str in exp_str or exp_str in pred_str)

        if has_recall5 and not em and inspected_count < 3:
            inspected_count += 1
            print(f"\n   Failure Case #{inspected_count}: QID={r.question_id} (Type: {r.question_type})")
            print(f"   Question: '{r.question}'")
            print(f"   Expected Gold: '{r.answer}'")
            print(f"   Predicted: '{r_res.answer}' (Decision: {r_res.decision})")
            print(f"   Recall@5: {has_recall5} (Target SIDs: {r.answer_session_ids})")
            # Find the gold message
            for s in r.sessions:
                if s.session_id in r.answer_session_ids:
                    for m in s.messages:
                        if any(token in m.content.lower() for token in exp_str.split()[:2]):
                            print(f"   Gold Source Snippet (Session {s.session_id}): '{m.content[:150]}...'")
                            break

    # -------------------------------------------------------------
    # STEP 11: MULTI-SESSION DIAGNOSTIC (3 Representative Failures)
    # -------------------------------------------------------------
    print("\n--- STEP 11: Multi-Session Failure Diagnostics ---")
    multi_records = [r for r in records if r.question_type == "multi-session"]
    ms_inspected = 0
    for r in multi_records:
        r_intent = analyzer.analyze(r.question, user_id=r.user_id, time_context=r.question_date)
        r_raw_msgs = []
        for sess in r.sessions:
            for msg in sess.messages:
                if r_intent.temporal_context and msg.timestamp:
                    if str(msg.timestamp) > str(r_intent.temporal_context):
                        continue
                r_raw_msgs.append({
                    "message_id": msg.message_id,
                    "session_id": sess.session_id,
                    "session_date": sess.date,
                    "timestamp": msg.timestamp or sess.date,
                    "role": msg.role,
                    "content": msg.content,
                    "user_id": r.user_id,
                    "question_id": r.question_id,
                })
        r_candidates = candidate_retriever._score_candidates(r_raw_msgs, r_intent, top_k=20)
        cand_sids_20 = {c.session_id for c in r_candidates[:20]}
        target_sids = set(r.answer_session_ids)
        target_retrieved = target_sids.issubset(cand_sids_20) if target_sids else False
        partial_retrieved = bool(target_sids & cand_sids_20)

        # Extraction & Composition
        r_units = []
        r_facts = []
        for cand in r_candidates:
            units = generalized_extractor.extract_memory_units(
                content=cand.content,
                session_id=cand.session_id,
                message_id=cand.message_id,
                timestamp=cand.timestamp,
                role=cand.role,
                default_subject=r_intent.subject,
            )
            r_units.extend(units)
            for u in units:
                r_facts.append(FactCandidate(
                    subject=u.subject, predicate=u.predicate_or_event,
                    object=u.value or u.object or "", qualifiers=u.qualifiers,
                    entities=u.entities, source_message_id=u.source_message_id,
                    source_session_id=u.source_session_id, source_timestamp=u.source_timestamp,
                    confidence=u.confidence, extraction_pattern=u.unit_type.value,
                    evidence_span=u.evidence_span,
                ))
        composed: List[FactCandidate] = []
        if r_units:
            composed = composer.compose_units(r_units, r_intent.raw_query, r_intent.subject)
            r_facts.extend(composed)
        
        r_res = temporal_resolver.resolve_facts_for_query(r_facts, r_intent)
        pred_str = str(r_res.answer or "").strip().lower()
        exp_str = str(r.answer).strip().lower()
        em = bool(pred_str) and (pred_str in exp_str or exp_str in pred_str)

        if not em and ms_inspected < 3:
            ms_inspected += 1
            print(f"\n   Multi-Session Failure #{ms_inspected}: QID={r.question_id}")
            print(f"   Question: '{r.question}'")
            print(f"   Expected Gold: '{r.answer}'")
            print(f"   Predicted Answer: '{r_res.answer}' (Decision: {r_res.decision})")
            print(f"   Target Sessions: {r.answer_session_ids}")
            print(f"   All Target Evidence Retrieved in Top 20?: {'YES' if target_retrieved else 'PARTIAL' if partial_retrieved else 'NO'}")
            print(f"   Extracted Units Count: {len(r_units)}, Composed Facts Count: {len(composed) if r_units else 0}")
            if target_retrieved:
                print(f"   Failure Cause: Composition failure (Syntactic pattern gap or predicate alignment across sessions)")
            else:
                print(f"   Failure Cause: Candidate retrieval failure (One or more target sessions missing from top-k pool)")


if __name__ == "__main__":
    asyncio.run(main())
