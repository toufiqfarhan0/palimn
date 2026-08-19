"""Evidence aggregation and provenance bundling."""
from typing import List
from backend.app.memory.models import Fact, EvidenceItem


class EvidenceAggregator:
    """Builds validated provenance evidence packets for answer generation and abstention."""

    def bundle_evidence(self, facts: List[Fact]) -> List[EvidenceItem]:
        """Convert Facts into verified EvidenceItems."""
        return [
            EvidenceItem(
                memory_id=f.memory_id,
                subject=f.subject,
                predicate=f.predicate,
                object=f.object,
                session_id=f.session_id,
                message_id=f.message_id,
                status=f.status,
                confidence=f.confidence,
                valid_from=f.valid_from,
                valid_until=f.valid_until,
                provenance_text=f.provenance.snippet if f.provenance else None,
            )
            for f in facts
        ]
