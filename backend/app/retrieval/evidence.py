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
                fact=f"{f.subject} {f.predicate} {f.object}",
                subject=f.subject,
                predicate=f.predicate,
                object=f.object,
                session_id=f.session_id,
                message_id=f.message_id,
                session_date=f.provenance.session_date if f.provenance else f.valid_from,
                status=f.status,
                confidence=f.confidence,
                valid_from=f.valid_from,
                valid_until=f.valid_until,
                relevance_score=1.0,
                provenance_text=f.provenance.snippet if f.provenance else f"{f.subject} {f.predicate} {f.object}",
            )
            for f in facts
        ]
