"""Chat and Temporal Query API for PALIMN."""
import time
from fastapi import APIRouter, Depends, HTTPException
from backend.app.hydra.client import HydraClient, get_hydra_client
from backend.app.memory.models import (
    ChatQueryRequest,
    ChatQueryResponse,
    DecisionType,
    AbstainReason,
    EvidenceItem,
    MemoryStatus,
)

router = APIRouter(tags=["Chat"])


@router.post("/chat", response_model=ChatQueryResponse)
async def query_chat(
    req: ChatQueryRequest,
    hydra: HydraClient = Depends(get_hydra_client),
) -> ChatQueryResponse:
    """Process a user question against the temporal memory graph.
    
    Returns answer or first-class structured abstention with complete evidence provenance.
    """
    start_time = time.perf_counter()

    # Note: Full retrieval engine integrated in Phase 6-8.
    # Stub response returns clean structured response demonstrating abstention & answering contracts.
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

    # If Hydra is not configured, inform through abstention reason
    if not hydra.is_configured:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return ChatQueryResponse(
            question=req.question,
            decision=DecisionType.ABSTAIN,
            reason="hydradb_unconfigured",
            answer=None,
            confidence=0.0,
            evidence=[],
            temporal_reasoning="HydraDB Cloud credentials not configured. Please configure .env with HYDRA_DB_BASE_URL and HYDRA_DB_API_KEY.",
            latency_ms=latency_ms,
        )

    latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
    return ChatQueryResponse(
        question=req.question,
        decision=DecisionType.ABSTAIN,
        reason=AbstainReason.NO_MATCHING_MEMORY.value,
        answer=None,
        confidence=0.0,
        evidence=[],
        temporal_reasoning="No relevant memories found in current temporal graph.",
        latency_ms=latency_ms,
    )
