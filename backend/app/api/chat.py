"""Chat and Temporal Query API for PALIMN."""
import time
from fastapi import APIRouter, Depends, HTTPException
from backend.app.hydra.client import HydraClient, get_hydra_client
from backend.app.memory.models import (
    ChatQueryRequest,
    ChatQueryResponse,
    DecisionType,
    AbstainReason,
)
from backend.app.retrieval.query_analyzer import QueryAnalyzer
from backend.app.retrieval.graph_retriever import GraphRetriever
from backend.app.retrieval.evidence import EvidenceAggregator

router = APIRouter(tags=["Chat"])

analyzer = QueryAnalyzer()
evidence_agg = EvidenceAggregator()


@router.post("/chat", response_model=ChatQueryResponse)
async def query_chat(
    req: ChatQueryRequest,
    hydra: HydraClient = Depends(get_hydra_client),
) -> ChatQueryResponse:
    """Process a user question against the temporal memory graph.
    
    Returns deterministic answer or first-class structured abstention with complete evidence provenance.
    """
    start_time = time.perf_counter()

    if not req.question.strip():
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return ChatQueryResponse(
            question=req.question,
            decision=DecisionType.ABSTAIN,
            reason=AbstainReason.NO_MATCHING_MEMORY.value,
            answer=None,
            confidence=0.0,
            evidence=[],
            temporal_reasoning="Empty question provided.",
            latency_ms=latency_ms,
        )

    # 1. Analyze query intent
    intent = analyzer.analyze(
        req.question,
        user_id=req.user_id or "user_demo",
        time_context=req.time_context,
    )

    # 2. Retrieve candidates via Graph Traversal
    retriever = GraphRetriever(hydra)
    candidates, reasoning = await retriever.retrieve_candidates(intent)

    latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

    # 3. Formulate Answer or Abstain
    if candidates:
        primary_fact = candidates[0]
        evidence_items = evidence_agg.bundle_evidence(candidates)
        return ChatQueryResponse(
            question=req.question,
            decision=DecisionType.ANSWERABLE,
            reason=None,
            answer=primary_fact.object,
            confidence=primary_fact.confidence,
            evidence=evidence_items,
            temporal_reasoning=reasoning,
            latency_ms=latency_ms,
        )

    # Abstention when no fact satisfies query intent
    return ChatQueryResponse(
        question=req.question,
        decision=DecisionType.ABSTAIN,
        reason=AbstainReason.NO_MATCHING_MEMORY.value,
        answer=None,
        confidence=0.0,
        evidence=[],
        temporal_reasoning=reasoning or "No matching memory found in temporal graph.",
        latency_ms=latency_ms,
    )
