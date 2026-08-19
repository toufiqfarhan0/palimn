"""Health check endpoint for PALIMN service."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from backend.app.core.config import settings
from backend.app.hydra.client import HydraClient, get_hydra_client

router = APIRouter(tags=["Health"])


class HydraHealthStatus(BaseModel):
    connected: bool
    status: str
    reason: str | None = None
    latency_ms: float | None = None
    database: str
    mode: str
    base_url: str | None = None


class HealthResponse(BaseModel):
    status: str = Field(..., description="Overall service status (ok/degraded/error)")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")
    environment: str = Field(..., description="Deployment environment")
    hydradb: HydraHealthStatus = Field(..., description="HydraDB Cloud connection health")


@router.get("/health", response_model=HealthResponse)
async def get_health(
    hydra: HydraClient = Depends(get_hydra_client),
) -> HealthResponse:
    """Comprehensive health check verifying backend API and HydraDB Cloud connectivity."""
    hydra_health = await hydra.health_check()

    overall_status = "ok"
    if not hydra_health.get("connected") and hydra_health.get("status") not in ("unconfigured", "healthy"):
        overall_status = "degraded"

    return HealthResponse(
        status=overall_status,
        service=settings.APP_NAME,
        version=settings.APP_VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
        environment=settings.PALIMN_ENV,
        hydradb=HydraHealthStatus(
            connected=hydra_health.get("connected", False),
            status=hydra_health.get("status", "unknown"),
            reason=hydra_health.get("reason"),
            latency_ms=hydra_health.get("latency_ms"),
            database=hydra_health.get("database", settings.HYDRA_DB_DATABASE),
            mode=hydra_health.get("mode", settings.HYDRA_MODE),
            base_url=hydra_health.get("base_url"),
        ),
    )
