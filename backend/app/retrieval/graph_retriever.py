"""Graph-native deterministic traversal and candidate retrieval via HydraDB."""
from typing import TYPE_CHECKING, Any, List, Optional, Tuple
import logging
from backend.app.memory.models import Fact, MemoryStatus
from backend.app.memory.fact_extractor import DeterministicFactExtractor
from backend.app.retrieval.candidate_retriever import CandidateRetriever
from backend.app.retrieval.query_analyzer import QueryIntent

if TYPE_CHECKING:
    from backend.app.hydra.client import HydraClient

logger = logging.getLogger("palimn.graph_retriever")


class GraphRetriever:
    """Traverses HydraDB temporal memory graph based on structured query intents."""

    def __init__(self, hydra_client: Any):
        self.hydra = hydra_client
        self.extractor = DeterministicFactExtractor()
        self.candidate_retriever = CandidateRetriever(self.hydra)

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

        elif intent.query_type == "open_domain":
            # 1. Retrieve top-k message candidates from HydraDB
            candidates = self.candidate_retriever.retrieve_candidate_messages(intent, top_k=20)
            if not candidates:
                return [], f"No relevant message candidates found for concepts: {intent.concepts}."

            # 2. Extract facts from candidate messages in ranked order
            extracted_facts: List[Fact] = []
            matching_message = None
            for cand in candidates:
                facts = self.extractor.extract_from_message(
                    content=cand.content,
                    session_id=cand.session_id,
                    message_id=cand.message_id,
                    timestamp=cand.timestamp,
                    role=cand.role,
                    subject=intent.subject,
                )
                if facts:
                    extracted_facts.extend(facts)
                    matching_message = cand
                    break

            if extracted_facts:
                primary_fact = extracted_facts[0]
                
                # Check for existing fact with same subject and predicate to manage temporal revision
                previous_active = await self.hydra.find_active_fact(primary_fact.subject, primary_fact.predicate)
                if previous_active and previous_active.object != primary_fact.object:
                    primary_fact.status = MemoryStatus.ACTIVE
                    previous_active.status = MemoryStatus.SUPERSEDED
                    previous_active.superseded_by = primary_fact.memory_id
                    primary_fact.valid_from = primary_fact.created_at
                    previous_active.valid_until = primary_fact.created_at
                    
                    # Update in-memory graph
                    self.hydra._in_memory_store.merge_node(previous_active.memory_id, "Fact", previous_active.model_dump())
                    self.hydra._in_memory_store.merge_edge(previous_active.memory_id, primary_fact.memory_id, "SUPERSEDES")

                # Merge Fact and Entity into graph store
                self.hydra._in_memory_store.merge_node(primary_fact.memory_id, "Fact", primary_fact.model_dump())
                entity_id = f"entity_{primary_fact.object.lower().replace(' ', '_')}"
                self.hydra._in_memory_store.merge_node(entity_id, "Entity", {
                    "id": entity_id,
                    "name": primary_fact.object,
                    "created_at": primary_fact.created_at,
                })
                self.hydra._in_memory_store.merge_edge(primary_fact.message_id, primary_fact.memory_id, "SUPPORTS")
                self.hydra._in_memory_store.merge_edge(primary_fact.memory_id, entity_id, "ABOUT")

                reasoning = (
                    f"Retrieved candidate message '{matching_message.message_id}' in '{matching_message.session_id}' "
                    f"(Score: {matching_message.score}) and extracted fact '{primary_fact.object}' "
                    f"for relationship '{primary_fact.predicate}'."
                )
                return [primary_fact], reasoning

            return [], f"No structured fact could be extracted from {len(candidates)} candidate messages."

        return [], "Unknown query intent."
