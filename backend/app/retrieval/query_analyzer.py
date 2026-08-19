"""Query decomposition and intent extraction."""
from typing import List, Optional
from pydantic import BaseModel


class QueryIntent(BaseModel):
    raw_query: str
    target_entities: List[str] = []
    target_predicates: List[str] = []
    temporal_anchor: Optional[str] = None
    query_type: str = "current_state"  # "current_state" | "historical_state" | "revision_history" | "temporal_relation" | "abstention_test"


class QueryAnalyzer:
    """Parses natural language questions into structured graph traversal intents."""

    def analyze(self, query: str) -> QueryIntent:
        """Decompose query into entities, predicates, and temporal intent."""
        return QueryIntent(raw_query=query)
