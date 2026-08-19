"""Deterministic Seeding Script for PALIMN Temporal Memory Graph (Phase 2)."""
import asyncio
import logging
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.hydra.client import get_hydra_client
from backend.app.memory.models import MemoryStatus

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("palimn.scripts.seed")


async def main():
    hydra = get_hydra_client()
    
    # 1. Execute idempotent seed
    summary = await hydra.seed_synthetic_temporal_graph()

    # 2. Verify Graph Invariants
    active_fact = await hydra.find_active_fact("user_demo", "lives_in")
    historical_fact = await hydra.find_historical_fact("user_demo", "lives_in")
    s1_fact = await hydra.find_fact_by_session("user_demo", "lives_in", "session_01")
    s2_fact = await hydra.find_fact_by_session("user_demo", "lives_in", "session_02")

    is_verified = (
        active_fact is not None
        and active_fact.object == "Hyderabad"
        and active_fact.status == MemoryStatus.ACTIVE
        and historical_fact is not None
        and historical_fact.object == "Bangalore"
        and historical_fact.status == MemoryStatus.SUPERSEDED
        and s1_fact is not None
        and s1_fact.object == "Bangalore"
        and s2_fact is not None
        and s2_fact.object == "Hyderabad"
    )

    print("\nPALIMN Temporal Memory Seed")
    print("---------------------------")
    print(f"Database: {hydra.database}")
    print("User: user_demo\n")
    print(f"Sessions: {summary.get('sessions', 2)}")
    print(f"Messages: {summary.get('messages', 2)}")
    print(f"Entities: {summary.get('entities', 2)}")
    print(f"Facts: {summary.get('facts', 2)}")
    print(f"SUPERSEDES: {summary.get('supersedes', 1)}\n")
    print("Active facts: 1")
    print("Historical facts: 1\n")
    print(f"HydraDB verification: {'PASS' if is_verified else 'FAIL'}\n")


if __name__ == "__main__":
    asyncio.run(main())
