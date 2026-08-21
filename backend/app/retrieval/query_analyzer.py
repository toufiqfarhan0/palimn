"""Query decomposition and deterministic intent extraction for temporal memory."""
import re
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.retrieval.query_normalizer import extract_query_concepts, normalize_query_text


class QueryIntent(BaseModel):
    """Structured graph traversal plan representing user query intent."""
    raw_query: str
    query_type: str = Field(
        ..., description="'current_state' | 'historical_state' | 'session_scoped' | 'point_in_time_valid' | 'point_in_time_assertion' | 'open_domain' | 'unknown'"
    )
    subject: str = "user_demo"
    predicate: str = "lives_in"
    target_entity: Optional[str] = None
    reference_object: Optional[str] = None
    session_id: Optional[str] = None
    temporal_anchor: Optional[str] = None
    temporal_context: Optional[str] = None
    as_of_valid_time: Optional[str] = None
    as_of_assertion_time: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)
    concepts: List[str] = Field(default_factory=list)
    term_weights: Dict[str, float] = Field(default_factory=dict)


class QueryAnalyzer:
    """Parses natural language questions into structured graph traversal intents."""

    def analyze(
        self,
        query: str,
        user_id: str = "user_demo",
        time_context: Optional[str] = None,
        as_of_valid_time: Optional[str] = None,
        as_of_assertion_time: Optional[str] = None,
    ) -> QueryIntent:
        """Decompose query into intent, target predicate, reference objects, and session scope."""
        cleaned = query.strip().lower()
        if not cleaned:
            return QueryIntent(
                raw_query=query,
                query_type="unknown",
                subject=user_id,
                predicate="unknown",
            )

        keywords, concepts, term_weights = extract_query_concepts(query)

        # -------------------------------------------------------------
        # Bi-Temporal Explicit Query Parameters
        # -------------------------------------------------------------
        if as_of_valid_time or as_of_assertion_time:
            return QueryIntent(
                raw_query=query,
                query_type="point_in_time_valid" if as_of_valid_time else "point_in_time_assertion",
                subject=user_id,
                predicate="lives_in",
                as_of_valid_time=as_of_valid_time,
                as_of_assertion_time=as_of_assertion_time,
                temporal_context=time_context,
                keywords=keywords,
                concepts=concepts,
                term_weights=term_weights,
            )

        # -------------------------------------------------------------
        # Bi-Temporal Point-in-Time Real-World Date Detection (e.g. "Where did I live in 2021?")
        # -------------------------------------------------------------
        pit_year_match = re.search(r"\b(in|during|around|back\s+in|as\s+of)\s+((?:19|20)\d{2})\b", cleaned)
        if pit_year_match and ("live" in cleaned or "city" in cleaned or "reside" in cleaned or "was my" in cleaned):
            target_year = pit_year_match.group(2)
            return QueryIntent(
                raw_query=query,
                query_type="point_in_time_valid",
                subject=user_id,
                predicate="lives_in",
                as_of_valid_time=f"{target_year}-06-01",
                temporal_context=time_context,
                keywords=keywords,
                concepts=concepts,
                term_weights=term_weights,
            )

        # -------------------------------------------------------------
        # Phase 2 Preserved: Session-scoped queries (e.g. "Where did I live in Session 01?")
        # -------------------------------------------------------------
        session_match = re.search(r"session\s*([0-9]+)", cleaned)
        if session_match:
            session_num = int(session_match.group(1))
            formatted_session_id = f"session_{session_num:02d}"
            return QueryIntent(
                raw_query=query,
                query_type="session_scoped",
                subject=user_id,
                predicate="lives_in",
                session_id=formatted_session_id,
                temporal_context=time_context,
                keywords=keywords,
                concepts=concepts,
                term_weights=term_weights,
            )

        # -------------------------------------------------------------
        # Phase 2 Preserved: Historical location queries ("before Hyderabad", "previously live in")
        # -------------------------------------------------------------
        if any(w in cleaned for w in ["before", "previously", "earlier", "prior", "past"]) and (
            "live" in cleaned or "city" in cleaned or "reside" in cleaned or "moved" in cleaned
        ):
            # Extract reference object if specified (e.g., "before Hyderabad")
            ref_match = re.search(r"before\s+([a-zA-Z]+)", query, re.IGNORECASE)
            ref_obj = ref_match.group(1) if ref_match else None
            return QueryIntent(
                raw_query=query,
                query_type="historical_state",
                subject=user_id,
                predicate="lives_in",
                reference_object=ref_obj,
                temporal_context=time_context,
                keywords=keywords,
                concepts=concepts,
                term_weights=term_weights,
            )

        # -------------------------------------------------------------
        # Phase 2 Preserved: Current location queries ("now", "currently", "where do i live")
        # -------------------------------------------------------------
        if (
            any(w in cleaned for w in ["now", "currently", "current", "present", "today"])
            and ("live" in cleaned or "city" in cleaned or "reside" in cleaned)
        ) or (
            "where do i live" in cleaned
            or "what city do i" in cleaned
            or "where do you live" in cleaned
            or cleaned == "where do i live now?"
            or cleaned == "where do i live now"
        ):
            return QueryIntent(
                raw_query=query,
                query_type="current_state",
                subject=user_id,
                predicate="lives_in",
                temporal_context=time_context,
                keywords=keywords,
                concepts=concepts,
                term_weights=term_weights,
            )

        # General location query fallback (defaults to current state if location-related)
        if "where do i live" in cleaned or "what city do i currently live in" in cleaned:
            return QueryIntent(
                raw_query=query,
                query_type="current_state",
                subject=user_id,
                predicate="lives_in",
                temporal_context=time_context,
                keywords=keywords,
                concepts=concepts,
                term_weights=term_weights,
            )

        # -------------------------------------------------------------
        # Phase 5 & 8: Open-Domain Temporal Query Analysis
        # -------------------------------------------------------------
        if concepts:
            return QueryIntent(
                raw_query=query,
                query_type="open_domain",
                subject=user_id,
                predicate="open_domain",
                temporal_context=time_context,
                keywords=keywords,
                concepts=concepts,
                term_weights=term_weights,
            )

        # Unknown / Empty query intent
        return QueryIntent(
            raw_query=query,
            query_type="unknown",
            subject=user_id,
            predicate="unknown",
            temporal_context=time_context,
        )
