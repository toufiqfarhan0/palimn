"""Graph-native deterministic traversal, memory composition, and retrieval via HydraDB."""
from typing import TYPE_CHECKING, Any, List, Optional, Tuple
import logging
from backend.app.memory.models import Fact, FactCandidate, MemoryStatus
from backend.app.memory.fact_extractor import DeterministicFactExtractor
from backend.app.memory.generalized_extractor import GeneralizedMemoryExtractor
from backend.app.memory.composer import MemoryComposer
from backend.app.memory.temporal_resolver import TemporalResolver
from backend.app.retrieval.candidate_retriever import CandidateRetriever
from backend.app.retrieval.query_analyzer import QueryIntent

if TYPE_CHECKING:
    from backend.app.hydra.client import HydraClient

logger = logging.getLogger("palimn.graph_retriever")


class GraphRetriever:
    """Traverses HydraDB temporal memory graph, extracts MemoryUnits, and resolves composed facts."""

    def __init__(self, hydra_client: Any):
        self.hydra = hydra_client
        self.extractor = DeterministicFactExtractor()
        self.generalized_extractor = GeneralizedMemoryExtractor()
        self.composer = MemoryComposer()
        self.temporal_resolver = TemporalResolver()
        self.candidate_retriever = CandidateRetriever(self.hydra)

    async def retrieve_candidates(
        self,
        intent: QueryIntent,
        candidates: Optional[List[Any]] = None,
        **query_kwargs: Any,
    ) -> Tuple[List[Fact], Optional[str]]:
        """Fetch candidate facts and revision explanation based on query intent.
        
        Returns:
            Tuple of (facts_list, reasoning_summary)
        """
        # 1. Direct Graph State Traversal (Phase 2 Pre-Seeded Synthetics for local unit tests)
        if getattr(self.hydra, "mode", "local") == "local":
            if intent.query_type == "point_in_time_valid" or intent.as_of_valid_time:
                fact = await self.hydra.find_bi_temporal_fact(
                    intent.subject,
                    intent.predicate,
                    as_of_valid_time=intent.as_of_valid_time,
                    as_of_assertion_time=intent.as_of_assertion_time,
                )
                if fact:
                    reasoning = (
                        f"Bi-temporal point-in-time resolution located fact '{fact.memory_id}' "
                        f"({fact.subject} {fact.predicate} {fact.object}) valid from {fact.valid_from} "
                        f"until {fact.valid_until or 'present'} (asserted: {fact.asserted_at or 'origin'})."
                    )
                    return [fact], reasoning
                return [], f"No memory fact was valid for '{intent.subject}' at world time '{intent.as_of_valid_time}'."

            elif intent.query_type == "point_in_time_assertion" or intent.as_of_assertion_time:
                fact = await self.hydra.find_fact_as_of_assertion_time(
                    intent.subject, intent.predicate, assertion_time=intent.as_of_assertion_time or "2025-01-10"
                )
                if fact:
                    reasoning = (
                        f"Assertion-time state reconstruction located fact '{fact.memory_id}' "
                        f"({fact.subject} {fact.predicate} {fact.object}) known to the agent prior to {intent.as_of_assertion_time}."
                    )
                    return [fact], reasoning
                return [], f"No memory fact was known to the agent prior to '{intent.as_of_assertion_time}'."

            elif intent.query_type == "current_state":
                fact = await self.hydra.find_active_fact(intent.subject, intent.predicate)
                if fact:
                    reasoning = (
                        f"Identified current active fact '{fact.memory_id}' ({fact.subject} {fact.predicate} {fact.object}) "
                        f"valid from {fact.valid_from or 'origin'} with status '{fact.status.value}'."
                    )
                    return [fact], reasoning

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

            elif intent.query_type == "session_scoped":
                if intent.session_id:
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
                return [], "Missing target session ID."

        # 2. Retrieve Candidate Messages if not already provided
        if candidates is None:
            candidates = await self.candidate_retriever.retrieve_candidate_messages_async(
                intent, top_k=20, **query_kwargs
            )
        if not candidates:
            return [], f"No relevant message candidates found for concepts: {intent.concepts}."

        # 3. Generalized Memory Unit Extraction
        all_units = []
        all_fact_candidates: List[FactCandidate] = []

        for cand in candidates:
            units = self.generalized_extractor.extract_memory_units(
                content=cand.content,
                session_id=cand.session_id,
                message_id=cand.message_id,
                timestamp=cand.timestamp,
                role=cand.role,
                default_subject=intent.subject,
            )
            all_units.extend(units)
            for u in units:
                all_fact_candidates.append(
                    FactCandidate(
                        subject=u.subject,
                        predicate=u.predicate_or_event,
                        object=u.value or u.object or "",
                        qualifiers=u.qualifiers,
                        entities=u.entities,
                        source_message_id=u.source_message_id,
                        source_session_id=u.source_session_id,
                        source_timestamp=u.source_timestamp,
                        confidence=u.confidence,
                        extraction_pattern=u.unit_type.value,
                        evidence_span=u.evidence_span,
                    )
                )

        # 4. Cross-Message & Cross-Session Memory Composition
        if all_units:
            composed_cands = self.composer.compose_units(
                units=all_units,
                query_text=intent.raw_query,
                query_subject=intent.subject,
            )
            all_fact_candidates.extend(composed_cands)

        # 5. Legacy Regex Fallback if zero candidates
        if not all_fact_candidates:
            for cand in candidates:
                legacy_facts = self.extractor.extract_from_message(
                    content=cand.content,
                    session_id=cand.session_id,
                    message_id=cand.message_id,
                    timestamp=cand.timestamp,
                    role=cand.role,
                    subject=intent.subject,
                )
                for lf in legacy_facts:
                    all_fact_candidates.append(
                        FactCandidate(
                            subject=lf.subject,
                            predicate=lf.predicate,
                            object=lf.object,
                            source_message_id=lf.message_id,
                            source_session_id=lf.session_id,
                            source_timestamp=lf.created_at,
                            confidence=lf.confidence,
                            extraction_pattern="legacy_regex",
                            evidence_span=cand.content[:200],
                        )
                    )

        if not all_fact_candidates:
            return [], f"No structured fact candidates extracted from {len(candidates)} candidate messages."

        # 6. Deterministic Temporal Resolution
        resolution = self.temporal_resolver.resolve_facts_for_query(all_fact_candidates, intent)
        if resolution.decision == "answerable" and resolution.facts:
            primary_fact = resolution.facts[0]
            
            # Persist derived fact and entity into HydraDB graph store
            self.hydra._in_memory_store.merge_node(primary_fact.memory_id, "Fact", primary_fact.model_dump())
            clean_entity_name = primary_fact.object.lower().replace(" ", "_").replace("$", "usd_")
            entity_id = f"entity_{clean_entity_name}"
            self.hydra._in_memory_store.merge_node(entity_id, "Entity", {
                "id": entity_id,
                "name": primary_fact.object,
                "created_at": primary_fact.created_at,
            })
            self.hydra._in_memory_store.merge_edge(primary_fact.message_id, primary_fact.memory_id, "SUPPORTS")
            self.hydra._in_memory_store.merge_edge(primary_fact.memory_id, entity_id, "ABOUT")

            # Check if there is an existing older fact with the same predicate to link SUPERSEDES
            for existing_id, node_data in self.hydra._in_memory_store.nodes.items():
                if node_data.get("label") == "Fact" and existing_id != primary_fact.memory_id:
                    props = node_data.get("properties", {})
                    if props.get("subject") == primary_fact.subject and props.get("predicate") == primary_fact.predicate:
                        # Link newer fact to older fact with SUPERSEDES edge
                        self.hydra._in_memory_store.merge_edge(primary_fact.memory_id, existing_id, "SUPERSEDES")

            return [primary_fact], resolution.reasoning

        return [], resolution.reasoning or "Abstained due to insufficient or conflicting evidence."
