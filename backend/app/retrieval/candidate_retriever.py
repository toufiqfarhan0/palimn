"""Deterministic candidate message retriever and transparent Top-K ranker."""
import logging
import re
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.retrieval.query_analyzer import QueryIntent
from backend.app.retrieval.query_normalizer import stem_token

if TYPE_CHECKING:
    from backend.app.hydra.client import HydraClient

logger = logging.getLogger("palimn.candidate_retriever")


class MessageCandidate(BaseModel):
    """Ranked message candidate with transparent scoring breakdown."""
    message_id: str
    session_id: str
    session_date: Optional[str] = None
    timestamp: Optional[str] = None
    role: str = "user"
    content: str
    score: float
    matched_terms: List[str] = Field(default_factory=list)
    score_breakdown: Dict[str, float] = Field(default_factory=dict)


class CandidateRetriever:
    """Retrieves and ranks candidate Message nodes from HydraDB graph store."""

    def __init__(self, hydra_client: Any):
        self.hydra = hydra_client

    async def retrieve_candidate_messages_async(
        self, intent: QueryIntent, top_k: int = 30
    ) -> List[MessageCandidate]:
        """Asynchronously fetch candidate messages from HydraDB Cloud or local store with transparent scoring."""
        # 1. Cloud Mode Retrieval Path
        if getattr(self.hydra, "mode", "local") == "cloud" and self.hydra.is_configured:
            query_str = intent.raw_query if len(intent.raw_query.split()) > 1 else (" ".join(intent.keywords + intent.concepts) or intent.raw_query)
            cloud_candidates = await self.hydra.cloud_store.query_candidates(
                query=query_str,
                user_id=intent.subject if (intent.subject and intent.subject != "user_demo") else None,
                max_results=top_k * 2,
            )
            if cloud_candidates:
                return self._score_candidates(cloud_candidates, intent, top_k)
            return []

        # 2. Local In-Memory Store Path (Unit Tests)
        return self.retrieve_candidate_messages(intent, top_k)

    def retrieve_candidate_messages(
        self, intent: QueryIntent, top_k: int = 30
    ) -> List[MessageCandidate]:
        """Synchronously fetch candidate messages from in-memory store matching query concepts."""
        store = self.hydra._in_memory_store
        
        raw_messages: List[Dict[str, Any]] = []
        target_user = intent.subject if (intent.subject and intent.subject != "user_demo") else None
        
        if target_user and target_user in store.messages_by_user:
            candidate_pool = store.messages_by_user[target_user]
        elif target_user and hasattr(store, "messages_by_question") and target_user.replace("user_", "") in store.messages_by_question:
            candidate_pool = store.messages_by_question[target_user.replace("user_", "")]
        elif hasattr(store, "all_messages") and store.all_messages:
            candidate_pool = store.all_messages
        else:
            candidate_pool = [
                n["properties"] for n in store.nodes.values() if n.get("label") == "Message"
            ]

        for props in candidate_pool:
            node_user = props.get("user_id") or props.get("question_id")
            if target_user and node_user:
                if node_user != target_user and node_user not in target_user and target_user not in node_user:
                    continue

            msg_time = props.get("timestamp")
            if intent.temporal_context and msg_time:
                if str(msg_time) > str(intent.temporal_context):
                    continue

            raw_messages.append(props)

        if not raw_messages:
            return []

        return self._score_candidates(raw_messages, intent, top_k)

    def _score_candidates(
        self, raw_messages: List[Dict[str, Any]], intent: QueryIntent, top_k: int
    ) -> List[MessageCandidate]:
        """Apply deterministic scoring, concept coverage bonus, and role multiplier."""
        query_keywords = intent.keywords
        query_concepts = intent.concepts
        term_weights = intent.term_weights

        candidates: List[MessageCandidate] = []
        target_user = intent.subject if (intent.subject and intent.subject != "user_demo") else None

        for msg in raw_messages:
            content = msg.get("content", "") or msg.get("text", "")
            content_lower = content.lower()
            tokens = re.findall(r"\b[a-zA-Z0-9_\$-]+\b", content_lower)
            stemmed_tokens = [stem_token(t) for t in tokens]
            
            # Exact matches
            exact_matches = [k for k in query_keywords if k in content_lower]
            exact_score = sum(term_weights.get(k, 1.0) * 2.5 for k in exact_matches)
            
            # Stemmed concept matches
            stem_matches = [c for c in query_concepts if c in stemmed_tokens]
            stem_score = sum(term_weights.get(c, 1.0) * 1.5 for c in set(stem_matches))
            
            # Matched terms set
            matched_terms = list(set(exact_matches + stem_matches))
            
            # Distinct concept coverage bonus
            coverage_bonus = len(set(stem_matches)) * 1.5
            
            # Base cloud relevancy score (when candidate was retrieved from HydraDB Cloud)
            cloud_relevancy = float(msg.get("score", 0.0)) * 5.0
            
            # User authorship priority (boost user messages significantly)
            role = str(msg.get("role", "user")).lower()
            role_mult = 2.5 if role == "user" else 0.8

            raw_total = (exact_score + stem_score + coverage_bonus + cloud_relevancy) * role_mult
            
            if raw_total >= 1.0 or len(raw_messages) <= 30:
                score_val = max(raw_total, 0.5)
                breakdown = {
                    "exact_score": round(exact_score, 2),
                    "stem_score": round(stem_score, 2),
                    "coverage_bonus": round(coverage_bonus, 2),
                    "role_multiplier": role_mult,
                }
                candidates.append(
                    MessageCandidate(
                        message_id=msg.get("id") or msg.get("message_id") or "unknown_msg",
                        session_id=msg.get("session_id", "unknown_sess"),
                        session_date=msg.get("timestamp") or msg.get("session_date"),
                        timestamp=msg.get("timestamp"),
                        role=role,
                        content=content,
                        score=round(score_val, 2),
                        matched_terms=matched_terms,
                        score_breakdown=breakdown,
                    )
                )

        # Sort descending by score, prioritizing user turns
        candidates.sort(key=lambda c: (c.role == "user", c.score), reverse=True)
        return candidates[:top_k]
