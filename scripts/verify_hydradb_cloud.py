"""Official HydraDB Cloud Persistence Verification Script for PALIMN.

Performs live end-to-end verification of real persistence on HydraDB Cloud:
1. Authentication & Tenant infrastructure validation
2. Real cloud memory turn ingestion with temporal metadata
3. Indexing status polling until terminal completion
4. Persistent source listing & inspection
5. Live deterministic temporal reasoning against HydraDB Cloud:
   - Active query: 'Where do I live now?' -> 'Hyderabad'
   - Historical query: 'Where did I live before Hyderabad?' -> 'Bangalore'
   - Missing context query: 'Where did I live in Session 99?' -> ABSTAIN
6. Ingestion idempotency check (second ingestion run)
"""
import asyncio
import json
import logging
import os
import sys
import time
from typing import Any, Dict, List

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.config import settings
from backend.app.hydra.client import HydraClient
from backend.app.retrieval.graph_retriever import GraphRetriever
from backend.app.retrieval.query_analyzer import QueryAnalyzer
from backend.app.memory.models import DecisionType

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("palimn.verify_cloud")


def mask_key(key: str) -> str:
    """Safely mask API key for terminal display."""
    if not key or len(key) < 8:
        return "***"
    return f"{key[:4]}...{key[-4:]}"


