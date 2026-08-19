"""Fact and entity extraction pipeline for PALIMN memory ingestion."""
from typing import List, Optional
import logging
from backend.app.memory.models import Fact, IngestMessage, MemoryStatus

logger = logging.getLogger("palimn.extractor")


class FactExtractor:
    """Extracts structured facts with temporal grounding from conversation messages."""

    def __init__(self):
        pass

    async def extract_facts_from_messages(
        self,
        session_id: str,
        messages: List[IngestMessage],
        session_timestamp: Optional[str] = None,
    ) -> List[Fact]:
        """Extract temporal facts from a list of session messages."""
        facts: List[Fact] = []
        # Fact extraction pipeline will be connected in subsequent phases
        return facts
