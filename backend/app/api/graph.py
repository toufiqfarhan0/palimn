"""Graph visualization and inspection endpoints for PALIMN."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from backend.app.hydra.client import HydraClient, get_hydra_client
from backend.app.memory.models import GraphNode, GraphEdge, GraphResponse

router = APIRouter(prefix="/graph", tags=["Graph"])


@router.get("", response_model=GraphResponse)
async def get_graph_data(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    entity: Optional[str] = Query(None, description="Focus on a specific entity subgraph"),
    limit: int = Query(100, ge=1, le=500),
    hydra: HydraClient = Depends(get_hydra_client),
) -> GraphResponse:
    """Retrieve temporal memory graph nodes and relationships for React Flow visualization."""
    try:
        raw_graph = await hydra.get_graph(limit=limit)
        nodes = [GraphNode(**n) for n in raw_graph.get("nodes", [])]
        edges = [GraphEdge(**e) for e in raw_graph.get("edges", [])]
        return GraphResponse(
            nodes=nodes,
            edges=edges,
            total_nodes=len(nodes),
            total_edges=len(edges),
        )
    except Exception:
        return GraphResponse(nodes=[], edges=[], total_nodes=0, total_edges=0)