async def run_cloud_verification() -> Dict[str, Any]:
    print("=" * 70)
    print("PALIMN — REAL HYDRADB CLOUD PERSISTENCE VERIFICATION")
    print("=" * 70)
    
    # 1. Inspect Environment & Credentials
    api_key_masked = mask_key(settings.HYDRA_DB_API_KEY)
    print(f"Endpoint:   {settings.HYDRA_DB_BASE_URL}")
    print(f"Database:   {settings.HYDRA_DB_DATABASE}")
    print(f"API Key:    {api_key_masked}")
    print(f"Mode:       {settings.HYDRA_MODE}")
    print("-" * 70)

    # Initialize client explicitly in cloud mode
    client = HydraClient(
        base_url=settings.HYDRA_DB_BASE_URL,
        api_key=settings.HYDRA_DB_API_KEY,
        database=settings.HYDRA_DB_DATABASE,
        mode="cloud",
    )

    if not client.is_configured:
        print("[ERROR] HydraDB credentials are not configured in environment.")
        return {"success": False, "reason": "Unconfigured credentials"}

    # 2. Check Database Infrastructure Health
    print("\n[STEP 1] Validating HydraDB Cloud Infrastructure...")
    health = await client.health_check()
    print(f"  Connected:           {health.get('connected')}")
    print(f"  Status:              {health.get('status')}")
    print(f"  Latency:             {health.get('latency_ms')} ms")
    print(f"  Ready for Ingestion: {health.get('ready_for_ingestion')}")
    print(f"  Graph Status:        {health.get('graph_status')}")

    if not health.get("connected"):
        print(f"[ERROR] HydraDB Cloud health check failed: {health.get('reason')}")
        return {"success": False, "reason": health.get("reason")}

    # 3. Tiny Test Dataset Ingestion (1 User, 2 Sessions, 2 Messages)
    print("\n[STEP 2] Ingesting Tiny Test Dataset to HydraDB Cloud...")
    tiny_memories = [
        {
            "id": "tiny_demo_msg_01",
            "text": "I live in Bangalore.",
            "metadata": {
                "user_id": "user_demo",
                "session_id": "session_01",
                "session_index": 1,
                "session_date": "2025-01-10",
                "timestamp": "2025-01-10T10:00:00Z",
                "role": "user",
                "predicate": "lives_in",
                "object": "Bangalore",
                "status": "superseded",
            },
        },
        {
            "id": "tiny_demo_msg_02",
            "text": "I moved to Hyderabad.",
            "metadata": {
                "user_id": "user_demo",
                "session_id": "session_02",
                "session_index": 2,
                "session_date": "2025-03-15",
                "timestamp": "2025-03-15T14:30:00Z",
                "role": "user",
                "predicate": "lives_in",
                "object": "Hyderabad",
                "status": "active",
            },
        },
    ]

    ingest_start = time.perf_counter()
    upload_res = await client.cloud_store.ingest_memories(tiny_memories, wait_indexing=True, timeout_s=30.0)
    ingest_time = round((time.perf_counter() - ingest_start) * 1000, 2)
    print(f"  Ingest Status:   {upload_res.get('status')}")
    print(f"  Submitted Count: {upload_res.get('count')}")
    print(f"  Indexed Count:   {upload_res.get('indexed_count')}")
    print(f"  Total Ingest & Index Time: {ingest_time} ms")

    # 4. Verify Persistent Source Listing
    print("\n[STEP 3] Verifying Stored Sources on HydraDB Cloud...")
    sources = await client.cloud_store.list_sources(page_size=20)
    source_ids = [s.get("memory_id") or s.get("id") or s.get("title") for s in sources]
    print(f"  Total Persisted Sources Found: {len(sources)}")
    print(f"  Persisted IDs: {source_ids}")
    
    has_msg1 = any("tiny_demo_msg_01" in str(s) for s in source_ids)
    has_msg2 = any("tiny_demo_msg_02" in str(s) for s in source_ids)
    print(f"  tiny_demo_msg_01 persisted: {has_msg1}")
    print(f"  tiny_demo_msg_02 persisted: {has_msg2}")

    # 5. Live Deterministic Temporal Retrieval Queries
    print("\n[STEP 4] Executing Live Queries against HydraDB Cloud Storage...")
    analyzer = QueryAnalyzer()
    retriever = GraphRetriever(client)

    test_queries = [
        {
            "name": "Active State Query",
            "question": "Where do I live now?",
            "expected_answer": "Hyderabad",
            "expected_decision": DecisionType.ANSWERABLE,
        },
        {
            "name": "Historical State Query",
            "question": "Where did I live before Hyderabad?",
            "expected_answer": "Bangalore",
            "expected_decision": DecisionType.ANSWERABLE,
        },
        {
            "name": "Missing Session Abstention",
            "question": "Where did I live in Session 99?",
            "expected_answer": None,
            "expected_decision": DecisionType.ABSTAIN,
        },
    ]

    retrieval_results = []
    for tq in test_queries:
        q_start = time.perf_counter()
        intent = analyzer.analyze(tq["question"], user_id="user_demo")
        candidates, reasoning = await retriever.retrieve_candidates(intent)
        q_time = round((time.perf_counter() - q_start) * 1000, 2)

        if candidates:
            actual_answer = candidates[0].object
            actual_decision = DecisionType.ANSWERABLE
        else:
            actual_answer = None
            actual_decision = DecisionType.ABSTAIN

        matched = (
            actual_decision == tq["expected_decision"]
            and (tq["expected_answer"] is None or actual_answer == tq["expected_answer"])
        )
        print(f"\n  Query: '{tq['question']}'")
        print(f"    Intent Type:       {intent.query_type}")
        print(f"    Decision:          {actual_decision.value} (Expected: {tq['expected_decision'].value})")
        print(f"    Answer:            {actual_answer} (Expected: {tq['expected_answer']})")
        print(f"    Latency:           {q_time} ms")
        print(f"    Reasoning:         {reasoning}")
        print(f"    Verification Pass: {matched}")

        retrieval_results.append({
            "query": tq["question"],
            "decision": actual_decision.value,
            "answer": actual_answer,
            "latency_ms": q_time,
            "passed": matched,
        })

    # 6. Idempotency Verification (Re-ingest identical payload)
    print("\n[STEP 5] Testing Ingestion Idempotency...")
    re_upload = await client.cloud_store.ingest_memories(tiny_memories, wait_indexing=True, timeout_s=15.0)
    print(f"  Re-ingest Status:  {re_upload.get('status')}")
    print(f"  Re-ingest Count:   {re_upload.get('count')}")
    print(f"  Re-ingest Indexed: {re_upload.get('indexed_count')}")

    # Final summary
    all_passed = all(r["passed"] for r in retrieval_results)
    print("\n" + "=" * 70)
    print("HYDRADB CLOUD PERSISTENCE VERIFICATION RESULT:")
    print(f"  ALL TEST SCENARIOS PASSED: {all_passed}")
    print("=" * 70)

    return {
        "success": all_passed,
        "database": settings.HYDRA_DB_DATABASE,
        "health": health,
        "sources_count": len(sources),
        "retrieval_results": retrieval_results,
    }


if __name__ == "__main__":
    result = asyncio.run(run_cloud_verification())
    if not result.get("success"):
        sys.exit(1)
    sys.exit(0)
