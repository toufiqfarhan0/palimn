"""Temporal filtering, revision resolution, and chronological ranking."""
from typing import List, Optional
from backend.app.memory.models import Fact, MemoryStatus
from backend.app.retrieval.query_analyzer import QueryIntent


class TemporalRanker:
    """Ranks and filters facts based on validity time windows and revision supersession."""

    def filter_and_rank(
        self,
        facts: List[Fact],
        intent: QueryIntent,
        as_of_time: Optional[str] = None,
    ) -> List[Fact]:
        """Apply temporal consistency and revision resolution to fact candidates."""
        # If intent is current state, filter for active facts
        if intent.query_type == "current_state":
            return [f for f in facts if f.status == MemoryStatus.ACTIVE]
        return facts
