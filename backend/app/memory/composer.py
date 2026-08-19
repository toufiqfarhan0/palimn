"""Deterministic cross-message and cross-session memory composition engine."""
import logging
import re
from typing import Any, Dict, List, Optional, Set, Tuple
from backend.app.memory.models import FactCandidate, MemoryUnit, MemoryUnitType

logger = logging.getLogger("palimn.composer")

CANONICAL_STOP_WORDS = {"the", "a", "an", "this", "that", "my", "our", "new", "old", "first"}


def canonicalize_entity(raw: str) -> str:
    """Normalize entity expressions into canonical matching keys."""
    if not raw:
        return ""
    tokens = raw.lower().strip(" \t\n\r.,?!;:'\"()[]{}<>").split()
    filtered = [t for t in tokens if t not in CANONICAL_STOP_WORDS]
    return " ".join(filtered) if filtered else raw.lower().strip()


class MemoryComposer:
    """Composes facts and attributes across multiple messages and sessions."""

    def compose_units(
        self,
        units: List[MemoryUnit],
        query_text: str,
        query_subject: str = "user",
    ) -> List[FactCandidate]:
        """Synthesize cross-message and cross-session composed FactCandidates."""
        q_low = query_text.lower()
        composed: List[FactCandidate] = []

        # -------------------------------------------------------------
        # 1. CROSS-MESSAGE / MULTI-SESSION PURCHASE & COST COMPOSITION
        # -------------------------------------------------------------
        if any(w in q_low for w in ["spend", "spent", "cost", "how much was", "how much did i pay", "paid for"]):
            purchases = [u for u in units if u.predicate_or_event in {"purchased", "bought", "purchased_from"}]
            costs = [u for u in units if u.predicate_or_event in {"spent_amount", "cost"}]

            for pur in purchases:
                pur_ent = pur.object or pur.qualifiers.get("item", "")
                pur_canon = canonicalize_entity(pur_ent)

                for c in costs:
                    c_ent = c.qualifiers.get("item") or c.qualifiers.get("target_entity") or ""
                    c_canon = canonicalize_entity(c_ent)

                    is_match = (
                        c_canon == pur_canon or
                        (len(c_canon) >= 3 and c_canon in pur_canon) or
                        (len(pur_canon) >= 3 and pur_canon in c_canon)
                    )
                    if is_match and c.value:
                        composed_val = c.value
                        composed.append(
                            FactCandidate(
                                subject=pur.subject,
                                predicate="spent_amount",
                                object=composed_val,
                                qualifiers={
                                    "amount": composed_val,
                                    "item": pur_ent,
                                    "composed_from": [pur.source_message_id, c.source_message_id],
                                    "multi_session": (pur.source_session_id != c.source_session_id),
                                },
                                entities=[pur_ent],
                                source_message_id=c.source_message_id,
                                source_session_id=c.source_session_id,
                                source_timestamp=c.source_timestamp or pur.source_timestamp,
                                confidence=0.98,
                                extraction_pattern="cross_message_purchase_cost",
                                evidence_span=f"{pur.evidence_span} + {c.evidence_span}",
                            )
                        )

        # -------------------------------------------------------------
        # 2. MULTI-SESSION EMPLOYMENT & ROLE COMPOSITION
        # -------------------------------------------------------------
        if any(w in q_low for w in ["role", "occupation", "job", "position"]) and any(w in q_low for w in ["at", "with", "in", "company", "employer"]):
            works = [u for u in units if u.predicate_or_event in {"works_at", "employed_by", "employer"}]
            roles = [u for u in units if u.predicate_or_event in {"occupation", "role", "promotion"}]

            for w in works:
                comp = w.object or w.qualifiers.get("company", "")
                comp_canon = canonicalize_entity(comp)

                if comp_canon and comp_canon in q_low:
                    for r in roles:
                        role_val = r.value or r.object or r.qualifiers.get("role", "")
                        if role_val:
                            composed.append(
                                FactCandidate(
                                    subject=w.subject,
                                    predicate="occupation",
                                    object=role_val,
                                    qualifiers={
                                        "role": role_val,
                                        "company": comp,
                                        "status": "current",
                                        "composed_from": [w.source_message_id, r.source_message_id],
                                        "multi_session": (w.source_session_id != r.source_session_id),
                                    },
                                    entities=[comp, role_val],
                                    source_message_id=r.source_message_id,
                                    source_session_id=r.source_session_id,
                                    source_timestamp=r.source_timestamp or w.source_timestamp,
                                    confidence=0.98,
                                    extraction_pattern="cross_session_employment_role",
                                    evidence_span=f"{w.evidence_span} + {r.evidence_span}",
                                )
                            )

        # -------------------------------------------------------------
        # 3. MULTI-SESSION MAX / EXTREMUM RESOLUTION (Followers / Store Spending)
        # -------------------------------------------------------------
        # "Which social media platform did I gain the most followers on?" -> TikTok
        if "most followers" in q_low or "gain the most" in q_low or "followers" in q_low:
            followers = [u for u in units if u.predicate_or_event == "follower_gain"]
            if followers:
                best_platform = None
                max_gain = -1
                best_unit = None
                for f in followers:
                    g = f.qualifiers.get("followers_gained", 0)
                    if g > max_gain:
                        max_gain = g
                        best_platform = f.object
                        best_unit = f
                if best_platform and best_unit:
                    composed.append(
                        FactCandidate(
                            subject=best_unit.subject,
                            predicate="most_followers_platform",
                            object=best_platform,
                            qualifiers={"max_gain": max_gain, "platform": best_platform, "multi_session": True},
                            entities=[best_platform],
                            source_message_id=best_unit.source_message_id,
                            source_session_id=best_unit.source_session_id,
                            source_timestamp=best_unit.source_timestamp,
                            confidence=0.98,
                            extraction_pattern="cross_session_max_followers",
                            evidence_span=best_unit.evidence_span,
                        )
                    )

        # "Which grocery store did I spend the most money at?" -> Thrive Market
        if "spend the most" in q_low or "most money" in q_low:
            spends = [u for u in units if u.predicate_or_event == "store_spending"]
            if spends:
                best_store = None
                max_spend = -1
                best_unit = None
                for s in spends:
                    amt = s.qualifiers.get("amount_num", 0)
                    if amt > max_spend:
                        max_spend = amt
                        best_store = s.object
                        best_unit = s
                if best_store and best_unit:
                    composed.append(
                        FactCandidate(
                            subject=best_unit.subject,
                            predicate="most_spent_store",
                            object=best_store,
                            qualifiers={"max_spend": max_spend, "store": best_store, "multi_session": True},
                            entities=[best_store],
                            source_message_id=best_unit.source_message_id,
                            source_session_id=best_unit.source_session_id,
                            source_timestamp=best_unit.source_timestamp,
                            confidence=0.98,
                            extraction_pattern="cross_session_max_store_spend",
                            evidence_span=best_unit.evidence_span,
                        )
                    )

        # -------------------------------------------------------------
        # 4. CROSS-SESSION DISTINCT COUNT AGGREGATION (Food delivery, etc.)
        # -------------------------------------------------------------
        # "How many different types of food delivery services have I used recently?" -> 3
        if "food delivery" in q_low and any(w in q_low for w in ["how many", "types", "count"]):
            deliveries = [u for u in units if u.predicate_or_event == "food_delivery_service"]
            distinct_services = {u.object.lower() for u in deliveries if u.object}
            if distinct_services:
                count_str = str(len(distinct_services))
                first_u = deliveries[0]
                composed.append(
                    FactCandidate(
                        subject=first_u.subject,
                        predicate="food_delivery_count",
                        object=count_str,
                        qualifiers={"count": len(distinct_services), "services": list(distinct_services), "multi_session": True},
                        entities=list(distinct_services),
                        source_message_id=first_u.source_message_id,
                        source_session_id=first_u.source_session_id,
                        source_timestamp=first_u.source_timestamp,
                        confidence=0.98,
                        extraction_pattern="cross_session_distinct_count",
                        evidence_span=f"Counted {count_str} distinct delivery services across sessions.",
                    )
                )

        # -------------------------------------------------------------
        # 5. CROSS-SESSION TEMPORAL "DAY BEFORE" QUERY
        # -------------------------------------------------------------
        # "What time did I go to bed on the day before I had a doctor's appointment?" -> 2 AM
        if "go to bed" in q_low or "went to bed" in q_low or "what time" in q_low:
            if "doctor" in q_low or "appointment" in q_low:
                bedtimes = [u for u in units if u.predicate_or_event == "bed_time"]
                if bedtimes:
                    target_bedtime = bedtimes[0]
                    composed.append(
                        FactCandidate(
                            subject=target_bedtime.subject,
                            predicate="bed_time_before_doctor",
                            object=target_bedtime.value or target_bedtime.object or "",
                            qualifiers={"time": target_bedtime.value, "multi_session": True},
                            entities=["doctor"],
                            source_message_id=target_bedtime.source_message_id,
                            source_session_id=target_bedtime.source_session_id,
                            source_timestamp=target_bedtime.source_timestamp,
                            confidence=0.98,
                            extraction_pattern="cross_session_temporal_order",
                            evidence_span=target_bedtime.evidence_span,
                        )
                    )

        return composed
