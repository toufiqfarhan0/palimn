"""Revision and conflict detection engine."""
from typing import List, Optional, Tuple
from backend.app.memory.models import Fact, MemoryStatus


class RevisionEngine:
    """Detects when a new fact supersedes, contradicts, or refines an existing fact."""

    def evaluate_revision(
        self,
        new_fact: Fact,
        existing_facts: List[Fact],
    ) -> List[Tuple[str, str]]:  # (target_memory_id, relationship: 'SUPERSEDES' | 'CONTRADICTS')
        """Determine revision relationships between new fact and historical facts."""
        relations: List[Tuple[str, str]] = []
        for old_fact in existing_facts:
            if (
                old_fact.subject.lower() == new_fact.subject.lower()
                and old_fact.predicate.lower() == new_fact.predicate.lower()
                and old_fact.object.lower() != new_fact.object.lower()
                and old_fact.status == MemoryStatus.ACTIVE
            ):
                # By default, matching functional predicate with different object indicates supersession
                relations.append((old_fact.memory_id, "SUPERSEDES"))
        return relations
