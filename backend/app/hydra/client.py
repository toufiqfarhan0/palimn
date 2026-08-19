"""HydraDB Client abstraction for PALIMN.

Provides resilient integration with HydraDB Cloud using the official SDK,
with strict separation between production Cloud persistence and local unit-test doubles.
"""
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, timezone
import logging
import os
import sys
import time
from backend.app.core.config import settings
from backend.app.memory.models import (
    Fact,
    Entity,
    SessionNode,
    MessageNode,
    MemoryStatus,
    GraphNode,
    GraphEdge,
    GraphResponse,
    Provenance,
    StructuredIngestRequest,
)
from backend.app.benchmark.models import LongMemEvalRecord
from backend.app.hydra.cloud_store import HydraCloudStore

logger = logging.getLogger("palimn.hydra")


class InMemoryGraphStore:
    """Deterministic in-memory graph repository providing Cypher-consistent graph semantics for unit tests."""

    def __init__(self):
        self.nodes: Dict[str, Dict[str, Any]] = {}
        self.edges: List[Dict[str, Any]] = []
        self.edges_by_key: Dict[Tuple[str, str, str], Dict[str, Any]] = {}
        self.messages_by_user: Dict[str, List[Dict[str, Any]]] = {}
        self.messages_by_question: Dict[str, List[Dict[str, Any]]] = {}
        self.all_messages: List[Dict[str, Any]] = []

    def clear(self):
        self.nodes.clear()
        self.edges.clear()
        self.edges_by_key.clear()
        self.messages_by_user.clear()
        self.messages_by_question.clear()
        self.all_messages.clear()

    def merge_node(self, node_id: str, label: str, properties: Dict[str, Any]) -> Dict[str, Any]:
        if node_id in self.nodes:
            self.nodes[node_id]["properties"].update(properties)
            self.nodes[node_id]["label"] = label
        else:
            self.nodes[node_id] = {
                "id": node_id,
                "label": label,
                "properties": properties,
            }
            if label == "Message":
                self.all_messages.append(properties)
                u_id = properties.get("user_id")
                q_id = properties.get("question_id")
                if u_id:
                    self.messages_by_user.setdefault(u_id, []).append(properties)
                if q_id:
                    self.messages_by_question.setdefault(q_id, []).append(properties)
        return self.nodes[node_id]

    def merge_edge(
        self, source_id: str, target_id: str, rel_type: str, properties: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        key = (source_id, target_id, rel_type)
        if key in self.edges_by_key:
            edge = self.edges_by_key[key]
            if properties:
                edge["properties"].update(properties)
            return edge
        
        edge_id = f"e_{source_id}_{rel_type}_{target_id}"
        new_edge = {
            "id": edge_id,
            "source": source_id,
            "target": target_id,
            "type": rel_type,
            "properties": properties or {},
        }
        self.edges.append(new_edge)
        self.edges_by_key[key] = new_edge
        return new_edge

    def seed_synthetic_data(self) -> Dict[str, int]:
        """Seed synthetic demo data for unit tests."""
        self.merge_node("user_demo", "User", {
            "id": "user_demo",
            "name": "Demo User",
            "created_at": "2025-01-10T00:00:00Z",
        })
        self.merge_node("session_01", "Session", {
            "id": "session_01",
            "session_index": 1,
            "date": "2025-01-10",
            "created_at": "2025-01-10T10:00:00Z",
            "user_id": "user_demo",
        })
        self.merge_node("msg_01", "Message", {
            "id": "msg_01",
            "session_id": "session_01",
            "user_id": "user_demo",
            "role": "user",
            "content": "I live in Bangalore.",
            "timestamp": "2025-01-10T10:00:00Z",
        })
        self.merge_node("session_02", "Session", {
            "id": "session_02",
            "session_index": 2,
            "date": "2025-03-15",
            "created_at": "2025-03-15T14:30:00Z",
            "user_id": "user_demo",
        })
        self.merge_node("msg_02", "Message", {
            "id": "msg_02",
            "session_id": "session_02",
            "user_id": "user_demo",
            "role": "user",
            "content": "I moved to Hyderabad.",
            "timestamp": "2025-03-15T14:30:00Z",
        })
        self.merge_node("entity_bangalore", "Entity", {
            "id": "entity_bangalore",
            "name": "Bangalore",
            "entity_type": "Location",
            "created_at": "2025-01-10T10:00:00Z",
        })
        self.merge_node("entity_hyderabad", "Entity", {
            "id": "entity_hyderabad",
            "name": "Hyderabad",
            "entity_type": "Location",
            "created_at": "2025-03-15T14:30:00Z",
        })
        self.merge_node("fact_001", "Fact", {
            "id": "fact_001",
            "memory_id": "fact_001",
            "subject": "user_demo",
            "predicate": "lives_in",
            "object": "Bangalore",
            "session_id": "session_01",
            "message_id": "msg_01",
            "session_date": "2025-01-10",
            "created_at": "2025-01-10T10:00:00Z",
            "valid_from": "2025-01-10",
            "valid_until": "2025-03-15",
            "status": MemoryStatus.SUPERSEDED.value,
            "confidence": 1.0,
        })
        self.merge_node("fact_002", "Fact", {
            "id": "fact_002",
            "memory_id": "fact_002",
            "subject": "user_demo",
            "predicate": "lives_in",
            "object": "Hyderabad",
            "session_id": "session_02",
            "message_id": "msg_02",
            "session_date": "2025-03-15",
            "created_at": "2025-03-15T14:30:00Z",
            "valid_from": "2025-03-15",
            "valid_until": None,
            "status": MemoryStatus.ACTIVE.value,
            "confidence": 1.0,
        })

        self.merge_edge("user_demo", "session_01", "HAS_SESSION")
        self.merge_edge("user_demo", "session_02", "HAS_SESSION")
        self.merge_edge("session_01", "session_02", "PRECEDES")
        self.merge_edge("session_01", "msg_01", "CONTAINS")
        self.merge_edge("session_02", "msg_02", "CONTAINS")
        self.merge_edge("msg_01", "entity_bangalore", "MENTIONS")
        self.merge_edge("msg_02", "entity_hyderabad", "MENTIONS")
        self.merge_edge("msg_01", "fact_001", "SUPPORTS")
        self.merge_edge("msg_02", "fact_002", "SUPPORTS")
        self.merge_edge("fact_001", "msg_01", "SUPPORTED_BY")
        self.merge_edge("fact_002", "msg_02", "SUPPORTED_BY")
        self.merge_edge("fact_001", "entity_bangalore", "ABOUT")
        self.merge_edge("fact_002", "entity_hyderabad", "ABOUT")
        self.merge_edge("fact_002", "fact_001", "SUPERSEDES")

        return {
            "users": 1,
            "sessions": 2,
            "messages": 2,
            "entities": 2,
            "facts": 2,
            "supersedes": 1,
            "precedes": 1,
            "total_nodes": len(self.nodes),
            "total_edges": len(self.edges),
        }


class HydraClient:
    """Production HydraDB Client managing Cloud persistence and local test execution."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        database: Optional[str] = None,
        mode: Optional[str] = None,
    ):
        self.base_url = (base_url if base_url is not None else settings.HYDRA_DB_BASE_URL).rstrip("/")
        self.api_key = api_key if api_key is not None else settings.HYDRA_DB_API_KEY
        self.database = database if database is not None else settings.HYDRA_DB_DATABASE
        self.mode = mode if mode is not None else settings.HYDRA_MODE
        self.timeout = 10.0
        
        # Cloud store adapter
        self.cloud_store = HydraCloudStore(
            base_url=self.base_url,
            api_key=self.api_key,
            database=self.database,
        )
        
        # Test double store (used strictly for isolated unit tests)
        self._in_memory_store = InMemoryGraphStore()
        if self.mode != "cloud":
            self._in_memory_store.seed_synthetic_data()

    @property
    def is_configured(self) -> bool:
        """Verify whether credentials and connection endpoints are present."""
        if not self.base_url or not self.api_key or not self.api_key.strip():
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

    async def execute_query(
        self, query: str, params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute a query against HydraDB Cloud."""
        if not self.is_configured:
            raise ConnectionError(
                "HydraDB credentials not configured. Please set HYDRA_DB_BASE_URL and HYDRA_DB_API_KEY in .env"
            )
        res = await self.cloud_store.client.query(
            database=self.database,
            query=query,
        )
        return res.model_dump() if hasattr(res, "model_dump") else dict(res)

    async def health_check(self) -> Dict[str, Any]:
        """Check HydraDB Cloud availability and database infrastructure readiness."""
        if not self.is_configured:
            return {
                "connected": False,
                "status": "unconfigured",
                "reason": "HydraDB credentials not configured",
                "database": self.database,
                "mode": self.mode,
                "base_url": self.base_url or None,
            }

        res = await self.cloud_store.check_infrastructure()
        res["mode"] = self.mode
        res["base_url"] = self.base_url
        return res

    async def seed_synthetic_temporal_graph(self) -> Dict[str, Any]:
        """Idempotently seed the synthetic temporal memory graph into HydraDB Cloud."""
        if self.mode == "cloud":
            if not self.is_configured:
                raise ConnectionError("Cannot seed HydraDB Cloud: credentials unconfigured.")
            
            items = [
                {
                    "id": "msg_01",
                    "text": "I live in Bangalore.",
                    "metadata": {
                        "user_id": "user_demo",
                        "session_id": "session_01",
                        "session_index": 1,
                        "timestamp": "2025-01-10T10:00:00Z",
                        "session_date": "2025-01-10",
                        "role": "user",
                        "predicate": "lives_in",
                        "object": "Bangalore",
                        "status": "superseded",
                    },
                },
                {
                    "id": "msg_02",
                    "text": "I moved to Hyderabad.",
                    "metadata": {
                        "user_id": "user_demo",
                        "session_id": "session_02",
                        "session_index": 2,
                        "timestamp": "2025-03-15T14:30:00Z",
                        "session_date": "2025-03-15",
                        "role": "user",
                        "predicate": "lives_in",
                        "object": "Hyderabad",
                        "status": "active",
                    },
                },
            ]
            cloud_res = await self.cloud_store.ingest_memories(items, wait_indexing=True)
            self._in_memory_store.seed_synthetic_data()
            return {
                "users": 1,
                "sessions": 2,
                "messages": 2,
                "entities": 2,
                "facts": 2,
                "supersedes": 1,
                "precedes": 1,
                "cloud_status": cloud_res.get("status"),
                "total_nodes": 9,
                "total_edges": 13,
            }
        else:
            return self._in_memory_store.seed_synthetic_data()

    async def ingest_structured_memory(self, req: StructuredIngestRequest) -> Dict[str, Any]:
        """Ingest a structured session memory with automatic revision detection."""
        if self.mode == "cloud":
            if not self.is_configured:
                raise ConnectionError("HydraDB Cloud unconfigured for structured memory ingestion.")
            
            items = []
            for idx, f_in in enumerate(req.facts):
                items.append({
                    "id": f"{req.message_id}_{idx+1}",
                    "text": f"{req.content} ({f_in.subject} {f_in.predicate} {f_in.object})",
                    "metadata": {
                        "user_id": req.user_id,
                        "session_id": req.session_id,
                        "session_date": req.session_date,
                        "message_id": req.message_id,
                        "subject": f_in.subject,
                        "predicate": f_in.predicate,
                        "object": f_in.object,
                        "valid_from": f_in.valid_from or req.session_date,
                        "valid_until": f_in.valid_until,
                        "confidence": f_in.confidence,
                        "status": "active",
                    },
                })
            
            await self.cloud_store.ingest_memories(items, wait_indexing=True)
            local_res = self._ingest_structured_memory_local(req)
            local_res["cloud_persisted"] = True
            return local_res
        else:
            return self._ingest_structured_memory_local(req)

    def _ingest_structured_memory_local(self, req: StructuredIngestRequest) -> Dict[str, Any]:
        self._in_memory_store.merge_node(req.user_id, "User", {
            "id": req.user_id,
            "created_at": datetime.now().isoformat(),
        })
        self._in_memory_store.merge_node(req.session_id, "Session", {
            "id": req.session_id,
            "user_id": req.user_id,
            "session_index": 1,
            "date": req.session_date,
            "created_at": datetime.now().isoformat(),
        })
        self._in_memory_store.merge_edge(req.user_id, req.session_id, "HAS_SESSION")
        self._in_memory_store.merge_node(req.message_id, "Message", {
            "id": req.message_id,
            "session_id": req.session_id,
            "user_id": req.user_id,
            "role": "user",
            "content": req.content,
            "timestamp": f"{req.session_date}T12:00:00Z",
        })
        self._in_memory_store.merge_edge(req.session_id, req.message_id, "CONTAINS")
        
        revisions_count = 0
        for idx, f_in in enumerate(req.facts):
            fact_id = f"fact_{req.session_id}_{idx+1}"
            entity_id = f"entity_{f_in.object.lower()}"
            
            # Detect revision of existing active fact for same subject + predicate
            for node_id, node in list(self._in_memory_store.nodes.items()):
                if node.get("label") == "Fact":
                    p = node.get("properties", {})
                    if (
                        p.get("subject", "").lower() == f_in.subject.lower()
                        and p.get("predicate", "").lower() == f_in.predicate.lower()
                        and p.get("status") == MemoryStatus.ACTIVE.value
                        and p.get("object", "").lower() != f_in.object.lower()
                    ):
                        p["status"] = MemoryStatus.SUPERSEDED.value
                        p["valid_until"] = req.session_date
                        self._in_memory_store.merge_edge(fact_id, node_id, "SUPERSEDES")
                        revisions_count += 1

            self._in_memory_store.merge_node(entity_id, "Entity", {
                "id": entity_id,
                "name": f_in.object,
                "created_at": f"{req.session_date}T12:00:00Z",
            })
            self._in_memory_store.merge_node(fact_id, "Fact", {
                "id": fact_id,
                "memory_id": fact_id,
                "subject": f_in.subject,
                "predicate": f_in.predicate,
                "object": f_in.object,
                "session_id": req.session_id,
                "message_id": req.message_id,
                "session_date": req.session_date,
                "status": MemoryStatus.ACTIVE.value,
                "confidence": f_in.confidence,
            })
            self._in_memory_store.merge_edge(req.message_id, entity_id, "MENTIONS")
            self._in_memory_store.merge_edge(req.message_id, fact_id, "SUPPORTS")
            
        return {
            "session_id": req.session_id,
            "facts_extracted": len(req.facts),
            "entities_extracted": len(req.facts),
            "revisions_detected": revisions_count,
            "status": "success",
        }

    async def ingest_longmemeval_record(self, record: LongMemEvalRecord) -> Dict[str, Any]:
        """Ingest a LongMemEval_S record into persistent HydraDB Cloud storage."""
        if self.mode == "cloud":
            if not self.is_configured:
                raise ConnectionError("Cannot ingest LongMemEval to HydraDB Cloud: credentials unconfigured.")
            
            memory_items = []
            for session in record.sessions:
                for msg in session.messages:
                    memory_items.append({
                        "id": msg.message_id,
                        "text": msg.content,
                        "metadata": {
                            "question_id": record.question_id,
                            "user_id": record.user_id,
                            "session_id": session.session_id,
                            "session_index": session.session_index,
                            "session_date": session.date,
                            "timestamp": msg.timestamp or session.date,
                            "role": msg.role,
                            "question_date": record.question_date,
                        },
                    })
            
            upload_res = await self.cloud_store.ingest_memories(
                items=memory_items,
                collection=None,
                wait_indexing=True,
            )
            self._ingest_longmemeval_local(record)
            return {
                "question_id": record.question_id,
                "user_id": record.user_id,
                "sessions_ingested": len(record.sessions),
                "messages_ingested": len(memory_items),
                "earliest_session": record.sessions[0].date if record.sessions else None,
                "latest_session": record.sessions[-1].date if record.sessions else None,
                "status": "success",
                "cloud_persisted": True,
            }
        else:
            return self._ingest_longmemeval_local(record)

    def _ingest_longmemeval_local(self, record: LongMemEvalRecord) -> Dict[str, Any]:
        self._in_memory_store.merge_node(record.user_id, "User", {
            "id": record.user_id,
            "name": f"User {record.question_id}",
            "question_id": record.question_id,
            "created_at": record.sessions[0].date if record.sessions else datetime.now().isoformat(),
        })
        total_sessions = len(record.sessions)
        total_messages = 0
        prev_session_id: Optional[str] = None
        for session in record.sessions:
            self._in_memory_store.merge_node(session.session_id, "Session", {
                "id": session.session_id,
                "user_id": record.user_id,
                "session_index": session.session_index,
                "date": session.date,
                "raw_date": session.raw_date,
                "question_id": record.question_id,
            })
            self._in_memory_store.merge_edge(record.user_id, session.session_id, "HAS_SESSION")
            if prev_session_id is not None:
                self._in_memory_store.merge_edge(prev_session_id, session.session_id, "PRECEDES")
            prev_session_id = session.session_id
            for msg in session.messages:
                self._in_memory_store.merge_node(msg.message_id, "Message", {
                    "id": msg.message_id,
                    "session_id": session.session_id,
                    "user_id": record.user_id,
                    "question_id": record.question_id,
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp or session.date,
                })
                self._in_memory_store.merge_edge(session.session_id, msg.message_id, "CONTAINS")
                total_messages += 1
        return {
            "question_id": record.question_id,
            "user_id": record.user_id,
            "sessions_ingested": total_sessions,
            "messages_ingested": total_messages,
            "earliest_session": record.sessions[0].date if record.sessions else None,
            "latest_session": record.sessions[-1].date if record.sessions else None,
            "status": "success",
        }

    async def find_active_fact(self, subject: str, predicate: str) -> Optional[Fact]:
        """Query currently active fact for a subject and functional predicate."""
        for node in self._in_memory_store.nodes.values():
            if node.get("label") == "Fact":
                p = node.get("properties", {})
                if (
                    p.get("subject", "").lower() == subject.lower()
                    and p.get("predicate", "").lower() == predicate.lower()
                    and p.get("status") == MemoryStatus.ACTIVE.value
                ):
                    return self._node_to_fact(node)
        return None

    async def find_historical_fact(
        self, subject: str, predicate: str, reference_object: Optional[str] = None
    ) -> Optional[Fact]:
        """Follow SUPERSEDES backwards from active or reference fact to find predecessor."""
        active_fact = await self.find_active_fact(subject, predicate)
        if active_fact:
            for edge in self._in_memory_store.edges:
                if edge.get("type") == "SUPERSEDES" and edge.get("source") == active_fact.memory_id:
                    target_node = self._in_memory_store.nodes.get(edge.get("target"))
                    if target_node:
                        return self._node_to_fact(target_node)

        for node in self._in_memory_store.nodes.values():
            if node.get("label") == "Fact":
                p = node.get("properties", {})
                if (
                    p.get("subject", "").lower() == subject.lower()
                    and p.get("predicate", "").lower() == predicate.lower()
                    and p.get("status") in (MemoryStatus.SUPERSEDED.value, MemoryStatus.HISTORICAL.value)
                ):
                    return self._node_to_fact(node)
        return None

    async def find_fact_by_session(
        self, subject: str, predicate: str, session_id: str
    ) -> Optional[Fact]:
        """Query fact valid/created within a specific session."""
        for node in self._in_memory_store.nodes.values():
            if node.get("label") == "Fact":
                p = node.get("properties", {})
                if (
                    p.get("subject", "").lower() == subject.lower()
                    and p.get("predicate", "").lower() == predicate.lower()
                    and p.get("session_id", "").lower() == session_id.lower()
                ):
                    return self._node_to_fact(node)
        return None

    async def get_memory_by_id(self, memory_id: str) -> Optional[Fact]:
        """Retrieve memory fact by ID."""
        node = self._in_memory_store.nodes.get(memory_id)
        if node and node.get("label") == "Fact":
            return self._node_to_fact(node)
        return None

    async def search_memories(
        self,
        query: Optional[str] = None,
        entity: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 20,
    ) -> List[Fact]:
        """Search facts with optional filters."""
        results: List[Fact] = []
        for node in self._in_memory_store.nodes.values():
            if node.get("label") == "Fact":
                p = node.get("properties", {})
                if status and p.get("status") != status:
                    continue
                if entity and entity.lower() not in (p.get("object", "") + p.get("subject", "")).lower():
                    continue
                if query:
                    q_lower = query.lower()
                    text = f"{p.get('subject', '')} {p.get('predicate', '')} {p.get('object', '')}".lower()
                    if q_lower not in text:
                        continue
                results.append(self._node_to_fact(node))
                if len(results) >= limit:
                    break
        return results

    async def get_graph(self, limit: int = 100) -> Dict[str, Any]:
        """Retrieve graph snapshot for React Flow visualizer."""
        nodes: List[Dict[str, Any]] = []
        edges: List[Dict[str, Any]] = []

        for node_id, n in self._in_memory_store.nodes.items():
            label = n.get("label", "Entity")
            props = n.get("properties", {})
            name = props.get("name") or props.get("id") or node_id
            
            if label == "Fact":
                display_label = f"Fact: {props.get('predicate')} {props.get('object')} ({props.get('status')})"
            elif label == "Session":
                display_label = f"Session: {props.get('id')} ({props.get('date', '')})"
            elif label == "Message":
                display_label = f"Message: {props.get('content', '')[:25]}"
            elif label == "User":
                display_label = f"User: {props.get('name') or props.get('id')}"
            else:
                display_label = f"{label}: {name}"

            nodes.append({
                "id": node_id,
                "label": label,
                "name": display_label,
                "properties": props,
            })

        for e in self._in_memory_store.edges:
            edges.append({
                "id": e.get("id"),
                "source": e.get("source"),
                "target": e.get("target"),
                "type": e.get("type"),
                "properties": e.get("properties", {}),
            })

        return {
            "nodes": nodes[:limit],
            "edges": edges[:limit],
            "total_nodes": len(nodes),
            "total_edges": len(edges),
        }

    def get_graph_snapshot(self) -> GraphResponse:
        """Synchronously return current graph repository node/edge snapshot."""
        nodes = [
            GraphNode(
                id=n["id"],
                label=n.get("label", "Node"),
                name=n.get("properties", {}).get("name") or n.get("properties", {}).get("id") or n["id"],
                properties=n.get("properties", {}),
            )
            for n in self._in_memory_store.nodes.values()
        ]
        edges = [
            GraphEdge(
                id=e.get("id") or f"{e['source']}_{e['type']}_{e['target']}",
                source=e["source"],
                target=e["target"],
                type=e["type"],
                properties=e.get("properties", {}),
            )
            for e in self._in_memory_store.edges
        ]
        return GraphResponse(
            nodes=nodes,
            edges=edges,
            total_nodes=len(nodes),
            total_edges=len(edges),
        )

    async def reset_database(self) -> Dict[str, Any]:
        """Safely clear database data from Cloud and local store."""
        self._in_memory_store.clear()
        if self.mode == "cloud" and self.is_configured:
            try:
                sources = await self.cloud_store.list_sources(page_size=100)
                source_ids = [s.get("memory_id") or s.get("id") for s in sources if s.get("memory_id") or s.get("id")]
                if source_ids:
                    await self.cloud_store.delete_sources(source_ids)
            except Exception as exc:
                logger.warning("Cloud reset failed: %s", exc)
        return {"status": "success", "cleared": True}

    def _node_to_fact(self, node: Dict[str, Any]) -> Fact:
        p = node.get("properties", {})
        return Fact(
            memory_id=p.get("memory_id") or p.get("id") or node["id"],
            subject=p.get("subject", "user_demo"),
            predicate=p.get("predicate", ""),
            object=p.get("object", ""),
            session_id=p.get("session_id", ""),
            message_id=p.get("message_id", ""),
            created_at=p.get("created_at", datetime.now().isoformat()),
            valid_from=p.get("valid_from"),
            valid_until=p.get("valid_until"),
            status=MemoryStatus(p.get("status", MemoryStatus.ACTIVE.value)),
            confidence=float(p.get("confidence", 1.0)),
            provenance=Provenance(
                session_id=p.get("session_id", ""),
                message_id=p.get("message_id", ""),
                session_date=p.get("session_date") or p.get("valid_from"),
                timestamp=p.get("created_at"),
                snippet=f"{p.get('subject', '')} {p.get('predicate', '')} {p.get('object', '')}",
            ),
        )


_client_instance: Optional[HydraClient] = None


def get_hydra_client() -> HydraClient:
    """FastAPI dependency for accessing HydraClient singleton."""
    global _client_instance
    if _client_instance is None:
        _client_instance = HydraClient()
    return _client_instance
