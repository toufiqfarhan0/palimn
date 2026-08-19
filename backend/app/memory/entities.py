"""Entity resolution and coreference management."""
from typing import Dict, List, Optional
from backend.app.memory.models import Entity


class EntityResolver:
    """Resolves entity mentions, aliases, and pronouns across sessions."""

    def __init__(self):
        self._entity_cache: Dict[str, Entity] = {}

    def resolve_entity(self, mention: str, context: Optional[str] = None) -> str:
        """Resolve mention to canonical entity key."""
        cleaned = mention.strip().lower()
        if cleaned in ("i", "me", "my", "myself", "user"):
            return "user"
        return mention.strip()
