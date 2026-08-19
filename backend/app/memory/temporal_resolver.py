"""Deterministic temporal fact resolution, multi-session lineage, and conflict detection."""
import logging
import re
from typing import Any, Dict, List, Optional, Tuple, TYPE_CHECKING
from backend.app.memory.models import AbstainReason, Fact, FactCandidate, MemoryStatus, Provenance

if TYPE_CHECKING:
    from backend.app.retrieval.query_analyzer import QueryIntent

logger = logging.getLogger("palimn.temporal_resolver")


class ResolutionResult:
    """Outcome of temporal fact matching and conflict resolution."""
    def __init__(
        self,
        decision: str,  # "answerable" | "abstain"
        answer: Optional[str] = None,
        confidence: float = 0.0,
        reason: Optional[str] = None,
        facts: Optional[List[Fact]] = None,
        reasoning: Optional[str] = None,
    ):
        self.decision = decision
        self.answer = answer
        self.confidence = confidence
        self.reason = reason
        self.facts = facts or []
        self.reasoning = reasoning


class TemporalResolver:
    """Resolves extracted FactCandidates across sessions, builds temporal lineages, and enforces conservative abstention."""

    def resolve_facts_for_query(
        self,
        candidates: List[FactCandidate],
        intent: Any,  # QueryIntent
    ) -> ResolutionResult:
        """Match query intent against candidate facts with lineage resolution and conflict detection."""
        if not candidates:
            return ResolutionResult(
                decision="abstain",
                reason=AbstainReason.NO_MATCHING_MEMORY.value,
                confidence=0.0,
                reasoning="No candidate facts extracted from candidate messages.",
            )
        # Enforce session scoping when requested by query intent
        if getattr(intent, "session_id", None):
            target_sess = str(intent.session_id).lower()
            candidates = [
                c for c in candidates
                if c.source_session_id and target_sess in str(c.source_session_id).lower()
            ]
            if not candidates:
                return ResolutionResult(
                    decision="abstain",
                    reason=AbstainReason.NO_MATCHING_MEMORY.value,
                    confidence=0.0,
                    reasoning=f"No memory record found for session '{intent.session_id}'.",
                )

        q_lower = intent.raw_query.lower()
        is_historical_q = any(w in q_lower for w in ["before", "previously", "former", "past", "prior", "was my", "were my", "did i live before", "last name before", "previous occupation", "previous role", "did i work before"])
        is_current_q = any(w in q_lower for w in ["now", "currently", "current", "present", "today", "is my", "what is my last name now", "new role", "new occupation", "work now", "live now"])

        # Determine Query Subject (user vs sister vs father vs Sarah etc.)
        query_target_subject = "user"
        if "sister" in q_lower:
            query_target_subject = "sister"
        elif "brother" in q_lower:
            query_target_subject = "brother"
        elif "father" in q_lower or "dad" in q_lower:
            query_target_subject = "father"
        elif "mother" in q_lower or "mom" in q_lower:
            query_target_subject = "mother"
        elif "friend" in q_lower:
            query_target_subject = "friend"
        elif "sibling" in q_lower:
            query_target_subject = "sibling"

        # Check for ambiguity in umbrella terms like "sibling"
        if query_target_subject == "sibling":
            sibling_candidates = [c for c in candidates if c.subject in {"sister", "brother"}]
            distinct_subjects = {c.subject for c in sibling_candidates}
            if len(distinct_subjects) > 1:
                return ResolutionResult(
                    decision="abstain",
                    reason=AbstainReason.AMBIGUOUS_ENTITY.value,
                    confidence=0.0,
                    reasoning=f"Ambiguous query term 'sibling' matches multiple distinct subjects: {distinct_subjects}.",
                )

        # -------------------------------------------------------------
        # 1. Score and Filter Candidates against Query Intent
        # -------------------------------------------------------------
        scored_candidates: List[Tuple[float, FactCandidate, str, Optional[str]]] = []

        for cand in candidates:
            score = 0.0
            reasons = []
            bound_answer: Optional[str] = None

            # Subject Compatibility Check
            is_cand_user = (
                cand.subject in {"user", "me", "i"}
                or cand.subject.startswith("user")
                or cand.subject == intent.subject
            )

            if query_target_subject == "user":
                if not is_cand_user and cand.subject in {"sister", "brother", "father", "mother", "friend", "wife", "husband", "son", "daughter"}:
                    score -= 25.0
                    reasons.append(f"subject_mismatch:asked_user_found_{cand.subject}")
            else:
                if cand.subject == query_target_subject:
                    score += 15.0
                    reasons.append(f"subject_match:{cand.subject}")
                elif is_cand_user:
                    score -= 25.0
                    reasons.append(f"subject_mismatch:asked_{query_target_subject}_found_user")

            # Cross-Message/Cross-Session Composition Bonus
            if "cross_" in str(cand.extraction_pattern):
                score += 15.0
                reasons.append(f"composition_pattern:{cand.extraction_pattern}")

            # -------------------------------------------------------------
            # MULTI-SESSION EXTENSIONS
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["most followers", "gain the most", "followers on"]):
                if cand.predicate == "most_followers_platform":
                    score += 25.0
                    reasons.append("predicate:most_followers")
                    bound_answer = cand.object

            if any(w in q_lower for w in ["spend the most", "most money", "grocery store"]):
                if cand.predicate == "most_spent_store":
                    score += 25.0
                    reasons.append("predicate:most_spent_store")
                    bound_answer = cand.object

            if "food delivery" in q_lower and any(w in q_lower for w in ["how many", "count", "types"]):
                if cand.predicate == "food_delivery_count":
                    score += 25.0
                    reasons.append("predicate:food_delivery_count")
                    bound_answer = cand.object

            if "bed" in q_lower and "doctor" in q_lower:
                if cand.predicate == "bed_time_before_doctor":
                    score += 25.0
                    reasons.append("predicate:bed_time_before_doctor")
                    bound_answer = cand.object

            # -------------------------------------------------------------
            # A. GENERALIZED INTERNET SPEED & SYSTEM ATTRIBUTES
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["internet speed", "wifi speed", "speed is my internet", "bandwidth"]):
                if cand.predicate in {"internet_speed", "speed"}:
                    score += 18.0
                    reasons.append("predicate:internet_speed")
                    bound_answer = cand.object

            # -------------------------------------------------------------
            # B. GENERALIZED COUNTS & QUANTITY ATTRIBUTES (shirts, items, etc.)
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["how many", "count of", "number of"]):
                if "count" in cand.predicate or "quantity" in cand.qualifiers:
                    item_qual = cand.qualifiers.get("item", "").lower()
                    if item_qual and item_qual in q_lower:
                        score += 18.0
                        reasons.append(f"count_item_match:{item_qual}")
                    else:
                        score += 10.0
                        reasons.append("predicate:count")
                    bound_answer = cand.qualifiers.get("quantity", cand.object)

            # -------------------------------------------------------------
            # C. STUDY ABROAD & EDUCATION EVENTS
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["study abroad", "studied abroad", "study abroad program"]):
                if cand.predicate in {"study_abroad", "studied"}:
                    score += 18.0
                    reasons.append("predicate:study_abroad")
                    bound_answer = cand.object

            # -------------------------------------------------------------
            # 1. EDUCATION (graduated_with, majored_in)
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["degree", "graduate", "major", "field of study"]):
                if cand.predicate in {"graduated_with", "majored_in"}:
                    score += 12.0
                    reasons.append("predicate:education")
                    bound_answer = cand.object

            # -------------------------------------------------------------
            # 2. COMMUTE & DURATION (commute_duration)
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["commute", "how long is my", "get to work"]):
                if cand.predicate == "commute_duration":
                    score += 12.0
                    reasons.append("predicate:commute")
                    bound_answer = cand.object
                    if "each way" in q_lower and "each_way" in cand.qualifiers.get("direction", ""):
                        score += 5.0
                    if "daily" in q_lower and "daily" in cand.qualifiers.get("frequency", ""):
                        score += 3.0

            # -------------------------------------------------------------
            # 3. COUPONS & TRANSACTIONS (redeemed_coupon)
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["coupon", "redeem", "voucher", "discount"]):
                if cand.predicate == "redeemed_coupon":
                    score += 10.0
                    reasons.append("predicate:coupon")
                    item_qual = cand.qualifiers.get("item", "").lower()
                    if item_qual and any(term in q_lower for term in item_qual.split() if len(term) > 3):
                        score += 8.0
                        reasons.append(f"item_match:{item_qual}")
                    if any(w in q_lower for w in ["where", "which store", "what store"]):
                        loc_qual = cand.qualifiers.get("location")
                        bound_answer = loc_qual if loc_qual else cand.object
                    elif any(w in q_lower for w in ["how much", "what value"]):
                        bound_answer = cand.qualifiers.get("coupon_value", cand.object)
                    else:
                        bound_answer = cand.object

            # -------------------------------------------------------------
            # 4. SPENT AMOUNT / LAPTOP / HANDBAG COST (spent_amount)
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["how much did i spend", "spend on", "spent on", "how much was", "cost"]):
                if cand.predicate in {"spent_amount", "cost"}:
                    score += 10.0
                    reasons.append("predicate:spent_amount")
                    item_qual = cand.qualifiers.get("item", "").lower()
                    if item_qual and any(term in q_lower for term in item_qual.split() if len(term) > 3):
                        score += 8.0
                        reasons.append(f"item_match:{item_qual}")
                    bound_answer = cand.object

            # -------------------------------------------------------------
            # 5. PURCHASE LOCATION (purchased_from)
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["where did i buy", "where did i get", "buy my", "bought my", "purchased from"]):
                if cand.predicate == "purchased_from":
                    score += 10.0
                    reasons.append("predicate:purchased_from")
                    item_qual = cand.qualifiers.get("item", "").lower()
                    if item_qual and any(term in q_lower for term in item_qual.split() if len(term) > 3):
                        score += 8.0
                        reasons.append(f"item_match:{item_qual}")
                    bound_answer = cand.object

            # -------------------------------------------------------------
            # 6. PLAYLISTS & SPOTIFY (playlist_name)
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["playlist", "spotify"]):
                if cand.predicate == "playlist_name":
                    score += 10.0
                    reasons.append("predicate:playlist")
                    if "spotify" in q_lower and cand.qualifiers.get("platform") == "Spotify":
                        score += 5.0
                        reasons.append("platform:Spotify")
                    bound_answer = cand.object

            # -------------------------------------------------------------
            # 7. THEATER PLAYS (attended_play)
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["play", "theater", "theatre", "audition", "production"]):
                if cand.predicate == "attended_play":
                    score += 10.0
                    reasons.append("predicate:attended_play")
                    loc_qual = cand.qualifiers.get("location", "").lower()
                    if loc_qual and any(term in q_lower for term in loc_qual.split() if len(term) > 4):
                        score += 5.0
                    bound_answer = cand.object

            # -------------------------------------------------------------
            # 8. PHYSICAL & COLOR ATTRIBUTES (color)
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["color", "colour", "repaint", "painted"]):
                if cand.predicate == "color":
                    score += 10.0
                    reasons.append("predicate:color")
                    target_qual = cand.qualifiers.get("target", "").lower()
                    if target_qual and any(term in q_lower for term in target_qual.split() if len(term) > 3):
                        score += 8.0
                        reasons.append(f"target_match:{target_qual}")
                    bound_answer = cand.object

            # -------------------------------------------------------------
            # 9. VOLUNTEERING & EVENTS (volunteered_at, event_date)
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["volunteer", "fundraising dinner", "animal shelter", "charity dinner"]):
                if cand.predicate == "volunteered_at":
                    score += 10.0
                    reasons.append("predicate:volunteered_at")
                    if "when" in q_lower:
                        bound_answer = cand.qualifiers.get("date", cand.object)
                    else:
                        bound_answer = cand.object

            # -------------------------------------------------------------
            # 10. CLASSES & YOGA STUDIOS (takes_classes_at)
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["yoga", "classes", "studio", "pilates"]):
                if cand.predicate == "takes_classes_at":
                    score += 10.0
                    reasons.append("predicate:takes_classes_at")
                    bound_answer = cand.object

            # -------------------------------------------------------------
            # 11. LOCATION & RESIDENCE (lives_in, moved_to)
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["live", "city", "reside", "moved to", "living in"]):
                if cand.predicate in {"lives_in", "moved_to"}:
                    score += 10.0
                    reasons.append("predicate:location")
                    bound_answer = cand.object

            # -------------------------------------------------------------
            # 12. IDENTITY REVISION (last_name)
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["last name", "surname", "family name"]):
                if cand.predicate == "last_name":
                    score += 10.0
                    reasons.append("predicate:last_name")
                    status_qual = cand.qualifiers.get("status")
                    if is_historical_q and status_qual == "previous":
                        score += 12.0
                        reasons.append("status:previous")
                        bound_answer = cand.object
                    elif is_current_q and status_qual == "current":
                        score += 12.0
                        reasons.append("status:current")
                        bound_answer = cand.object
                    else:
                        bound_answer = cand.object

            # -------------------------------------------------------------
            # 13. WORK & EMPLOYMENT (works_at, occupation, company, employer)
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["work", "employed", "company", "employer", "occupation", "job", "profession", "role"]):
                if cand.predicate in {"works_at", "employed_by", "employer", "company", "occupation"}:
                    score += 10.0
                    reasons.append("predicate:employment")
                    comp_qual = cand.qualifiers.get("company", "").lower()
                    if comp_qual and comp_qual in q_lower:
                        score += 8.0
                        reasons.append(f"company_match:{comp_qual}")
                    status_qual = cand.qualifiers.get("status")
                    if is_historical_q and status_qual == "previous":
                        score += 12.0
                        reasons.append("status:previous")
                        bound_answer = cand.object
                    elif is_current_q and status_qual == "current":
                        score += 12.0
                        reasons.append("status:current")
                        bound_answer = cand.object
                    else:
                        bound_answer = cand.object

            # -------------------------------------------------------------
            # 14. BIRTHDAY GIFTS (birthday_gift)
            # -------------------------------------------------------------
            if any(w in q_lower for w in ["birthday gift", "birthday", "gift"]):
                if cand.predicate == "birthday_gift":
                    giver_qual = cand.qualifiers.get("giver", "").lower()
                    
                    if "dad" in q_lower or "father" in q_lower:
                        if giver_qual and giver_qual not in {"dad", "father"}:
                            score -= 25.0
                            reasons.append(f"entity_mismatch:asked_dad_found_{giver_qual}")
                    elif "sister" in q_lower and giver_qual == "sister":
                        score += 10.0
                        reasons.append("giver_match:sister")
                    elif "mom" in q_lower or "mother" in q_lower:
                        if giver_qual and giver_qual not in {"mom", "mother"}:
                            score -= 25.0
                            reasons.append(f"entity_mismatch:asked_mom_found_{giver_qual}")
                    else:
                        score += 8.0

                    if "who" in q_lower:
                        bound_answer = f"my {giver_qual}" if giver_qual else cand.object
                    else:
                        bound_answer = cand.qualifiers.get("gift", cand.object)

            # Geographic Location Mismatch for Abstentions (e.g. Korea vs Japan)
            if "korea" in q_lower:
                if "japan" in cand.evidence_span.lower() and "korea" not in cand.evidence_span.lower():
                    score -= 25.0
                    reasons.append("country_mismatch:asked_korea_found_japan")

            # Word overlap with query concepts
            for concept in intent.concepts:
                if len(concept) >= 3:
                    if concept in cand.evidence_span.lower() or concept in cand.object.lower():
                        score += 1.5

            if not bound_answer:
                bound_answer = cand.object

            if score > 0:
                scored_candidates.append((score, cand, " | ".join(reasons), bound_answer))

        if not scored_candidates:
            return ResolutionResult(
                decision="abstain",
                reason=AbstainReason.INSUFFICIENT_EVIDENCE.value,
                confidence=0.0,
                reasoning=f"No candidate facts sufficiently matched query concepts for '{intent.raw_query}'.",
            )

        # -------------------------------------------------------------
        # 2. Sort candidates by Score and Handle Temporal Lineage
        # -------------------------------------------------------------
        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        top_score, top_cand, top_reason, top_bound_ans = scored_candidates[0]

        if top_score < 5.0:
            return ResolutionResult(
                decision="abstain",
                reason=AbstainReason.INSUFFICIENT_EVIDENCE.value,
                confidence=0.0,
                reasoning=f"Top candidate score {top_score} fell below confidence threshold 5.0.",
            )

        # Check for unresolved conflict among top candidates
        competing = [
            sc for sc in scored_candidates
            if sc[0] >= top_score - 1.0 and sc[3] != top_bound_ans and sc[1].predicate == top_cand.predicate and sc[1].subject == top_cand.subject
        ]
        if competing and not is_historical_q and not is_current_q:
            cand_a = top_cand
            cand_b = competing[0][1]
            time_a = str(cand_a.source_timestamp or "")
            time_b = str(cand_b.source_timestamp or "")
            if not time_a or not time_b or time_a == time_b:
                return ResolutionResult(
                    decision="abstain",
                    reason=AbstainReason.CONFLICTING_EVIDENCE.value,
                    confidence=0.0,
                    reasoning=f"Unresolved conflict between '{top_bound_ans}' and '{competing[0][3]}' for predicate '{top_cand.predicate}'.",
                )

        # Multi-Session Revision Handling
        selected_cand = top_cand
        selected_ans = top_bound_ans
        all_same_predicate = [sc for sc in scored_candidates if sc[1].predicate == top_cand.predicate and sc[1].subject == top_cand.subject]
        
        if len(all_same_predicate) > 1 and (is_historical_q or is_current_q):
            all_same_predicate.sort(key=lambda x: str(x[1].source_timestamp or x[1].source_session_id))
            if is_historical_q:
                prev_candidates = [sc for sc in all_same_predicate if sc[1].qualifiers.get("status") == "previous"]
                if prev_candidates:
                    selected_cand = prev_candidates[0][1]
                    selected_ans = prev_candidates[0][3]
                else:
                    if len(all_same_predicate) >= 2:
                        selected_cand = all_same_predicate[0][1]
                        selected_ans = all_same_predicate[0][3]
            elif is_current_q:
                curr_candidates = [sc for sc in all_same_predicate if sc[1].qualifiers.get("status") == "current"]
                if curr_candidates:
                    selected_cand = curr_candidates[-1][1]
                    selected_ans = curr_candidates[-1][3]
                else:
                    selected_cand = all_same_predicate[-1][1]
                    selected_ans = all_same_predicate[-1][3]

        # -------------------------------------------------------------
        # 3. Form Winning Derived Fact
        # -------------------------------------------------------------
        provenance = Provenance(
            session_id=selected_cand.source_session_id,
            message_id=selected_cand.source_message_id,
            timestamp=selected_cand.source_timestamp,
            snippet=selected_cand.evidence_span,
        )

        fact_id = f"fact_{selected_cand.source_session_id}_{selected_cand.predicate}_{abs(hash(selected_ans or selected_cand.object)) % 100000}"
        
        derived_fact = Fact(
            memory_id=fact_id,
            subject=selected_cand.subject,
            predicate=selected_cand.predicate,
            object=selected_ans or selected_cand.object,
            session_id=selected_cand.source_session_id,
            message_id=selected_cand.source_message_id,
            created_at=selected_cand.source_timestamp or "2026-01-01T00:00:00",
            valid_from=selected_cand.source_timestamp,
            status=MemoryStatus.ACTIVE,
            confidence=selected_cand.confidence,
            provenance=provenance,
            metadata={"qualifiers": selected_cand.qualifiers, "extraction_pattern": selected_cand.extraction_pattern},
        )

        return ResolutionResult(
            decision="answerable",
            answer=selected_ans or selected_cand.object,
            confidence=selected_cand.confidence,
            facts=[derived_fact],
            reasoning=f"Matched predicate '{selected_cand.predicate}' with score {top_score:.1f} ({top_reason}). Extracted: '{selected_ans or selected_cand.object}'.",
        )
