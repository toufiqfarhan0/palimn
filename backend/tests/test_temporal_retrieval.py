"""Tests for Phase 2 Temporal Retrieval Matrix, Provenance, and Abstention."""
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.mark.asyncio
async def test_matrix_1_current_state():
    """TEST 1: 'Where do I live now?' -> Expected: Hyderabad, Decision: answerable"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/chat", json={"question": "Where do I live now?"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["decision"] == "answerable"
        assert data["answer"] == "Hyderabad"
        assert data["confidence"] == 1.0
        assert len(data["evidence"]) >= 1
        assert data["evidence"][0]["status"] == "active"
        assert data["evidence"][0]["session_id"] == "session_02"


@pytest.mark.asyncio
async def test_matrix_2_historical_state():
    """TEST 2: 'Where did I live before Hyderabad?' -> Expected: Bangalore, Decision: answerable"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/chat", json={"question": "Where did I live before Hyderabad?"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["decision"] == "answerable"
        assert data["answer"] == "Bangalore"
        assert data["confidence"] == 1.0
        assert len(data["evidence"]) >= 1
        assert data["evidence"][0]["status"] == "superseded"
        assert data["evidence"][0]["session_id"] == "session_01"


@pytest.mark.asyncio
async def test_matrix_3_session_01():
    """TEST 3: 'Where did I live in Session 01?' -> Expected: Bangalore, Decision: answerable"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/chat", json={"question": "Where did I live in Session 01?"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["decision"] == "answerable"
        assert data["answer"] == "Bangalore"
        assert data["confidence"] == 1.0
        assert data["evidence"][0]["session_id"] == "session_01"


@pytest.mark.asyncio
async def test_matrix_4_session_02():
    """TEST 4: 'Where did I live in Session 02?' -> Expected: Hyderabad, Decision: answerable"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/chat", json={"question": "Where did I live in Session 02?"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["decision"] == "answerable"
        assert data["answer"] == "Hyderabad"
        assert data["confidence"] == 1.0
        assert data["evidence"][0]["session_id"] == "session_02"


@pytest.mark.asyncio
async def test_matrix_5_missing_session_abstention():
    """TEST 5: 'Where did I live in Session 99?' -> Expected: no answer, Decision: abstain, Reason: no_matching_memory"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/chat", json={"question": "Where did I live in Session 99?"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["decision"] == "abstain"
        assert data["reason"] == "no_matching_memory"
        assert data["answer"] is None
        assert data["confidence"] == 0.0
        assert data["evidence"] == []


@pytest.mark.asyncio
async def test_matrix_6_currently_live_in():
    """TEST 6: 'What city do I currently live in?' -> Expected: Hyderabad, Decision: answerable"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/chat", json={"question": "What city do I currently live in?"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["decision"] == "answerable"
        assert data["answer"] == "Hyderabad"
        assert data["confidence"] == 1.0


@pytest.mark.asyncio
async def test_matrix_7_previously_live_in():
    """TEST 7: 'What city did I previously live in?' -> Expected: Bangalore, Decision: answerable"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/chat", json={"question": "What city did I previously live in?"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["decision"] == "answerable"
        assert data["answer"] == "Bangalore"
        assert data["confidence"] == 1.0


@pytest.mark.asyncio
async def test_missing_topic_abstention():
    """Test abstention on completely unmentioned topic."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/chat", json={"question": "What is my favorite spaceship?"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["decision"] == "abstain"
        assert data["reason"] == "no_matching_memory"
        assert data["answer"] is None
        assert data["confidence"] == 0.0


@pytest.mark.asyncio
async def test_provenance_structure():
    """Verify detailed provenance properties in retrieved evidence."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/chat", json={"question": "Where do I live now?"})
        data = resp.json()
        evidence = data["evidence"][0]
        assert "memory_id" in evidence
        assert "session_id" in evidence
        assert "message_id" in evidence
        assert "status" in evidence
        assert "confidence" in evidence
        assert evidence["memory_id"] == "fact_002"
        assert evidence["message_id"] == "msg_02"
        assert evidence["session_id"] == "session_02"
