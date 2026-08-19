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

    def retrieve_candidate_messages(
        self, intent: QueryIntent, top_k: int = 20
    ) -> List[MessageCandidate]:
        """Fetch candidate messages matching query concepts with transparent scoring."""
        all_nodes = self.hydra._in_memory_store.nodes.values()
        
        # 1. Collect all message nodes
        raw_messages: List[Dict[str, Any]] = []
        for node in all_nodes:
            if node.get("label") == "Message":
                props = node.get("properties", {})
                
                # Check user ownership if node tagged with user/question_id
                node_user = props.get("user_id") or props.get("question_id")
                # If question belongs to a specific user, ensure message matches
                if intent.subject and intent.subject.startswith("user_") and node_user:
                    if node_user not in intent.subject and intent.subject not in node_user:
                        continue

                msg_time = props.get("timestamp")
                # Temporal filtering: message must not be in the future relative to query time context
                if intent.temporal_context and msg_time:
                    # Normal string comparison on ISO format timestamps YYYY-MM-DDTHH:MM:SS
                    if str(msg_time) > str(intent.temporal_context):
                        continue

                raw_messages.append(props)

        if not raw_messages:
            return []

        # 2. Score candidate messages deterministically
        query_keywords = intent.keywords
        query_concepts = intent.concepts
        term_weights = intent.term_weights

        candidates: List[MessageCandidate] = []

        for msg in raw_messages:
            content = msg.get("content", "")
            content_lower = content.lower()
            tokens = re.findall(r"\b[a-zA-Z0-9_\$-]+\b", content_lower)
            stemmed_tokens = [stem_token(t) for t in tokens]
            
            # Exact matches
            exact_matches = [k for k in query_keywords if k in content_lower]
            exact_score = sum(term_weights.get(k, 1.0) * 2.0 for k in exact_matches)
            
            # Stemmed concept matches
            stem_matches = [c for c in query_concepts if c in stemmed_tokens]
            stem_score = sum(term_weights.get(c, 1.0) * 1.5 for c in set(stem_matches))
            
            # Matched terms set
            matched_terms = list(set(exact_matches + stem_matches))
            
            # Distinct concept coverage bonus
            coverage_bonus = len(set(stem_matches)) * 1.0
            
            # User authorship priority
            role = str(msg.get("role", "user")).lower()
            role_mult = 1.5 if role == "user" else 1.0

            raw_total = (exact_score + stem_score + coverage_bonus) * role_mult
            
            if raw_total >= 1.0:
                breakdown = {
                    "exact_score": round(exact_score, 2),
                    "stem_score": round(stem_score, 2),
                    "coverage_bonus": round(coverage_bonus, 2),
                    "role_multiplier": role_mult,
                }
                candidates.append(
                    MessageCandidate(
                        message_id=msg.get("id", "unknown_msg"),
                        session_id=msg.get("session_id", "unknown_sess"),
                        session_date=msg.get("timestamp"),
                        timestamp=msg.get("timestamp"),
                        role=role,
                        content=content,
                        score=round(raw_total, 2),
                        matched_terms=matched_terms,
                        score_breakdown=breakdown,
                    )
                )

        # 3. Sort descending by score
        candidates.sort(key=lambda c: c.score, reverse=True)
        return candidates[:top_k]
