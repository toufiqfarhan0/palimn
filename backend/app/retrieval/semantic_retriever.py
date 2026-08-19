"""Secondary semantic candidate discovery."""
from typing import List
from backend.app.memory.models import Fact


class SemanticRetriever:
    """Provides fallback semantic candidate retrieval when graph direct keys miss."""

    def __init__(self):
        pass

    async def search_candidates(self, query: str, limit: int = 10) -> List[Fact]:
        """Discover candidate facts via semantic matching."""
        return []
