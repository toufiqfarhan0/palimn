"""End-to-end Verification Script for Phase 2."""
import asyncio
import sys
from pathlib import Path
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from backend.app.main import app


async def verify():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://localhost:8000") as client:
        # 1. Health
        r_health = await client.get("/api/health")
        print("GET /api/health:", r_health.status_code, r_health.json()["status"])
        assert r_health.status_code == 200

        # 2. Graph Snapshot
        r_graph = await client.get("/api/graph")
        print("GET /api/graph: Nodes =", len(r_graph.json()["nodes"]), "Edges =", len(r_graph.json()["edges"]))
        assert r_graph.json()["total_nodes"] >= 9

        # 3. Test Matrix
        queries = [
            ("Where do I live now?", "Hyderabad", "answerable"),
            ("Where did I live before Hyderabad?", "Bangalore", "answerable"),
            ("Where did I live in Session 01?", "Bangalore", "answerable"),
            ("Where did I live in Session 02?", "Hyderabad", "answerable"),
            ("Where did I live in Session 99?", None, "abstain"),
            ("What city do I currently live in?", "Hyderabad", "answerable"),
            ("What city did I previously live in?", "Bangalore", "answerable"),
        ]

        for q, expected_ans, expected_dec in queries:
            r = await client.post("/api/chat", json={"question": q})
            data = r.json()
            print(f"Query: '{q}' -> Decision: {data['decision']}, Answer: {data['answer']}")
            assert data["decision"] == expected_dec
            assert data["answer"] == expected_ans

        print("\nAll Phase 2 endpoints and queries successfully verified!")


if __name__ == "__main__":
    asyncio.run(verify())
