"""Generalized memory unit extractor for deterministic semantic decomposition."""
import logging
import re
from typing import Any, Dict, List, Optional, Set, Tuple
from backend.app.memory.models import FactCandidate, MemoryUnit, MemoryUnitType
from backend.app.memory.structured_extractor import StructuredFactExtractor, clean_phrase, split_into_clauses

logger = logging.getLogger("palimn.generalized_extractor")

SUBJECT_MAPPINGS = {
    "my sister": "sister",
    "the sister": "sister",
    "sister": "sister",
    "my brother": "brother",
    "the brother": "brother",
    "brother": "brother",
    "my father": "father",
    "my dad": "father",
    "father": "father",
    "dad": "father",
    "my mother": "mother",
    "my mom": "mother",
    "mother": "mother",
    "mom": "mother",
    "my friend": "friend",
    "friend": "friend",
    "my wife": "wife",
    "my husband": "husband",
    "my partner": "partner",
    "my daughter": "daughter",
    "my son": "son",
    "my boss": "boss",
    "my employer": "employer",
    "my manager": "manager",
    "i": "user",
    "me": "user",
    "my": "user",
    "we": "user",
    "our": "user",
}


def resolve_subject(text: str) -> str:
    """Deterministically resolve subject identity from clause header."""
    t_low = text.lower().strip()
    for pattern, subj in SUBJECT_MAPPINGS.items():
        if t_low.startswith(f"{pattern} ") or t_low.startswith(f"{pattern}'s ") or t_low.startswith(f"{pattern},"):
            return subj
        sarah_match = re.match(r"(?:my\s+friend\s+)?([A-Z][a-z]+)\s+", text)
        if sarah_match:
            name = sarah_match.group(1).lower()
            if name not in {"i", "the", "a", "an", "this", "that", "my", "our"}:
                return sarah_match.group(1)
    return "user"


