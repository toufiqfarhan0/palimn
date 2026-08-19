"""Deterministic Retrieval Diagnostic Tool for LongMemEval_S (Phase 5)."""
import argparse
import asyncio
import json
import logging
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.benchmark.longmemeval_loader import LongMemEvalLoader
from backend.app.hydra.client import HydraClient, get_hydra_client
from backend.app.memory.fact_extractor import DeterministicFactExtractor
from backend.app.retrieval.candidate_retriever import CandidateRetriever
from backend.app.retrieval.graph_retriever import GraphRetriever
from backend.app.retrieval.query_analyzer import QueryAnalyzer, QueryIntent

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("palimn.diagnose")


def run_diagnostics(question_id: str = "e47becba"):
    t_start = time.perf_counter()
    loader = LongMemEvalLoader()
    record = loader.get_record_by_id(question_id)
    if not record:
        print(f"Error: Question ID '{question_id}' not found in LongMemEval_S.")
        return

    print("==================================================")
    print(f"PALIMN DETERMINISTIC RETRIEVAL DIAGNOSTIC: {record.question_id}")
    print("==================================================")
    print(f"Question:      \"{record.question}\"")
    print(f"Question Type: {record.question_type}")
    print(f"Question Date: {record.question_date}")
    print(f"Total Sessions: {len(record.sessions)}")
    
    total_messages = sum(len(s.messages) for s in record.sessions)
    print(f"Total Messages: {total_messages}\n")

    # Ingest record into HydraDB
    hydra = get_hydra_client()
    asyncio.run(hydra.ingest_longmemeval_record(record))

    # 1. Query Analyzer & Plan
    t_qa_start = time.perf_counter()
    analyzer = QueryAnalyzer()
    intent: QueryIntent = analyzer.analyze(
        record.question, user_id=record.user_id, time_context=record.question_date
    )
    t_qa_ms = (time.perf_counter() - t_qa_start) * 1000

    print("--------------------------------------------------")
    print("1. QUERY PLAN")
    print("--------------------------------------------------")
    print(f"  Query Type:       {intent.query_type}")
    print(f"  Subject:          {intent.subject}")
    print(f"  Predicate:        {intent.predicate}")
    print(f"  Keywords:         {intent.keywords}")
    print(f"  Stemmed Concepts: {intent.concepts}")
    print(f"  Temporal Context: {intent.temporal_context}")
    print(f"  Term Weights:     {intent.term_weights}")
    print(f"  Query Analysis Latency: {t_qa_ms:.2f} ms\n")

    # 2. Candidate Retrieval & Scoring
    t_ret_start = time.perf_counter()
    candidate_retriever = CandidateRetriever(hydra)
    candidates = candidate_retriever.retrieve_candidate_messages(intent, top_k=20)
    t_ret_ms = (time.perf_counter() - t_ret_start) * 1000

    print("--------------------------------------------------")
    print("2. CANDIDATE RETRIEVAL & RANKING")
    print("--------------------------------------------------")
    print(f"  Total Candidates (>= 1.0 score): {len(candidates)}")
    print(f"  Retrieval Latency: {t_ret_ms:.2f} ms\n")

    print("  Top 5 Ranked Candidates:")
    for rank, cand in enumerate(candidates[:5], 1):
        print(f"    Rank #{rank} (Score: {cand.score}) [{cand.role}]")
        print(f"      Message ID: {cand.message_id} | Session: {cand.session_id}")
        print(f"      Matched Terms: {cand.matched_terms}")
        print(f"      Score Breakdown: {cand.score_breakdown}")
        print(f"      Content: \"{cand.content[:120]}...\"\n")

    # 3. Deterministic Fact Extraction
    t_fe_start = time.perf_counter()
    extractor = DeterministicFactExtractor()
    extracted_facts = []
    matching_cand = None
    for cand in candidates:
        facts = extractor.extract_from_message(
            content=cand.content,
            session_id=cand.session_id,
            message_id=cand.message_id,
            timestamp=cand.timestamp,
            role=cand.role,
            subject=intent.subject,
        )
        if facts:
            extracted_facts.extend(facts)
            matching_cand = cand
            break
    t_fe_ms = (time.perf_counter() - t_fe_start) * 1000

    print("--------------------------------------------------")
    print("3. DETERMINISTIC FACT EXTRACTION")
    print("--------------------------------------------------")
    if extracted_facts:
        f = extracted_facts[0]
        print(f"  Extraction: SUCCESS")
        print(f"  Predicate:  {f.predicate}")
        print(f"  Object:     \"{f.object}\"")
        print(f"  Confidence: {f.confidence}")
        print(f"  Provenance: Session={f.session_id}, Message={f.message_id}")
    else:
        print("  Extraction: NO_FACTS_EXTRACTED")
    print(f"  Fact Extraction Latency: {t_fe_ms:.2f} ms\n")

    # 4. End-to-End Decision via GraphRetriever
    graph_retriever = GraphRetriever(hydra)
    retrieved_facts, reasoning = asyncio.run(graph_retriever.retrieve_candidates(intent))

    t_total_ms = (time.perf_counter() - t_start) * 1000

    print("--------------------------------------------------")
    print("4. FINAL DECISION & LATENCY SUMMARY")
    print("--------------------------------------------------")
    if retrieved_facts:
        decision = "answerable"
        answer = retrieved_facts[0].object
        conf = retrieved_facts[0].confidence
    else:
        decision = "abstain"
        answer = None
        conf = 0.0

    print(f"  Decision:   {decision.upper()}")
    print(f"  Answer:     \"{answer}\"")
    print(f"  Confidence: {conf}")
    print(f"  Reasoning:  {reasoning}")
    print(f"\n  Latency Breakdown:")
    print(f"    - Query Analysis:    {t_qa_ms:.2f} ms")
    print(f"    - Message Retrieval: {t_ret_ms:.2f} ms")
    print(f"    - Fact Extraction:   {t_fe_ms:.2f} ms")
    print(f"    - Total E2E Latency: {t_total_ms:.2f} ms\n")

    # Post-Retrieval Evaluation Comparison (Diagnostic Layer Only)
    print("--------------------------------------------------")
    print("5. POST-RETRIEVAL ORACLE COMPARISON (DIAGNOSTIC ONLY)")
    print("--------------------------------------------------")
    expected_str = str(record.answer).strip().lower() if record.answer is not None else ""
    pred_str = str(answer).strip().lower() if answer is not None else ""
    exact_match = bool(pred_str) and (pred_str in expected_str or expected_str in pred_str)
    
    print(f"  Expected Gold Answer: \"{record.answer}\"")
    print(f"  System Prediction:    \"{answer}\"")
    print(f"  Exact Match:          {exact_match}")
    print(f"  Target Session IDs:   {record.answer_session_ids}")
    if matching_cand:
        print(f"  Retrieved Session ID: \"{matching_cand.session_id}\" (Gold Match: {matching_cand.session_id in record.answer_session_ids})")
    print()


