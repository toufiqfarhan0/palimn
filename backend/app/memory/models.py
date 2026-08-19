"""Domain models for PALIMN temporal memory graph."""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MemoryStatus(str, Enum):
    ACTIVE = "active"
    HISTORICAL = "historical"
    SUPERSEDED = "superseded"
    CONTRADICTED = "contradicted"
    UNCERTAIN = "uncertain"


class DecisionType(str, Enum):
    ANSWERABLE = "answerable"
    ABSTAIN = "abstain"


class AbstainReason(str, Enum):
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    NO_MATCHING_MEMORY = "no_matching_memory"
    CONFLICTING_EVIDENCE = "conflicting_evidence"
    TEMPORAL_AMBIGUITY = "temporal_ambiguity"


class Provenance(BaseModel):
    session_id: str
    message_id: str
    session_date: Optional[str] = None
    timestamp: Optional[str] = None
    snippet: Optional[str] = None


class Fact(BaseModel):
    memory_id: str = Field(..., description="Unique memory ID")
    subject: str = Field(..., description="Entity subject")
    predicate: str = Field(..., description="Relationship or property")
    object: str = Field(..., description="Entity or value object")
    session_id: str = Field(..., description="Originating session ID")
    message_id: str = Field(..., description="Originating message ID")
    created_at: str = Field(..., description="Extraction timestamp (ISO 8601)")
    valid_from: Optional[str] = Field(None, description="Temporal validity start date/time")
    valid_until: Optional[str] = Field(None, description="Temporal validity end / invalidation date/time")
    status: MemoryStatus = Field(default=MemoryStatus.ACTIVE, description="Current lifecycle status")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Confidence score")
    superseded_by: Optional[str] = Field(None, description="Memory ID of newer fact replacing this")
    contradicted_by: Optional[str] = Field(None, description="Memory ID of contradicting fact")
    provenance: Optional[Provenance] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Entity(BaseModel):
    id: str
    name: str
    entity_type: str = "concept"
    aliases: List[str] = Field(default_factory=list)
    created_at: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SessionNode(BaseModel):
    id: str
    user_id: str
    session_index: int
    date: str
    created_at: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class MessageNode(BaseModel):
    id: str
    session_id: str
    role: str = "user"
    content: str
    timestamp: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class EvidenceItem(BaseModel):
    memory_id: str
    fact: Optional[str] = None
    subject: str
    predicate: str
    object: str
    session_id: str
    message_id: str
    session_date: Optional[str] = None
    status: MemoryStatus
    confidence: float = 1.0
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    relevance_score: float = 1.0
    provenance_text: Optional[str] = None


class ChatQueryRequest(BaseModel):
    question: str = Field(..., description="User question to answer using temporal memory")
    user_id: Optional[str] = Field("user_demo", description="User identifier")
    session_id: Optional[str] = Field(None, description="Current interactive session ID")
    time_context: Optional[str] = Field(None, description="Temporal reference timestamp")


class ChatQueryResponse(BaseModel):
    question: str
    decision: DecisionType = Field(..., description="answerable or abstain")
    reason: Optional[str] = Field(None, description="Reason if abstaining (e.g. no_matching_memory)")
    answer: Optional[str] = Field(None, description="Generated answer if answerable")
    confidence: float = Field(..., ge=0.0, le=1.0)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    temporal_reasoning: Optional[str] = Field(None, description="Explanation of chronological resolution")
    latency_ms: float = Field(..., description="Total processing latency in ms")


# Phase 2 Structured Ingestion Models
class FactInput(BaseModel):
    subject: str
    predicate: str
    object: str
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    confidence: float = 1.0


class StructuredIngestRequest(BaseModel):
    user_id: str = "user_demo"
    session_id: str
    session_date: str
    message_id: str
    content: str
    facts: List[FactInput] = Field(default_factory=list)


class IngestMessage(BaseModel):
    message_id: str
    role: str = "user"
    content: str
    timestamp: Optional[str] = None


class IngestSessionRequest(BaseModel):
    user_id: str = "user_demo"
    session_id: str
    session_index: Optional[int] = None
    session_date: Optional[str] = None
    timestamp: Optional[str] = None
    messages: List[IngestMessage] = Field(default_factory=list)
    facts: Optional[List[FactInput]] = None


class IngestSessionResponse(BaseModel):
    session_id: str
    facts_extracted: int
    entities_extracted: int
    revisions_detected: int
    status: str = "success"
    latency_ms: float


class GraphNode(BaseModel):
    id: str
    label: str  # User, Session, Message, Entity, Fact, Event, Preference, Topic
    name: str
    properties: Dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str  # HAS_SESSION, PRECEDES, CONTAINS, MENTIONS, SUPPORTS, ABOUT, SUPPORTED_BY, SUPERSEDES, CONTRADICTS, RELATED_TO, OCCURRED_IN
    properties: Dict[str, Any] = Field(default_factory=dict)


class GraphResponse(BaseModel):
    nodes: List[GraphNode] = Field(default_factory=list)
    edges: List[GraphEdge] = Field(default_factory=list)
    total_nodes: int = 0
    total_edges: int = 0
