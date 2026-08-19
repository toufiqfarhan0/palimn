"""Graph-native deterministic traversal and candidate retrieval via HydraDB."""
from typing import TYPE_CHECKING, Any, List, Optional, Tuple
import logging
from backend.app.memory.models import Fact, MemoryStatus
from backend.app.retrieval.query_analyzer import QueryIntent

if TYPE_CHECKING:
    from backend.app.hydra.client import HydraClient

logger = logging.getLogger("palimn.graph_retriever")


class GraphRetriever:
    """Traverses HydraDB temporal memory graph based on structured query intents."""

    def __init__(self, hydra_client: Any):
        self.hydra = hydra_client

    async def retrieve_candidates(self, intent: QueryIntent) -> Tuple[List[Fact], Optional[str]]:
        """Fetch candidate facts and revision explanation based on query intent.
        
        Returns:
            Tuple of (facts_list, reasoning_summary)
        """
        if intent.query_type == "current_state":
            fact = await self.hydra.find_active_fact(intent.subject, intent.predicate)
            if fact:
                reasoning = (
                    f"Identified current active fact '{fact.memory_id}' ({fact.subject} {fact.predicate} {fact.object}) "
                    f"valid from {fact.valid_from or 'origin'} with status '{fact.status.value}'."
                )
                return [fact], reasoning
            return [], "No active memory fact found for the requested entity."

        elif intent.query_type == "historical_state":
            historical_fact = await self.hydra.find_historical_fact(
                intent.subject, intent.predicate, intent.reference_object
            )
            if historical_fact:
                reasoning = (
                    f"Followed SUPERSEDES revision lineage backwards to historical fact '{historical_fact.memory_id}' "
                    f"({historical_fact.subject} {historical_fact.predicate} {historical_fact.object}) "
                    f"valid from {historical_fact.valid_from} until {historical_fact.valid_until or 'invalidation'}."
                )
                return [historical_fact], reasoning
            return [], "No historical/superseded memory found in the revision lineage."

        elif intent.query_type == "session_scoped":
            if not intent.session_id:
                return [], "Missing target session ID."
            fact = await self.hydra.find_fact_by_session(
                intent.subject, intent.predicate, intent.session_id
            )
            if fact:
                reasoning = (
                    f"Found memory fact '{fact.memory_id}' recorded in '{intent.session_id}' "
                    f"({fact.subject} {fact.predicate} {fact.object}) with status '{fact.status.value}'."
                )
                return [fact], reasoning
            return [], f"No memory record found for session '{intent.session_id}'."

        return [], "Unknown query intent."
