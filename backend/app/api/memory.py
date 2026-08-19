"""Memory ingestion and retrieval endpoints for PALIMN."""
import time
from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.app.hydra.client import HydraClient, get_hydra_client
from backend.app.memory.models import (
    Fact,
    IngestSessionRequest,
    IngestSessionResponse,
    StructuredIngestRequest,
    FactInput,
    MemoryStatus,
)

router = APIRouter(prefix="/memory", tags=["Memory"])


@router.post("/ingest", response_model=IngestSessionResponse)
async def ingest_memory(
    req: Union[StructuredIngestRequest, IngestSessionRequest],
    hydra: HydraClient = Depends(get_hydra_client),
) -> IngestSessionResponse:
    """Ingest structured session memory with deterministic entity, fact, and SUPERSEDES resolution."""
    start_time = time.perf_counter()

    # Convert IngestSessionRequest to StructuredIngestRequest if needed
    if isinstance(req, IngestSessionRequest):
        facts = req.facts or []
        first_msg = req.messages[0] if req.messages else None
        struct_req = StructuredIngestRequest(
            user_id=req.user_id,
            session_id=req.session_id,
            session_date=req.session_date or req.timestamp or "2025-01-10",
            message_id=first_msg.message_id if first_msg else f"msg_{req.session_id}",
            content=first_msg.content if first_msg else "Session turn",
            facts=facts,
        )
    else:
        struct_req = req

    result = await hydra.ingest_structured_memory(struct_req)
    latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return IngestSessionResponse(
        session_id=struct_req.session_id,
        facts_extracted=result.get("facts_extracted", len(struct_req.facts)),
        entities_extracted=result.get("entities_extracted", len(struct_req.facts)),
        revisions_detected=result.get("revisions_detected", 0),
        status="success",
        latency_ms=latency_ms,
    )


@router.get("/search", response_model=List[Fact])
async def search_memories(
    query: Optional[str] = Query(None, description="Search term or fact text"),
    entity: Optional[str] = Query(None, description="Filter by entity name"),
    status: Optional[MemoryStatus] = Query(None, description="Filter by memory status"),
    limit: int = Query(20, ge=1, le=100),
    hydra: HydraClient = Depends(get_hydra_client),
) -> List[Fact]:
    """Search and filter memories across time and status."""
    return await hydra.search_memories(
        query=query,
        entity=entity,
        status=status.value if status else None,
        limit=limit,
    )


@router.get("/{memory_id}", response_model=Fact)
async def get_memory_by_id(
    memory_id: str,
    hydra: HydraClient = Depends(get_hydra_client),
) -> Fact:
    """Retrieve specific fact memory by its ID with full temporal and revision metadata."""
    fact = await hydra.get_memory_by_id(memory_id)
    if not fact:
        raise HTTPException(status_code=404, detail=f"Memory '{memory_id}' not found in temporal graph.")
    return fact
