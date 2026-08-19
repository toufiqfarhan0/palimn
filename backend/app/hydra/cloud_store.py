"""Official HydraDB Cloud persistent storage adapter for PALIMN.

Provides asynchronous integration with HydraDB Cloud v2 API:
- Database infrastructure monitoring & status checks
- Real-time persistent memory turn ingestion with rich temporal metadata
- Asynchronous indexing verification and polling
- Persistent hybrid/graph query retrieval with strict tenant scoping
- Source inspection and deletion
"""
import asyncio
import json
import logging
import time
from typing import Any, Dict, List, Optional, Tuple
from hydra_db import AsyncHydraDB
from backend.app.core.config import settings

logger = logging.getLogger("palimn.hydra.cloud")


class HydraCloudStore:
    """Production persistent graph & memory store on HydraDB Cloud."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        database: Optional[str] = None,
    ):
        self.base_url = (base_url or settings.HYDRA_DB_BASE_URL).rstrip("/")
        self.api_key = api_key or settings.HYDRA_DB_API_KEY
        self.database = database or settings.HYDRA_DB_DATABASE
        self._client: Optional[AsyncHydraDB] = None

    @property
    def client(self) -> AsyncHydraDB:
        """Lazily initialize AsyncHydraDB client."""
        if self._client is None:
            if not self.api_key:
                raise ConnectionError("HydraDB API key is not configured.")
            self._client = AsyncHydraDB(
                base_url=self.base_url,
                token=self.api_key,
            )
        return self._client

    @property
    def is_configured(self) -> bool:
        """Check if connection credentials are present."""
        return bool(self.base_url and self.api_key and "your_" not in self.api_key and "example" not in self.api_key)

    async def check_infrastructure(self) -> Dict[str, Any]:
        """Check infrastructure health and readiness of the database on HydraDB Cloud."""
        if not self.is_configured:
            return {
                "connected": False,
                "status": "unconfigured",
                "reason": "HydraDB API key is not configured.",
                "database": self.database,
            }

        start_time = time.perf_counter()
        try:
            status_res = await self.client.databases.status(database=self.database)
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            if status_res.success and status_res.data:
                infra = status_res.data.infra
                return {
                    "connected": True,
                    "status": "healthy",
                    "latency_ms": latency_ms,
                    "database": self.database,
                    "ready_for_ingestion": getattr(infra, "ready_for_ingestion", True),
                    "graph_status": getattr(infra, "graph_status", True),
                    "tenant_id": status_res.data.tenant_id,
                }
            return {
                "connected": False,
                "status": "degraded",
                "latency_ms": latency_ms,
                "reason": str(status_res.error or "Status check unsuccessful"),
                "database": self.database,
            }
        except Exception as exc:
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error("HydraDB Cloud infrastructure check failed: %s", exc)
            return {
                "connected": False,
                "status": "error",
                "latency_ms": latency_ms,
                "reason": str(exc),
                "database": self.database,
            }

    async def ingest_memories(
        self,
        items: List[Dict[str, Any]],
        collection: Optional[str] = None,
        wait_indexing: bool = True,
        timeout_s: float = 30.0,
    ) -> Dict[str, Any]:
        """Persist memory turns with temporal metadata into HydraDB Cloud.
        
        Args:
            items: List of dicts with keys: 'id', 'text', 'metadata'.
            collection: Optional sub-tenant collection scope.
            wait_indexing: If True, polls until indexing completes.
            timeout_s: Maximum seconds to wait for indexing.
            
        Returns:
            Dict containing upload status, source IDs, and indexing confirmation.
        """
        if not items:
            return {"status": "success", "count": 0, "source_ids": []}

        # Build payload ensuring each item has 'text', 'id', and 'metadata'
        formatted_items = []
        source_ids = []
        for item in items:
            s_id = item.get("id") or item.get("source_id") or item.get("message_id")
            text = item.get("text") or item.get("content") or ""
            metadata = item.get("metadata") or {}
            formatted_items.append({
                "id": s_id,
                "text": text,
                "metadata": metadata,
            })
            if s_id:
                source_ids.append(s_id)

        # Dynamically chunk items by character budget to stay safely within the 1000-token per-request limit
        chunks: List[List[Dict[str, Any]]] = []
        current_chunk: List[Dict[str, Any]] = []
        current_chars = 0
        
        for item in formatted_items:
            item_text = str(item.get("text") or "")
            item_chars = len(item_text)
            if current_chunk and (current_chars + item_chars > 2000 or len(current_chunk) >= 5):
                chunks.append(current_chunk)
                current_chunk = [item]
                current_chars = item_chars
            else:
                current_chunk.append(item)
                current_chars += item_chars
        if current_chunk:
            chunks.append(current_chunk)

        # Ingest chunks concurrently with a semaphore
        sem = asyncio.Semaphore(4)

        async def ingest_chunk(chunk_items: List[Dict[str, Any]], retry_count: int = 8) -> None:
            async with sem:
                memories_json = json.dumps(chunk_items)
                for attempt in range(retry_count):
                    try:
                        res = await self.client.context.ingest(
                            database=self.database,
                            collection=collection,
                            memories=memories_json,
                            type="memory",
                        )
                        if res.success:
                            return
                        err_msg = res.data.message if res.data else "Unknown error"
                        if attempt == retry_count - 1:
                            raise RuntimeError(f"HydraDB Cloud ingestion failed: {err_msg}")
                    except Exception as e:
                        status_code = getattr(e, "status_code", None)
                        if status_code == 429:
                            retry_after = 3.5
                            if hasattr(e, "headers") and isinstance(e.headers, dict):
                                try:
                                    retry_after = float(e.headers.get("retry-after", 3.5)) + 0.5
                                except Exception:
                                    retry_after = 3.5
                            logger.info("HydraDB rate limit encountered, waiting %.1fs before retry...", retry_after)
                            await asyncio.sleep(retry_after)
                            continue
                        if attempt == retry_count - 1:
                            raise e
                        await asyncio.sleep(1.0 * (attempt + 1))

        await asyncio.gather(*(ingest_chunk(c) for c in chunks))

        # Wait for asynchronous indexing to complete
        indexed_count = 0
        if wait_indexing and source_ids:
            indexed_count = await self.wait_for_indexing(source_ids=source_ids, collection=collection, timeout_s=timeout_s)

        return {
            "status": "success",
            "count": len(formatted_items),
            "source_ids": source_ids,
            "indexed_count": indexed_count,
        }

    async def wait_for_indexing(
        self,
        source_ids: List[str],
        collection: Optional[str] = None,
        timeout_s: float = 30.0,
        poll_interval_s: float = 1.0,
    ) -> int:
        """Poll HydraDB context.status until submitted source IDs reach terminal status."""
        start_time = time.perf_counter()
        pending = set(source_ids)
        completed = set()

        while pending and (time.perf_counter() - start_time) < timeout_s:
            batch_check = list(pending)[:20]
            try:
                st = await self.client.context.status(
                    database=self.database,
                    ids=batch_check,
                    collection=collection,
                )
                if st.success and st.data:
                    stat_list = getattr(st.data, "statuses", None) or getattr(st.data, "sources", None) or []
                    for status_item in stat_list:
                        status_str = getattr(status_item, "indexing_status", "") or getattr(status_item, "status", "")
                        item_id = getattr(status_item, "id", "") or getattr(status_item, "source_id", "")
                        if status_str in ("completed", "errored", "failed"):
                            pending.discard(item_id)
                            completed.add(item_id)
            except Exception as exc:
                logger.warning("Error polling indexing status: %s", exc)

            if pending:
                await asyncio.sleep(poll_interval_s)

        if pending:
            logger.warning("Indexing timed out for %d sources: %s", len(pending), list(pending)[:5])

        return len(completed)

    async def query_candidates(
        self,
        query: str,
        collection: Optional[str] = None,
        max_results: int = 20,
        user_id: Optional[str] = None,
        mode: Optional[str] = None,
        num_related_chunks: Optional[int] = None,
        graph_context: bool = True,
        **kwargs: Any,
    ) -> List[Dict[str, Any]]:
        """Retrieve candidate memory records and graph context from HydraDB Cloud.
        
        Returns:
            List of candidate dictionaries with content, metadata, score, and graph relations.
        """
        logger.debug("Executing cloud retrieval for query: '%s'", query)
        query_payload: Dict[str, Any] = {
            "database": self.database,
            "collection": collection,
            "query": query,
            "type": "memory",
            "max_results": max_results,
            "graph_context": graph_context,
        }
        if mode is not None:
            query_payload["mode"] = mode
        if num_related_chunks is not None:
            query_payload["num_related_chunks"] = num_related_chunks
        query_payload.update(kwargs)

        res = await self.client.query(**query_payload)

        candidates: List[Dict[str, Any]] = []
        if not res.success or not res.data:
            return candidates

        chunks = res.data.chunks or []
        for chunk in chunks:
            c_meta = chunk.metadata or {}
            # User filtering if specified
            if user_id and c_meta.get("user_id") and c_meta.get("user_id") != user_id:
                continue

            candidates.append({
                "message_id": chunk.id or getattr(chunk, "source_title", None) or "",
                "content": chunk.chunk_content or "",
                "score": chunk.relevancy_score or 0.0,
                "session_id": c_meta.get("session_id", ""),
                "session_date": c_meta.get("session_date"),
                "timestamp": c_meta.get("timestamp"),
                "role": c_meta.get("role", "user"),
                "user_id": c_meta.get("user_id", ""),
                "question_id": c_meta.get("question_id"),
                "metadata": c_meta,
            })

        return candidates

    async def list_sources(
        self,
        collection: Optional[str] = None,
        source_type: str = "memory",
        page_size: int = 50,
    ) -> List[Dict[str, Any]]:
        """List persisted sources from HydraDB Cloud."""
        res = await self.client.context.list(
            database=self.database,
            collection=collection,
            type=source_type,
            page_size=page_size,
        )
        if res.success and res.data:
            data_obj = res.data
            sources = getattr(data_obj, "user_memories", None) or getattr(data_obj, "sources", None)
            if not sources and hasattr(data_obj, "inner") and data_obj.inner:
                sources = getattr(data_obj.inner, "sources", None)
            return sources or []
        return []

    async def delete_sources(
        self,
        source_ids: List[str],
        collection: Optional[str] = None,
        source_type: str = "memory",
    ) -> Dict[str, Any]:
        """Delete specific persisted sources from HydraDB Cloud."""
        if not source_ids:
            return {"status": "success", "deleted_count": 0}
        res = await self.client.context.delete(
            database=self.database,
            collection=collection,
            ids=source_ids,
            type=source_type,
        )
        deleted = getattr(res.data, "deleted_count", 0) if res.data else 0
        return {"status": "success", "deleted_count": deleted}

    async def get_graph_relations(
        self,
        source_id: str,
        collection: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Fetch extracted graph relations for a source from HydraDB Cloud."""
        res = await self.client.context.relations(
            database=self.database,
            collection=collection,
            id=source_id,
        )
        if res.success and res.data and res.data.relations:
            return [r.model_dump() if hasattr(r, "model_dump") else dict(r) for r in res.data.relations]
        return []
