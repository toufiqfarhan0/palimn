"""Query decomposition and deterministic intent extraction for temporal memory."""
import re
from typing import List, Optional
from pydantic import BaseModel


class QueryIntent(BaseModel):
    raw_query: str
    query_type: str  # "current_state" | "historical_state" | "session_scoped" | "unknown"
    subject: str = "user_demo"
    predicate: str = "lives_in"
    target_entity: Optional[str] = None
    reference_object: Optional[str] = None
    session_id: Optional[str] = None
    temporal_anchor: Optional[str] = None


class QueryAnalyzer:
    """Parses natural language questions into structured graph traversal intents."""

    def analyze(self, query: str, user_id: str = "user_demo") -> QueryIntent:
        """Decompose query into intent, target predicate, reference objects, and session scope."""
        cleaned = query.strip().lower()

        # Check for Session-scoped query (e.g. "Where did I live in Session 01?", "Session 99", etc.)
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
            )

        # Check for Historical state queries ("before Hyderabad", "previously live in", "where did I live before")
        if any(w in cleaned for w in ["before", "previously", "earlier", "prior", "past"]):
            # Extract reference object if specified (e.g., "before Hyderabad")
            ref_match = re.search(r"before\s+([a-zA-Z]+)", query, re.IGNORECASE)
            ref_obj = ref_match.group(1) if ref_match else None
            return QueryIntent(
                raw_query=query,
                query_type="historical_state",
                subject=user_id,
                predicate="lives_in",
                reference_object=ref_obj,
            )

        # Check for Current state queries ("now", "currently", "where do i live", "what city do i currently live in")
        if any(w in cleaned for w in ["now", "currently", "current", "present", "today"]) or (
            "where do i live" in cleaned or "what city do i" in cleaned or "where do you live" in cleaned
        ):
            return QueryIntent(
                raw_query=query,
                query_type="current_state",
                subject=user_id,
                predicate="lives_in",
            )

        # General location query fallback (defaults to current state if location-related)
        if "live" in cleaned or "city" in cleaned or "reside" in cleaned:
            return QueryIntent(
                raw_query=query,
                query_type="current_state",
                subject=user_id,
                predicate="lives_in",
            )

        # Unknown / Unrecorded query intent
        return QueryIntent(
            raw_query=query,
            query_type="unknown",
            subject=user_id,
            predicate="unknown",
        )
