"""Memory ingestion and retrieval endpoints for PALIMN."""
import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.app.hydra.client import HydraClient, get_hydra_client
from backend.app.memory.models import (
    Fact,
    IngestSessionRequest,
    IngestSessionResponse,
    MemoryStatus,
)

router = APIRouter(prefix="/memory", tags=["Memory"])


@router.post("/ingest", response_model=IngestSessionResponse)
async def ingest_session(
    req: IngestSessionRequest,
    hydra: HydraClient = Depends(get_hydra_client),
) -> IngestSessionResponse:
    """Ingest a multi-turn conversation session, extracting entities, facts, and temporal relations."""
    start_time = time.perf_counter()
    
    # Core extraction & HydraDB write will be connected in Phase 3-5
    latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
    return IngestSessionResponse(
        session_id=req.session_id,
        facts_extracted=0,
        entities_extracted=0,
        revisions_detected=0,
        status="ready" if hydra.is_configured else "unconfigured",
        latency_ms=latency_ms,
    )


@router.get("/{memory_id}", response_model=Fact)
async def get_memory_by_id(
    memory_id: str,
    hydra: HydraClient = Depends(get_hydra_client),
) -> Fact:
    """Retrieve specific fact memory by its ID with full temporal and revision metadata."""
    if not hydra.is_configured:
        raise HTTPException(
            status_code=503,
            detail="HydraDB Cloud credentials not configured. Please set HYDRA_DB_BASE_URL and HYDRA_DB_API_KEY.",
        )
    raise HTTPException(status_code=404, detail=f"Memory {memory_id} not found")


@router.get("/search", response_model=List[Fact])
async def search_memories(
    query: Optional[str] = Query(None, description="Search term or fact text"),
    entity: Optional[str] = Query(None, description="Filter by entity name"),
    status: Optional[MemoryStatus] = Query(None, description="Filter by memory status"),
    limit: int = Query(20, ge=1, le=100),
    hydra: HydraClient = Depends(get_hydra_client),
) -> List[Fact]:
    """Search and filter memories across time and status."""
    if not hydra.is_configured:
        return []
    return []