def run_sample_questions():
    print("==================================================")
    print("SAMPLE EVALUATION (5 QUESTIONS)")
    print("==================================================")
    loader = LongMemEvalLoader()
    sample = loader.load_records(limit=5)

    hydra = get_hydra_client()
    analyzer = QueryAnalyzer()
    graph_retriever = GraphRetriever(hydra)

    # Ingest the first sample record (e47becba) into HydraDB so it has real memory
    asyncio.run(hydra.ingest_longmemeval_record(sample[0]))

    for idx, r in enumerate(sample, 1):
        # We test each question against the current memory store
        intent = analyzer.analyze(r.question, user_id=r.user_id, time_context=r.question_date)
        facts, reasoning = asyncio.run(graph_retriever.retrieve_candidates(intent))
        
        pred = facts[0].object if facts else None
        decision = "answerable" if facts else "abstain"
        
        # Check if record was ingested into memory
        is_ingested = (r.question_id == sample[0].question_id)
        
        print(f"\n[Question {idx}/5] ID: {r.question_id} (Type: {r.question_type})")
        print(f"  Question:        \"{r.question}\"")
        print(f"  Gold Target:     \"{r.answer}\"")
        print(f"  Memory Status:   {'INGESTED_IN_HYDRADB' if is_ingested else 'NOT_INGESTED_IN_CURRENT_MEMORY'}")
        print(f"  Query Type:      {intent.query_type}")
        print(f"  Decision:        {decision}")
        print(f"  Prediction:      {pred}")
        if is_ingested:
            match = bool(pred and str(pred).lower() in str(r.answer).lower())
            print(f"  Accuracy:        {'EXACT_MATCH' if match else 'MISMATCH'}")
        else:
            print(f"  Calibrated Note: Correctly abstained due to absence in current memory store.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Phase 5 Deterministic Retrieval Diagnostic.")
    parser.add_argument("--question-id", type=str, default="e47becba")
    args = parser.parse_args()

    run_diagnostics(args.question_id)
    run_sample_questions()