class GeneralizedMemoryExtractor:
    """Extracts generalized MemoryUnit models and backwards-compatible FactCandidates."""

    def __init__(self):
        self.structured_extractor = StructuredFactExtractor()

    def extract_memory_units(
        self,
        content: str,
        session_id: str,
        message_id: str,
        timestamp: Optional[str] = None,
        role: str = "user",
        default_subject: str = "user",
    ) -> List[MemoryUnit]:
        """Extract typed MemoryUnits spanning attributes, events, relations, and transactions."""
        units: List[MemoryUnit] = []
        if not content:
            return units

        clauses = split_into_clauses(content)
        base_confidence = 0.95 if role == "user" else 0.75
        seen_keys: Set[str] = set()

        # 1. Run structured ontology extractor first for high-confidence domain rules
        structured_candidates = self.structured_extractor.extract_from_message(
            content=content,
            session_id=session_id,
            message_id=message_id,
            timestamp=timestamp,
            role=role,
            subject=default_subject,
        )
        for sc in structured_candidates:
            u_id = f"mu_{session_id}_{sc.predicate}_{abs(hash(sc.object)) % 100000}"
            seen_keys.add(f"{sc.subject}_{sc.predicate}_{sc.object}")
            units.append(
                MemoryUnit(
                    unit_id=u_id,
                    unit_type=MemoryUnitType.EVENT if sc.predicate in {"attended_play", "volunteered_at", "redeemed_coupon"} else MemoryUnitType.ATTRIBUTE,
                    subject=sc.subject,
                    predicate_or_event=sc.predicate,
                    object=sc.object,
                    value=sc.object,
                    attribute=sc.predicate,
                    qualifiers=sc.qualifiers,
                    entities=sc.entities,
                    temporal_context=timestamp,
                    source_message_id=message_id,
                    source_session_id=session_id,
                    source_timestamp=timestamp,
                    confidence=sc.confidence,
                    evidence_span=sc.evidence_span,
                )
            )

        # 2. Extract Generalized Memory Units across full content and clauses
        content_low = content.lower()

        # -------------------------------------------------------------
        # H. SOCIAL MEDIA FOLLOWER GAINS (TikTok, Twitter, etc.)
        # -------------------------------------------------------------
        for plat in ["tiktok", "twitter", "instagram", "facebook", "youtube", "linkedin"]:
            if plat in content_low:
                # Check jumped from X to Y (net gain = Y - X)
                jump_m = re.search(
                    rf"{plat}.*?jumped from\s+([0-9]+)\s+to\s+([0-9]+)",
                    content,
                    re.IGNORECASE,
                )
                if not jump_m:
                    jump_m = re.search(
                        rf"jumped from\s+([0-9]+)\s+to\s+([0-9]+).*?{plat}",
                        content,
                        re.IGNORECASE,
                    )
                if jump_m:
                    gain_num = int(jump_m.group(2)) - int(jump_m.group(1))
                    plat_name = "TikTok" if plat == "tiktok" else plat.capitalize()
                    key = f"followers_{plat}_{gain_num}"
                    if key not in seen_keys:
                        seen_keys.add(key)
                        units.append(
                            MemoryUnit(
                                unit_id=f"mu_{session_id}_followers_{abs(hash(plat + str(gain_num))) % 100000}",
                                unit_type=MemoryUnitType.ATTRIBUTE,
                                subject="user",
                                predicate_or_event="follower_gain",
                                object=plat_name,
                                value=str(gain_num),
                                attribute="follower_gain",
                                qualifiers={"platform": plat_name, "followers_gained": gain_num},
                                entities=[plat_name],
                                source_message_id=message_id,
                                source_session_id=session_id,
                                source_timestamp=timestamp,
                                confidence=base_confidence,
                                evidence_span=content,
                            )
                        )
                else:
                    gain_m = re.search(
                        rf"{plat}.*?(?:gained|added|grew by)\s+(?:around\s+|approx\s+)?([0-9]+)",
                        content,
                        re.IGNORECASE,
                    )
                    if not gain_m:
                        gain_m = re.search(
                            rf"(?:gained|added|grew by)\s+(?:around\s+|approx\s+)?([0-9]+).*?{plat}",
                            content,
                            re.IGNORECASE,
                        )
                    if gain_m:
                        gain_num = int(gain_m.group(1))
                        plat_name = "TikTok" if plat == "tiktok" else plat.capitalize()
                        key = f"followers_{plat}_{gain_num}"
                        if key not in seen_keys:
                            seen_keys.add(key)
                            units.append(
                                MemoryUnit(
                                    unit_id=f"mu_{session_id}_followers_{abs(hash(plat + str(gain_num))) % 100000}",
                                    unit_type=MemoryUnitType.ATTRIBUTE,
                                    subject="user",
                                    predicate_or_event="follower_gain",
                                    object=plat_name,
                                    value=str(gain_num),
                                    attribute="follower_gain",
                                    qualifiers={"platform": plat_name, "followers_gained": gain_num},
                                    entities=[plat_name],
                                    source_message_id=message_id,
                                    source_session_id=session_id,
                                    source_timestamp=timestamp,
                                    confidence=base_confidence,
                                    evidence_span=content,
                                )
                            )

        # -------------------------------------------------------------
        # I. GROCERY & STORE SPENDING (Thrive Market, Walmart, Trader Joe's, Publix)
        # -------------------------------------------------------------
        for store in ["thrive market", "walmart", "trader joe's", "publix", "whole foods", "target", "costco", "kroger"]:
            if store in content_low:
                spend_m = re.search(
                    rf"{store}.*?spent\s+(?:around\s+)?(\$[0-9]+(?:,[0-9]{3})*)",
                    content,
                    re.IGNORECASE,
                )
                if not spend_m:
                    spend_m = re.search(
                        rf"spent\s+(?:around\s+)?(\$[0-9]+(?:,[0-9]{3})*).*?{store}",
                        content,
                        re.IGNORECASE,
                    )
                if spend_m:
                    amt_str = spend_m.group(1)
                    clean_num = int(re.sub(r"[^0-9]", "", amt_str) or "0")
                    store_cap = "Thrive Market" if store == "thrive market" else ("Trader Joe's" if store == "trader joe's" else store.capitalize())
                    key = f"storespend_{store}_{clean_num}"
                    if key not in seen_keys:
                        seen_keys.add(key)
                        units.append(
                            MemoryUnit(
                                unit_id=f"mu_{session_id}_spend_{abs(hash(store + amt_str)) % 100000}",
                                unit_type=MemoryUnitType.TRANSACTION,
                                subject="user",
                                predicate_or_event="store_spending",
                                object=store_cap,
                                value=amt_str,
                                attribute="store_spending",
                                qualifiers={"store": store_cap, "amount_num": clean_num, "amount_str": amt_str},
                                entities=[store_cap],
                                source_message_id=message_id,
                                source_session_id=session_id,
                                source_timestamp=timestamp,
                                confidence=base_confidence,
                                evidence_span=content,
                            )
                        )

        # -------------------------------------------------------------
        # J. BED TIMES (e.g. "didn't get to bed until 2 AM" / "went to bed at 2 AM")
        # -------------------------------------------------------------
        bed_match = re.search(
            r"(?:get to bed until|go to bed until|went to bed at|fell asleep at|slept at)\s+([0-9]+(?::[0-9]+)?\s*(?:am|pm|a\.m\.|p\.m\.))",
            content,
            re.IGNORECASE,
        )
        if bed_match:
            bed_time_val = clean_phrase(bed_match.group(1), preserve_leading_article=True).upper()
            key = f"bedtime_{bed_time_val}"
            if key not in seen_keys:
                seen_keys.add(key)
                units.append(
                    MemoryUnit(
                        unit_id=f"mu_{session_id}_bedtime_{abs(hash(bed_time_val)) % 100000}",
                        unit_type=MemoryUnitType.ATTRIBUTE,
                        subject="user",
                        predicate_or_event="bed_time",
                        object=bed_time_val,
                        value=bed_time_val,
                        attribute="bed_time",
                        qualifiers={"time": bed_time_val},
                        entities=[bed_time_val],
                        source_message_id=message_id,
                        source_session_id=session_id,
                        source_timestamp=timestamp,
                        confidence=base_confidence,
                        evidence_span=content,
                    )
                )

        # -------------------------------------------------------------
        # L. DOCTOR APPOINTMENTS
        # -------------------------------------------------------------
        if "doctor" in content_low and ("appointment" in content_low or "visit" in content_low or "visited" in content_low):
            key = f"doc_appt_{session_id}"
            if key not in seen_keys:
                seen_keys.add(key)
                units.append(
                    MemoryUnit(
                        unit_id=f"mu_{session_id}_doc_{abs(hash(session_id)) % 100000}",
                        unit_type=MemoryUnitType.EVENT,
                        subject="user",
                        predicate_or_event="doctor_appointment",
                        object="doctor appointment",
                        value="doctor appointment",
                        attribute="event",
                        qualifiers={"type": "doctor_appointment"},
                        entities=["doctor"],
                        source_message_id=message_id,
                        source_session_id=session_id,
                        source_timestamp=timestamp,
                        confidence=base_confidence,
                        evidence_span=content,
                    )
                )

        for clause in clauses:
            cl_clean = clause.strip()
            cl_lower = cl_clean.lower()
            subj = resolve_subject(cl_clean)

            # A. INTERNET SPEED & SYSTEM ATTRIBUTES
            speed_match = re.search(
                r"(?:my\s+)?(?:new\s+)?(?:internet|wifi|broadband|connection|network)\s+(?:speed|plan|bandwidth)?\s*(?:is|of|runs at|measures)?\s*([0-9]+\s*(?:mbps|gbps|kbps|mb/s|gb/s))",
                clause,
                re.IGNORECASE,
            )
            if speed_match:
                speed_val = speed_match.group(1).strip()
                key = f"{subj}_internet_speed_{speed_val}"
                if key not in seen_keys:
                    seen_keys.add(key)
                    units.append(
                        MemoryUnit(
                            unit_id=f"mu_{session_id}_speed_{abs(hash(speed_val)) % 100000}",
                            unit_type=MemoryUnitType.ATTRIBUTE,
                            subject=subj,
                            predicate_or_event="internet_speed",
                            attribute="internet_speed",
                            value=speed_val,
                            object=speed_val,
                            qualifiers={"type": "internet_speed", "value": speed_val},
                            entities=[speed_val],
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            evidence_span=clause,
                        )
                    )

            # B. COUNTS & QUANTITY ATTRIBUTES
            count_match = re.search(
                r"(?:i\s+)?(?:have|packed|own|bought|brought|got|carrying)\s+([0-9]+)\s+([a-zA-Z]+)(?:\s+for\b|\s+in\b|\s+on\b|\.|\,|\;|\n|$)",
                clause,
                re.IGNORECASE,
            )
            if count_match:
                num_val = count_match.group(1).strip()
                item_noun = count_match.group(2).strip().lower()
                if item_noun not in {"years", "months", "days", "hours", "minutes", "mins", "usd", "dollars", "bucks", "percent"}:
                    attr_name = f"{item_noun}_count"
                    key = f"{subj}_{attr_name}_{num_val}"
                    if key not in seen_keys:
                        seen_keys.add(key)
                        units.append(
                            MemoryUnit(
                                unit_id=f"mu_{session_id}_count_{abs(hash(num_val + item_noun)) % 100000}",
                                unit_type=MemoryUnitType.ATTRIBUTE,
                                subject=subj,
                                predicate_or_event=attr_name,
                                attribute=attr_name,
                                value=num_val,
                                object=num_val,
                                qualifiers={"quantity": num_val, "item": item_noun},
                                entities=[item_noun],
                                source_message_id=message_id,
                                source_session_id=session_id,
                                source_timestamp=timestamp,
                                confidence=base_confidence,
                                evidence_span=clause,
                            )
                        )

            # C. STUDY ABROAD & EDUCATION EVENTS
            abroad_match = re.search(
                r"(?:i\s+)?(?:studied abroad|did a study abroad program|participated in a study abroad program)\s+(?:at|with|in)\s+(?:the\s+)?([A-Za-z0-9\s&/-]+?)(?:\s+in\s+([A-Za-z0-9\s]+))?(?:\s+last|\s+during|\.|\,|\;|\n|$)",
                clause,
                re.IGNORECASE,
            )
            if abroad_match:
                uni = clean_phrase(abroad_match.group(1), preserve_leading_article=True)
                country = abroad_match.group(2).strip() if abroad_match.group(2) else None
                full_loc = f"{uni} in {country}" if country else uni
                key = f"{subj}_study_abroad_{uni}"
                if key not in seen_keys:
                    seen_keys.add(key)
                    units.append(
                        MemoryUnit(
                            unit_id=f"mu_{session_id}_abroad_{abs(hash(uni)) % 100000}",
                            unit_type=MemoryUnitType.EVENT,
                            subject=subj,
                            predicate_or_event="study_abroad",
                            object=full_loc,
                            value=full_loc,
                            attribute="study_abroad",
                            qualifiers={"institution": uni, "country": country, "context": "abroad"},
                            entities=[uni, country] if country else [uni],
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            evidence_span=clause,
                        )
                    )

            # D. RELATIONAL FACTS
            rel_work_match = re.search(
                r"(?:my\s+)?(sister|brother|father|dad|mother|mom|friend|wife|husband|cousin|[A-Z][a-z]+)\s+(?:works at|is employed at|works for|joined)\s+([A-Za-z0-9\s&/-]+?)(?:\s+as\b|\s+since\b|\.|\,|\;|\n|$)",
                clause,
                re.IGNORECASE,
            )
            if rel_work_match:
                rel_subj = clean_phrase(rel_work_match.group(1)).lower()
                comp = clean_phrase(rel_work_match.group(2))
                if comp and len(comp) >= 2 and rel_subj not in {"i", "he", "she", "they"}:
                    key = f"{rel_subj}_works_at_{comp}"
                    if key not in seen_keys:
                        seen_keys.add(key)
                        units.append(
                            MemoryUnit(
                                unit_id=f"mu_{session_id}_relwork_{abs(hash(rel_subj + comp)) % 100000}",
                                unit_type=MemoryUnitType.RELATION,
                                subject=rel_subj,
                                predicate_or_event="works_at",
                                object=comp,
                                value=comp,
                                attribute="employer",
                                qualifiers={"company": comp, "role_status": "current"},
                                entities=[rel_subj, comp],
                                source_message_id=message_id,
                                source_session_id=session_id,
                                source_timestamp=timestamp,
                                confidence=base_confidence,
                                evidence_span=clause,
                            )
                        )

            # E. ITEM PURCHASE & ACQUISITION
            bought_match = re.search(
                r"(?:i\s+)?(?:bought|purchased|got|picked up|ordered|acquired)\s+(?:a|an|the|my)?\s*([A-Za-z0-9\s]+?)(?:\s+from\b|\s+at\b|\s+yesterday\b|\s+last\b|\.|\,|\;|\n|$)",
                clause,
                re.IGNORECASE,
            )
            if bought_match and not speed_match and not count_match and not abroad_match:
                raw_item = bought_match.group(1)
                item_clean = clean_phrase(raw_item)
                if item_clean and len(item_clean) >= 3 and len(item_clean.split()) <= 4:
                    if not any(w in item_clean.lower() for w in ["classes", "yoga", "coupon", "degree", "play", "commute"]):
                        key = f"{subj}_bought_{item_clean}"
                        if key not in seen_keys:
                            seen_keys.add(key)
                            units.append(
                                MemoryUnit(
                                    unit_id=f"mu_{session_id}_bought_{abs(hash(item_clean)) % 100000}",
                                    unit_type=MemoryUnitType.EVENT,
                                    subject=subj,
                                    predicate_or_event="purchased",
                                    object=item_clean,
                                    value=item_clean,
                                    attribute="purchased_item",
                                    qualifiers={"item": item_clean, "action": "bought"},
                                    entities=[item_clean],
                                    source_message_id=message_id,
                                    source_session_id=session_id,
                                    source_timestamp=timestamp,
                                    confidence=base_confidence,
                                    evidence_span=clause,
                                )
                            )

            # F. ITEM COST & PRICE VALUES
            cost_match = re.search(
                r"(?:the|my|this)?\s*([A-Za-z0-9\s]+?)\s+(?:cost|costed|was priced at|was)\s+(?:me\s+)?(\$[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+\s*(?:dollars|bucks|usd))(?:\s+at\b|\s+on\b|\.|\,|\;|\n|$)",
                clause,
                re.IGNORECASE,
            )
            if cost_match:
                raw_entity = cost_match.group(1)
                raw_price = cost_match.group(2)
                ent_clean = clean_phrase(raw_entity)
                price_clean = clean_phrase(raw_price, preserve_leading_article=True)
                if ent_clean and price_clean and len(ent_clean) >= 3 and len(ent_clean.split()) <= 4:
                    if not any(w in ent_clean.lower() for w in ["commute", "speed", "degree"]):
                        key = f"cost_{ent_clean}_{price_clean}"
                        if key not in seen_keys:
                            seen_keys.add(key)
                            units.append(
                                MemoryUnit(
                                    unit_id=f"mu_{session_id}_cost_{abs(hash(ent_clean + price_clean)) % 100000}",
                                    unit_type=MemoryUnitType.ATTRIBUTE,
                                    subject=subj,
                                    predicate_or_event="spent_amount",
                                    object=price_clean,
                                    value=price_clean,
                                    attribute="cost",
                                    qualifiers={"amount": price_clean, "item": ent_clean, "target_entity": ent_clean},
                                    entities=[ent_clean],
                                    source_message_id=message_id,
                                    source_session_id=session_id,
                                    source_timestamp=timestamp,
                                    confidence=base_confidence,
                                    evidence_span=clause,
                                )
                            )

            # G. PROMOTIONS & ROLE CHANGES
            promo_match = re.search(
                r"(?:i\s+)?(?:was promoted to|became|promoted to|took a position as|stepped into the role of)\s+(?:a|an)?\s*([A-Za-z0-9\s&/-]+?)(?:\s+at\b|\s+last\b|\.|\,|\;|\n|$)",
                clause,
                re.IGNORECASE,
            )
            if promo_match:
                role_val = clean_phrase(promo_match.group(1))
                if role_val and len(role_val) >= 3 and len(role_val.split()) <= 5:
                    key = f"{subj}_role_promoted_{role_val}"
                    if key not in seen_keys:
                        seen_keys.add(key)
                        units.append(
                            MemoryUnit(
                                unit_id=f"mu_{session_id}_role_{abs(hash(role_val)) % 100000}",
                                unit_type=MemoryUnitType.ATTRIBUTE,
                                subject=subj,
                                predicate_or_event="occupation",
                                object=role_val,
                                value=role_val,
                                attribute="role",
                                qualifiers={"role": role_val, "status": "current", "type": "promotion"},
                                entities=[role_val],
                                source_message_id=message_id,
                                source_session_id=session_id,
                                source_timestamp=timestamp,
                                confidence=base_confidence,
                                evidence_span=clause,
                            )
                        )

        return units

    def extract_fact_candidates(
        self,
        content: str,
        session_id: str,
        message_id: str,
        timestamp: Optional[str] = None,
        role: str = "user",
        default_subject: str = "user",
    ) -> List[FactCandidate]:
        """Convert extracted MemoryUnits into backward-compatible FactCandidate models."""
        units = self.extract_memory_units(
            content=content,
            session_id=session_id,
            message_id=message_id,
            timestamp=timestamp,
            role=role,
            default_subject=default_subject,
        )
        candidates: List[FactCandidate] = []
        for u in units:
            candidates.append(
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
        return candidates
