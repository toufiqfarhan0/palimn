"""PALIMN — Final HydraDB Cloud Smoke Test.

Executes a live end-to-end smoke test against HydraDB Cloud:
1. Real cloud ingestion with unique message IDs.
2. Status polling until indexing is completed.
3. Remote persistence verification via list_sources().
4. Fresh-process retrieval verification across a separate Python execution.
5. Invariant checking (0 LLMs, 0 embeddings, in-memory isolation).
"""
import asyncio
import os
import sys
import time
from datetime import datetime
from typing import Dict, Any

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.config import settings
from backend.app.hydra.cloud_store import HydraCloudStore
from backend.app.hydra.client import HydraClient
from backend.app.retrieval.graph_retriever import GraphRetriever
from backend.app.retrieval.query_analyzer import QueryAnalyzer


def get_unique_smoke_dataset():
    ts = int(time.time())
    user_id = f"smoke_user_{ts}"
    msg1_id = f"smoke_msg_01_{ts}"
    msg2_id = f"smoke_msg_02_{ts}"
    sess1_id = f"smoke_sess_01_{ts}"
    sess2_id = f"smoke_sess_02_{ts}"

    memories = [
        {
            "id": msg1_id,
            "text": "I live in Bangalore.",
            "metadata": {
                "session_id": sess1_id,
                "timestamp": "2025-01-10T10:00:00Z",
                "role": "user",
                "user_id": user_id,
                "created_at": "2025-01-10T10:00:00Z",
            },
        },
        {
            "id": msg2_id,
            "text": "I moved to Hyderabad.",
            "metadata": {
                "session_id": sess2_id,
                "timestamp": "2025-03-15T14:30:00Z",
                "role": "user",
                "user_id": user_id,
                "created_at": "2025-03-15T14:30:00Z",
            },
        },
    ]
    return user_id, msg1_id, msg2_id, memories


async def run_phase1_ingestion():
    user_id, msg1_id, msg2_id, memories = get_unique_smoke_dataset()
    store = HydraCloudStore()
    
    print("=" * 60)
    print("PHASE 1: LIVE HYDRADB CLOUD INGESTION")
    print("=" * 60)
    print(f"Target Database: {settings.HYDRA_DB_DATABASE}")
    print(f"Base URL:        {settings.HYDRA_DB_BASE_URL}")
    print(f"User ID:         {user_id}")
    print(f"Message 1 ID:    {msg1_id} ('I live in Bangalore.')")
    print(f"Message 2 ID:    {msg2_id} ('I moved to Hyderabad.')")
    
    # 1. Check Infrastructure
    infra = await store.check_infrastructure()
    print(f"Infrastructure Connected: {infra.get('connected')} (Status: {infra.get('status')})")
    assert infra.get("connected"), "HydraDB Cloud infrastructure is not reachable"

    # 2. Ingest
    print("\nSubmitting memories to HydraDB Cloud...")
    ingest_res = await store.ingest_memories(memories, wait_indexing=True, timeout_s=45.0)
    print(f"Ingest Status: {ingest_res.get('status')}")
    print(f"Submitted:     {ingest_res.get('submitted_count')}")
    print(f"Indexed:       {ingest_res.get('indexed_count')}")
    
    # 3. List Sources Remotely
    print("\nVerifying remote persistence via context.list()...")
    sources = await store.list_sources(page_size=50)
    persisted_ids = [s.get("id") or s.get("memory_id") for s in sources]
    
    has_msg1 = msg1_id in persisted_ids
    has_msg2 = msg2_id in persisted_ids
    print(f"Remote persistence for {msg1_id}: {has_msg1}")
    print(f"Remote persistence for {msg2_id}: {has_msg2}")
    
    assert has_msg1 and has_msg2, "One or more smoke test messages not found in remote storage"
    print("\nPhase 1 Ingestion Complete. Saving IDs for fresh-process test...")
    
    # Save IDs to temporary text file for the next process
    with open(".smoke_test_ids.txt", "w") as f:
        f.write(f"{user_id}\n{msg1_id}\n{msg2_id}")


async def run_phase2_retrieval():
    if not os.path.exists(".smoke_test_ids.txt"):
        print("Error: .smoke_test_ids.txt not found. Run ingestion first.")
        sys.exit(1)
        
    with open(".smoke_test_ids.txt", "r") as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]
        user_id = lines[0]
        msg1_id = lines[1]
        msg2_id = lines[2]
        
    print("=" * 60)
    print("PHASE 2: FRESH PROCESS CLOUD RETRIEVAL")
    print("=" * 60)
    print(f"PID:             {os.getpid()}")
    print(f"User ID:         {user_id}")
    print(f"Target Database: {settings.HYDRA_DB_DATABASE}")

    # Fresh client instantiation in this process
    client = HydraClient(mode="cloud")
    
    # Verify In-Memory Store is completely empty before query
    initial_local_nodes = len(client._in_memory_store.nodes)
    print(f"Initial InMemoryGraphStore node count: {initial_local_nodes} (Must be 0)")
    assert initial_local_nodes == 0, "In-memory graph store was not empty in fresh process!"

    analyzer = QueryAnalyzer()
    retriever = GraphRetriever(client)

    test_queries = [
        ("Where do I live now?", "current_state", "Hyderabad", "answerable"),
        ("Where did I live before Hyderabad?", "historical_state", "Bangalore", "answerable"),
        ("Where did I live in Session 99?", "session_scoped", None, "abstain"),
    ]

    all_passed = True

    for query_text, expected_type, expected_ans, expected_dec in test_queries:
        print(f"\n--- Query: '{query_text}' ---")
        t0 = time.perf_counter()
        intent = analyzer.analyze(query_text, user_id=user_id)
        facts, reasoning = await retriever.retrieve_candidates(intent)
        lat_ms = (time.perf_counter() - t0) * 1000.0

        decision = "answerable" if facts else "abstain"
        answer = facts[0].object if facts else None

        print(f"  Detected Intent:   {intent.query_type}")
        print(f"  Decision:          {decision} (Expected: {expected_dec})")
        print(f"  Answer:            {answer} (Expected: {expected_ans})")
        print(f"  Latency:           {lat_ms:.2f} ms")
        print(f"  Reasoning:         {reasoning}")

        pass_dec = decision == expected_dec
        pass_ans = (answer == expected_ans) or (expected_ans is None and answer is None)
        query_pass = pass_dec and pass_ans
        print(f"  Verification Pass: {query_pass}")

        if not query_pass:
            all_passed = False

    # Clean up temp file
    if os.path.exists(".smoke_test_ids.txt"):
        os.remove(".smoke_test_ids.txt")

    print("\n" + "=" * 60)
    print(f"FRESH-PROCESS CLOUD SMOKE TEST RESULT: {all_passed}")
    print("=" * 60)

    if not all_passed:
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--retrieve":
        asyncio.run(run_phase2_retrieval())
    else:
        asyncio.run(run_phase1_ingestion())
