"""HydraDB Cloud Client abstraction for PALIMN.

Isolates all HTTP/Bolt communication with HydraDB Cloud.
Provides resilient connection handling, structured querying, and health verification.
"""
from typing import Any, Dict, List, Optional
import logging
import httpx
import time
from backend.app.core.config import settings

logger = logging.getLogger("palimn.hydra")


class HydraClient:
    """Resilient client for HydraDB Cloud instance."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        database: Optional[str] = None,
        mode: Optional[str] = None,
    ):
        self.base_url = (base_url or settings.HYDRA_DB_BASE_URL).rstrip("/")
        self.api_key = api_key or settings.HYDRA_DB_API_KEY
        self.database = database or settings.HYDRA_DB_DATABASE
        self.mode = mode or settings.HYDRA_MODE
        self.timeout = 10.0

    @property
    def is_configured(self) -> bool:
        """Verify whether credentials and connection endpoints are present."""
        if not self.base_url or not self.api_key:
            return False
        if "your_" in self.api_key or "example" in self.api_key:
            return False
        return True

    def _get_headers(self) -> Dict[str, str]:
        """Construct standard authorization and routing headers."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-Hydra-Database": self.database,
            "X-Hydra-Mode": self.mode,
        }

    async def health_check(self) -> Dict[str, Any]:
        """Check HydraDB Cloud availability and credentials.
        
        Returns structured health status dictionary.
        """
        if not self.is_configured:
            return {
                "connected": False,
                "status": "unconfigured",
                "reason": "HydraDB credentials not configured",
                "database": self.database,
                "mode": self.mode,
                "base_url": self.base_url or None,
            }

        start_time = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                health_url = f"{self.base_url}/health" if not self.base_url.endswith("/health") else self.base_url
                response = await client.get(health_url, headers=self._get_headers())
                latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

                if response.status_code in (200, 204):
                    return {
                        "connected": True,
                        "status": "healthy",
                        "latency_ms": latency_ms,
                        "database": self.database,
                        "mode": self.mode,
                        "base_url": self.base_url,
                    }
                else:
                    return {
                        "connected": False,
                        "status": "degraded",
                        "status_code": response.status_code,
                        "reason": f"HydraDB returned status {response.status_code}: {response.text[:200]}",
                        "latency_ms": latency_ms,
                        "database": self.database,
                        "mode": self.mode,
                    }
        except httpx.RequestError as exc:
            logger.warning("HydraDB health check failed: %s", exc)
            return {
                "connected": False,
                "status": "unreachable",
                "reason": f"Failed to connect to HydraDB Cloud: {str(exc)}",
                "database": self.database,
                "mode": self.mode,
                "base_url": self.base_url,
            }
        except Exception as exc:
            logger.error("Unexpected error checking HydraDB: %s", exc)
            return {
                "connected": False,
                "status": "error",
                "reason": str(exc),
                "database": self.database,
                "mode": self.mode,
            }

    async def execute_query(
        self, query: str, params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute a graph query against HydraDB Cloud."""
        if not self.is_configured:
            raise ConnectionError(
                "HydraDB credentials not configured. Please set HYDRA_DB_BASE_URL and HYDRA_DB_API_KEY in .env"
            )

        payload = {
            "query": query,
            "params": params or {},
            "database": self.database,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            query_url = f"{self.base_url}/v1/query"
            response = await client.post(
                query_url, json=payload, headers=self._get_headers()
            )
            response.raise_for_status()
            return response.json()

    async def create_node(
        self, label: str, properties: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a graph node with given label and properties."""
        if not self.is_configured:
            raise ConnectionError("HydraDB credentials not configured")
        
        query = f"CREATE (n:{label} $props) RETURN n"
        return await self.execute_query(query, {"props": properties})

    async def create_relationship(
        self,
        from_id: str,
        to_id: str,
        rel_type: str,
        properties: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a directed relationship between two nodes."""
        if not self.is_configured:
            raise ConnectionError("HydraDB credentials not configured")
        
        query = (
            f"MATCH (a), (b) WHERE a.id = $from_id AND b.id = $to_id "
            f"CREATE (a)-[r:{rel_type} $props]->(b) RETURN r"
        )
        return await self.execute_query(
            query,
            {"from_id": from_id, "to_id": to_id, "props": properties or {}},
        )

    async def get_graph(self, limit: int = 100) -> Dict[str, Any]:
        """Retrieve recent graph snapshot for visualization."""
        if not self.is_configured:
            return {"nodes": [], "edges": [], "configured": False}
        
        query = (
            f"MATCH (n)-[r]->(m) RETURN n, r, m LIMIT {limit}"
        )
        try:
            result = await self.execute_query(query)
            return result
        except Exception as exc:
            logger.error("Failed to fetch graph snapshot: %s", exc)
            return {"nodes": [], "edges": [], "error": str(exc)}


_client_instance: Optional[HydraClient] = None


def get_hydra_client() -> HydraClient:
    """FastAPI dependency for accessing HydraClient singleton."""
    global _client_instance
    if _client_instance is None:
        _client_instance = HydraClient()
    return _client_instance
