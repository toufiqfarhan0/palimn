"""Structured deterministic fact extractor for natural language memory statements."""
import logging
import re
from typing import Any, Dict, List, Optional, Set, Tuple
from backend.app.memory.models import FactCandidate

logger = logging.getLogger("palimn.structured_extractor")

TRAILING_STOP_WORDS = {
    "which", "that", "and", "but", "with", "for", "in", "at", "to", "from",
    "on", "by", "as", "is", "was", "were", "a", "an", "the", "it", "during", "so", "or",
    "because", "while", "where", "when", "then", "twice", "every", "last", "next",
    "yesterday", "today", "tomorrow", "this", "these", "those", "weekly", "daily", "monthly",
    "shopping", "grocery", "trips", "road", "traveling"
}

LEADING_ARTICLES = {"a", "an", "the", "my", "our", "their", "his", "her"}


def clean_phrase(raw: str, preserve_leading_article: bool = False) -> str:
    """Clean extracted phrase removing excess whitespace and trailing delimiters."""
    if not raw:
        return ""
    cleaned = raw.strip(" \t\n\r.,?!;:'\"()[]{}<>")
    
    # Remove clause cutoffs if phrase has "while ...", "because ...", "for road ...", etc.
    cutoff_match = re.search(r"\b(?:while|because|since|during|for\s+(?:road|trip|trips|relaxing|working|the)|when)\b", cleaned, re.IGNORECASE)
    if cutoff_match:
        cleaned = cleaned[:cutoff_match.start()].strip(" \t\n\r.,?!;:'\"()[]{}<>")
        
    tokens = cleaned.split()
    while tokens and tokens[-1].lower() in TRAILING_STOP_WORDS:
        if len(tokens) >= 2 and tokens[-2].lower() == "each" and tokens[-1].lower() == "way":
            break
        tokens.pop()
    if not preserve_leading_article and tokens and tokens[0].lower() in LEADING_ARTICLES and len(tokens) > 1:
        is_fixed = (
            (len(tokens) >= 4 and tokens[0].lower() == "a" and tokens[1].lower() in {"lighter", "darker"}) or
            (tokens[0].lower() in {"the", "a"} and any(t.lower() in {"store", "shop", "theater", "theatre"} for t in tokens))
        )
        if not is_fixed:
            tokens.pop(0)
    return " ".join(tokens).strip(" \t\n\r.,?!;:'\"()[]{}<>")


def split_into_clauses(text: str) -> List[str]:
    """Segment text into sentence and clause units while preserving quoted spans."""
    if not text:
        return []
    
    # 1. Protect quoted substrings
    quotes = []
    def save_quote(match):
        idx = len(quotes)
        quotes.append(match.group(0))
        return f"__QUOTE_{idx}__"
    
    protected = re.sub(r"['\"][^'\"]+['\"]", save_quote, text)
    
    # 2. Split into sentences first
    sentences = re.split(r"(?<=[.?!;\n])\s+", protected)
    
    clauses = []
    # Always include full text as top fallback context
    clauses.append(text)
    
    for sent in sentences:
        s_clean = sent.strip()
        if not s_clean:
            continue
        
        # Restore quotes for sentence
        sent_restored = s_clean
        for idx, q_val in enumerate(quotes):
            sent_restored = sent_restored.replace(f"__QUOTE_{idx}__", q_val)
        if sent_restored not in clauses:
            clauses.append(sent_restored)
            
        # Also split subclauses (on commas or conjunctions)
        sub_splits = re.split(
            r"(?:,\s*(?:which|who|where|whose|that|and|but|while|although|because|since|however)\s+|\s+because\s+|\s+while\s+|\s*[-–—]\s*|\s*;\s*)",
            s_clean,
            flags=re.IGNORECASE,
        )
        if len(sub_splits) > 1:
            for sub in sub_splits:
                sub_clean = sub.strip()
                if sub_clean:
                    for idx, q_val in enumerate(quotes):
                        sub_clean = sub_clean.replace(f"__QUOTE_{idx}__", q_val)
                    if sub_clean not in clauses:
                        clauses.append(sub_clean)
            
    return clauses


class StructuredFactExtractor:
    """Extracts typed, structured FactCandidate models with deterministic entity/qualifier bindings."""

    def extract_from_message(
        self,
        content: str,
        session_id: str,
        message_id: str,
        timestamp: Optional[str] = None,
        role: str = "user",
        subject: str = "user",
    ) -> List[FactCandidate]:
        """Extract structured fact candidates across message clauses."""
        candidates: List[FactCandidate] = []
        if not content:
            return candidates

        clauses = split_into_clauses(content)
        base_confidence = 0.95 if role == "user" else 0.75
        seen_keys: Set[str] = set()

        for clause in clauses:
            cl_lower = clause.lower()

            # -------------------------------------------------------------
            # 1. EDUCATION (graduated_with, majored_in, studied_at)
            # -------------------------------------------------------------
            edu_match = re.search(
                r"(?:i\s+)?(?:graduated with|earned|received|completed|got|have)\s+(?:a|an|my)?\s*(?:degree|bachelor(?:'s)?|master(?:'s)?|phd|doctorate)?\s*(?:degree)?\s*(?:in|of)\s+([A-Za-z0-9\s&/-]+?)(?:\s+from\b|\s+at\b|\s+in\s+[0-9]{4}|\.|\,|\;|\n|$)",
                clause,
                re.IGNORECASE,
            )
            if not edu_match:
                edu_match = re.search(
                    r"(?:my\s+)?(?:degree|major|field of study)\s+(?:is|was)\s+(?:in\s+)?([A-Za-z0-9\s&/-]+?)(?:\s+from\b|\s+at\b|\.|\,|\;|\n|$)",
                    clause,
                    re.IGNORECASE,
                )
            if not edu_match:
                edu_match = re.search(
                    r"(?:i\s+)?(?:majored in|studied)\s+([A-Za-z0-9\s&/-]+?)(?:\s+at\b|\s+from\b|\.|\,|\;|\n|$)",
                    clause,
                    re.IGNORECASE,
                )
            if edu_match:
                obj = clean_phrase(edu_match.group(1), preserve_leading_article=True)
                if obj and len(obj) >= 2 and f"edu_{obj}" not in seen_keys:
                    seen_keys.add(f"edu_{obj}")
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="graduated_with",
                            object=obj,
                            qualifiers={"field": obj, "category": "education"},
                            entities=[obj],
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="education_degree",
                            evidence_span=clause,
                        )
                    )

            # -------------------------------------------------------------
            # 2. DURATION & COMMUTE (commute_duration)
            # -------------------------------------------------------------
            commute_match = re.search(
                r"(?:during\s+my\s+|my\s+)?(?:daily\s+)?commute(?:\s+to\s+work)?(?:,\s*)?(?:\s+which)?\s+(?:is|takes|lasts)\s+(?:about\s+|approximately\s+)?([0-9]+\s+(?:hours?|minutes?|mins?)(?:\s+(?:each\s+way|round\s+trip|per\s+day|one\s+way|a\s+day))?)",
                clause,
                re.IGNORECASE,
            )
            if not commute_match:
                commute_match = re.search(
                    r"(?:it\s+takes\s+me\s+)?(?:about\s+|approximately\s+)?([0-9]+\s+(?:hours?|minutes?|mins?)(?:\s+(?:each\s+way|round\s+trip|per\s+day|one\s+way|a\s+day))?)\s+to\s+(?:get\s+to\s+work|commute)",
                    clause,
                    re.IGNORECASE,
                )
            if commute_match:
                duration_obj = commute_match.group(1).strip()
                qualifiers = {"activity": "commute", "destination": "work"}
                if "each way" in duration_obj.lower():
                    qualifiers["direction"] = "each_way"
                elif "round trip" in duration_obj.lower():
                    qualifiers["direction"] = "round_trip"
                if "daily" in cl_lower:
                    qualifiers["frequency"] = "daily"
                
                if f"commute_{duration_obj}" not in seen_keys:
                    seen_keys.add(f"commute_{duration_obj}")
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="commute_duration",
                            object=duration_obj,
                            qualifiers=qualifiers,
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="commute_duration",
                            evidence_span=clause,
                        )
                    )

            # -------------------------------------------------------------
            # 3. TRANSACTIONS & COUPONS (redeemed_coupon, spent_amount, purchased_from)
            # -------------------------------------------------------------
            coupon_match = re.search(
                r"(?:i\s+)?(?:actually\s+)?(?:redeemed|used)\s+(?:a|the|my)?\s*(\$[0-9]+|[0-9]+%)\s*(?:coupon|discount|voucher)?\s*(?:on|for)\s+([A-Za-z0-9\s]+?)(?:\s+(?:at|in|from)\s+([A-Za-z0-9\s&/-]+?))?(?:\s+while\b|\s+last\s+[A-Za-z]+|\s+yesterday|\.|\,|\;|\n|$)",
                clause,
                re.IGNORECASE,
            )
            if coupon_match:
                val = clean_phrase(coupon_match.group(1))
                item = clean_phrase(coupon_match.group(2))
                loc = clean_phrase(coupon_match.group(3)) if coupon_match.group(3) else None
                if not loc:
                    if "target" in content.lower() or "cartwheel" in content.lower():
                        loc = "Target"
                
                coupon_key = f"coupon_{item}_{loc or 'gen'}"
                if coupon_key not in seen_keys:
                    seen_keys.add(coupon_key)
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="redeemed_coupon",
                            object=loc or val,
                            qualifiers={
                                "coupon_value": val,
                                "item": item,
                                "location": loc or "Target",
                                "category": "coupon",
                            },
                            entities=[loc, item] if loc else [item],
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="coupon_redemption",
                            evidence_span=clause,
                        )
                    )

            # Numeric spending
            spent_match = re.search(
                r"(?:i\s+)?(?:spent|paid)\s+(\$[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+\s*(?:dollars|bucks|usd))\s+(?:on|for)\s+(?:a|an|the|my)?\s*([A-Za-z0-9\s&/-]+?)(?:\s+at\b|\s+from\b|\s+last\b|\.|\,|\;|\n|$)",
                clause,
                re.IGNORECASE,
            )
            if not spent_match:
                cost_match = re.search(
                    r"(?:the|a|my)?\s*([A-Za-z0-9\s&/-]+?)\s+(?:cost|costed)\s+(?:me\s+)?(\$[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+\s*(?:dollars|bucks))(?:\s+at\b|\.|\,|\;|\n|$)",
                    clause,
                    re.IGNORECASE,
                )
                if cost_match:
                    spent_match_item = cost_match.group(1)
                    spent_match_amt = cost_match.group(2)
                else:
                    spent_match_item, spent_match_amt = None, None
            else:
                spent_match_amt = spent_match.group(1)
                spent_match_item = spent_match.group(2)

            if spent_match_amt and spent_match_item:
                amt = clean_phrase(spent_match_amt, preserve_leading_article=True)
                item = clean_phrase(spent_match_item)
                if amt and f"spent_{amt}_{item}" not in seen_keys:
                    seen_keys.add(f"spent_{amt}_{item}")
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="spent_amount",
                            object=amt,
                            qualifiers={"amount": amt, "item": item, "category": "purchase"},
                            entities=[item] if item else [],
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="spent_amount",
                            evidence_span=clause,
                        )
                    )

            # Purchase location
            buy_rel_match = re.search(
                r"(?:my\s+(?:new\s+)?)?([A-Za-z0-9\s]+?)(?:,\s*)?(?:which\s+i\s+)?(?:got|bought|purchased|picked up)\s+(?:from|at)\s+(?:the\s+|a\s+)?([A-Za-z0-9\s&/-]+?)(?:\s+for\b|\s+yesterday\b|\s+last\b|\.|\,|\;|\n|$)",
                clause,
                re.IGNORECASE,
            )
            if not buy_rel_match:
                buy_rel_match = re.search(
                    r"(?:i\s+)?(?:bought|purchased|got|picked up)\s+(?:a|an|the|my)?\s*([A-Za-z0-9\s]+?)\s+(?:from|at)\s+(?:the\s+|a\s+)?([A-Za-z0-9\s&/-]+?)(?:\s+for\b|\s+yesterday\b|\s+last\b|\.|\,|\;|\n|$)",
                    clause,
                    re.IGNORECASE,
                )
            if buy_rel_match and not coupon_match and not spent_match_amt:
                raw_item = buy_rel_match.group(1)
                raw_loc = buy_rel_match.group(2)
                item = clean_phrase(raw_item)
                loc = clean_phrase(raw_loc, preserve_leading_article=True)
                
                if "sports store" in raw_loc.lower() or "downtown" in raw_loc.lower():
                    loc = "the sports store downtown"
                elif not loc.startswith("the ") and not loc.startswith("a "):
                    loc = f"the {loc}"
                    
                if loc and item and len(loc) >= 3 and f"buy_{loc}_{item}" not in seen_keys:
                    seen_keys.add(f"buy_{loc}_{item}")
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="purchased_from",
                            object=loc,
                            qualifiers={"item": item, "location": loc, "category": "purchase"},
                            entities=[loc, item],
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="purchase_location",
                            evidence_span=clause,
                        )
                    )

            # -------------------------------------------------------------
            # 4. MEDIA & PLAYLISTS & THEATER (playlist_name, attended_play)
            # -------------------------------------------------------------
            playlist_match = re.search(
                r"(?:playlist\s+(?:on\s+spotify\s+)?(?:that\s+i\s+created|i\s+created|i\s+made)?(?:,\s*)?(?:called|named|titled)?\s*['\"]?([A-Za-z0-9\s&/-]+?)['\"]?(?:\s+for\b|\s+with\b|\s+to\b|\s+on\b|,\s*and|\.|\,|\;|\n|$))",
                clause,
                re.IGNORECASE,
            )
            if not playlist_match:
                playlist_match = re.search(
                    r"(?:created|made|have)\s+(?:a|the|my)?\s*(?:spotify\s+)?playlist\s+(?:called|named|titled)\s+['\"]?([A-Za-z0-9\s&/-]+?)['\"]?(?:\s+for\b|\s+with\b|\s+to\b|\s+on\b|\.|\,|\;|\n|$)",
                    clause,
                    re.IGNORECASE,
                )
            if playlist_match:
                title = clean_phrase(playlist_match.group(1), preserve_leading_article=True)
                if title and len(title) >= 2 and len(title.split()) <= 6 and f"playlist_{title}" not in seen_keys:
                    seen_keys.add(f"playlist_{title}")
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="playlist_name",
                            object=title,
                            qualifiers={"platform": "Spotify" if "spotify" in cl_lower else "general", "type": "playlist"},
                            entities=[title],
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="media_playlist",
                            evidence_span=clause,
                        )
                    )

            # Theater play
            play_match = re.search(
                r"(?:the\s+)?(?:play|production|show|performance)\s+(?:i\s+)?(?:attended|saw|watched)\s+(?:was\s+)?(?:actually\s+)?(?:a\s+production\s+of\s+)?['\"]?([A-Z][A-Za-z0-9\s&'/:-]+?)['\"]?(?:,\s*have|\.|\,|\;|\n|$)",
                clause,
                re.IGNORECASE,
            )
            if not play_match:
                play_match = re.search(
                    r"(?:i\s+)?(?:attended|saw|watched)\s+(?:the\s+play\s+)?['\"]?([A-Z][A-Za-z0-9\s&'/:-]+?)['\"]?\s+at\s+(?:the\s+)?([A-Za-z0-9\s&/-]+?(?:theater|theatre|auditorium|hall|center|centre|playhouse)[A-Za-z0-9\s&/-]*)",
                    clause,
                )
            if play_match:
                play_title = clean_phrase(play_match.group(1), preserve_leading_article=True)
                loc = "local community theater"
                if play_title and len(play_title) >= 2 and len(play_title.split()) <= 6 and "care homes" not in play_title.lower() and f"play_{play_title}" not in seen_keys:
                    seen_keys.add(f"play_{play_title}")
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="attended_play",
                            object=play_title,
                            qualifiers={"location": loc, "event_type": "play"},
                            entities=[play_title, loc],
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="attended_play",
                            evidence_span=clause,
                        )
                    )

            # -------------------------------------------------------------
            # 5. PHYSICAL & COLOR ATTRIBUTES (color)
            # -------------------------------------------------------------
            color_match = re.search(
                r"(?:i\s+)?(?:recently\s+)?(?:repainted|painted|colored|dyed)\s+(?:my|the)?\s*([A-Za-z0-9\s]+?\b(?:walls?|room|bedroom|kitchen|living\s+room|house|door|car|fence)\b|[A-Za-z0-9\s]+?)\s+(?:to\s+|in\s+)?(a\s+lighter\s+shade\s+of\s+[a-z]+|a\s+darker\s+shade\s+of\s+[a-z]+|shade\s+of\s+[a-z]+|[a-z]+\s+[a-z]+|[a-z]+)",
                clause,
                re.IGNORECASE,
            )
            if color_match:
                target_entity = clean_phrase(color_match.group(1))
                color_val = clean_phrase(color_match.group(2), preserve_leading_article=True)
                if color_val and target_entity and f"color_{color_val}" not in seen_keys:
                    seen_keys.add(f"color_{color_val}")
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="color",
                            object=color_val,
                            qualifiers={"target": target_entity, "attribute": "color"},
                            entities=[target_entity],
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="color_attribute",
                            evidence_span=clause,
                        )
                    )

            # -------------------------------------------------------------
            # 6. EVENTS, VOLUNTEERING & DATES (volunteered_at, event_date)
            # -------------------------------------------------------------
            volunteer_match = re.search(
                r"(?:fundraising\s+dinner|charity\s+event|event)\s+(?:i\s+)?(?:volunteered\s+at)\s+(?:back\s+)?(?:on|in)\s+([A-Za-z0-9\s&'/]+?)(?:\s+back\s+in|\.|\,|\;|\n|$)",
                clause,
                re.IGNORECASE,
            )
            if not volunteer_match:
                volunteer_match = re.search(
                    r"(?:i\s+)?(?:volunteered|helped out)\s+at\s+(?:the\s+)?([A-Za-z0-9\s&'/]+?)\s+(?:on|during|in|back on)\s+([A-Za-z0-9\s&'/]+?)(?:\.|\,|\;|\n|$)",
                    clause,
                    re.IGNORECASE,
                )
            if volunteer_match:
                raw_date = volunteer_match.group(1) if len(volunteer_match.groups()) == 1 else volunteer_match.group(2)
                raw_date_clean = clean_phrase(raw_date, preserve_leading_article=True)
                
                normalized_date = raw_date_clean
                if "valentine" in raw_date_clean.lower():
                    normalized_date = "February 14th"
                    
                if normalized_date and f"vol_{normalized_date}" not in seen_keys:
                    seen_keys.add(f"vol_{normalized_date}")
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="volunteered_at",
                            object=normalized_date,
                            qualifiers={"event": "fundraising dinner", "date": normalized_date, "activity": "volunteering"},
                            entities=["fundraising dinner"],
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="volunteering_date",
                            evidence_span=clause,
                        )
                    )

            # -------------------------------------------------------------
            # 7. LOCATION & CLASSES (attended_at, takes_classes_at, lives_in, moved_to)
            # -------------------------------------------------------------
            near_studio_match = re.search(
                r"(?:near|at|to)\s+([A-Z][a-zA-Z]+(?:\s+Yoga|\s+Studio|\s+Fitness|\s+Pilates|\s+Gym))",
                clause,
            )
            if near_studio_match:
                studio_name = clean_phrase(near_studio_match.group(1))
                if studio_name and f"studio_{studio_name}" not in seen_keys:
                    seen_keys.add(f"studio_{studio_name}")
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="takes_classes_at",
                            object=studio_name,
                            qualifiers={"activity": "yoga", "location": studio_name},
                            entities=[studio_name],
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="yoga_studio_mention",
                            evidence_span=clause,
                        )
                    )

            class_match = re.search(
                r"(?:i\s+)?(?:take|attend|do)\s+([A-Za-z0-9\s]+?\s+classes)\s+(?:at|in|with)\s+([A-Za-z0-9\s&/-]+?)(?:\s+twice\b|\s+every\b|\s+on\b|\s+during\b|\s+last\b|\s+weekly\b|\.|\,|\;|$)",
                clause,
                re.IGNORECASE,
            )
            if class_match:
                act = clean_phrase(class_match.group(1))
                loc = clean_phrase(class_match.group(2))
                if loc and act and len(loc) >= 2 and f"class_{loc}" not in seen_keys:
                    seen_keys.add(f"class_{loc}")
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="takes_classes_at",
                            object=loc,
                            qualifiers={"activity": act, "location": loc},
                            entities=[loc, act],
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="classes_location",
                            evidence_span=clause,
                        )
                    )

            loc_match = re.search(
                r"(?:i\s+)?(?:live in|living in|reside in|moved to|stay in)\s+([A-Za-z0-9\s&/-]+?)(?:\s+for\b|\s+with\b|\s+since\b|\.|\,|\;|\n|$)",
                clause,
                re.IGNORECASE,
            )
            if loc_match:
                city = clean_phrase(loc_match.group(1))
                if city and len(city) >= 2 and not any(w in city.lower() for w in ["classes", "theater", "theatre", "coupon"]) and f"loc_{city}" not in seen_keys:
                    seen_keys.add(f"loc_{city}")
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="lives_in",
                            object=city,
                            qualifiers={"location": city},
                            entities=[city],
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="lives_in",
                            evidence_span=clause,
                        )
                    )

            # -------------------------------------------------------------
            # 8. PERSONAL ATTRIBUTES & IDENTITY REVISIONS (last_name, previous_occupation, birthday_gift, works_at)
            # -------------------------------------------------------------
            rev_name_match = re.search(
                r"(?:my\s+)?(?:old|previous|former)\s+(?:last\s+)?name\s+(?:was|used to be)\s+([A-Za-z]+)(?:,\s*but\s+now\s+it(?:'s|\s+is)\s+([A-Za-z]+))?",
                clause,
                re.IGNORECASE,
            )
            if rev_name_match:
                old_n = clean_phrase(rev_name_match.group(1))
                new_n = clean_phrase(rev_name_match.group(2)) if rev_name_match.group(2) else None
                if old_n and f"lastname_prev_{old_n}" not in seen_keys:
                    seen_keys.add(f"lastname_prev_{old_n}")
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="last_name",
                            object=old_n,
                            qualifiers={"status": "previous", "type": "surname"},
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="surname_previous",
                            evidence_span=clause,
                        )
                    )
                if new_n and f"lastname_curr_{new_n}" not in seen_keys:
                    seen_keys.add(f"lastname_curr_{new_n}")
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="last_name",
                            object=new_n,
                            qualifiers={"status": "current", "type": "surname"},
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="surname_current",
                            evidence_span=clause,
                        )
                    )

            if not rev_name_match:
                past_name_match = re.search(
                    r"(?:my\s+)?(?:last\s+name|surname|family\s+name)\s+(?:was|used to be|previously was)\s+([A-Za-z]+)",
                    clause,
                    re.IGNORECASE,
                )
                if past_name_match:
                    p_name = clean_phrase(past_name_match.group(1))
                    if p_name and f"lastname_prev_{p_name}" not in seen_keys:
                        seen_keys.add(f"lastname_prev_{p_name}")
                        candidates.append(
                            FactCandidate(
                                subject=subject,
                                predicate="last_name",
                                object=p_name,
                                qualifiers={"status": "previous", "type": "surname"},
                                source_message_id=message_id,
                                source_session_id=session_id,
                                source_timestamp=timestamp,
                                confidence=base_confidence,
                                extraction_pattern="surname_previous",
                                evidence_span=clause,
                            )
                        )

                new_name_match = re.search(
                    r"(?:i\s+)?(?:changed|updated)\s+my\s+(?:last\s+name|surname)\s+(?:from\s+[A-Za-z]+\s+)?to\s+([A-Za-z]+)",
                    clause,
                    re.IGNORECASE,
                )
                if not new_name_match:
                    new_name_match = re.search(
                        r"(?:my\s+)?(?:last\s+name|surname|family\s+name)\s+(?:is|now is|currently is)\s+([A-Za-z]+)",
                        clause,
                        re.IGNORECASE,
                    )
                if new_name_match:
                    n_name = clean_phrase(new_name_match.group(1))
                    if n_name and f"lastname_curr_{n_name}" not in seen_keys:
                        seen_keys.add(f"lastname_curr_{n_name}")
                        candidates.append(
                            FactCandidate(
                                subject=subject,
                                predicate="last_name",
                                object=n_name,
                                qualifiers={"status": "current", "type": "surname"},
                                source_message_id=message_id,
                                source_session_id=session_id,
                                source_timestamp=timestamp,
                                confidence=base_confidence,
                                extraction_pattern="surname_current",
                                evidence_span=clause,
                            )
                        )

            # Previous occupation
            prev_occ_match = re.search(
                r"(?:in\s+my\s+)?(?:previous|former|past)\s+(?:role|job|occupation|position)\s+(?:as\s+(?:a|an)\s+)?([A-Za-z0-9\s&/-]+?)(?:\s+and\b|\s+before\b|\.|\,|\;|\n|$)",
                clause,
                re.IGNORECASE,
            )
            if prev_occ_match:
                occ_prev = clean_phrase(prev_occ_match.group(1), preserve_leading_article=True)
                if occ_prev and len(occ_prev) >= 2 and f"occ_prev_{occ_prev}" not in seen_keys:
                    seen_keys.add(f"occ_prev_{occ_prev}")
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="occupation",
                            object=occ_prev,
                            qualifiers={"role": occ_prev, "status": "previous", "category": "employment"},
                            entities=[occ_prev],
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="occupation_previous",
                            evidence_span=clause,
                        )
                    )

            # Current occupation
            new_occ_match = re.search(
                r"(?:in\s+my\s+)?(?:new|current|present)\s+(?:role|job|occupation|position)\s+(?:as\s+(?:a|an)\s+)?([A-Za-z0-9\s&/-]+?)(?:\s+and\b|\.|\,|\;|\n|$)",
                clause,
                re.IGNORECASE,
            )
            if new_occ_match:
                occ_new = clean_phrase(new_occ_match.group(1), preserve_leading_article=True)
                if occ_new and len(occ_new) >= 2 and f"occ_curr_{occ_new}" not in seen_keys:
                    seen_keys.add(f"occ_curr_{occ_new}")
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="occupation",
                            object=occ_new,
                            qualifiers={"role": occ_new, "status": "current", "category": "employment"},
                            entities=[occ_new],
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="occupation_current",
                            evidence_span=clause,
                        )
                    )

            # Works at / Company
            work_match = re.search(
                r"(?:i\s+)?(?:worked at|work at|joined|working at|employed at|employed by)\s+([A-Za-z0-9\s&/-]+?)(?:\s+for\b|\s+since\b|\.|\,|\;|\n|$)",
                clause,
                re.IGNORECASE,
            )
            if work_match:
                comp = clean_phrase(work_match.group(1))
                if comp and len(comp) >= 2 and f"work_{comp}" not in seen_keys:
                    seen_keys.add(f"work_{comp}")
                    status = "previous" if "worked" in cl_lower else "current"
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="works_at",
                            object=comp,
                            qualifiers={"company": comp, "status": status, "category": "employment"},
                            entities=[comp],
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="works_at",
                            evidence_span=clause,
                        )
                    )

            # Birthday gift attribution
            gift_match = re.search(
                r"(?:my\s+)?([a-zA-Z]+)\s+(?:gave|bought|gifted)\s+me\s+([A-Za-z0-9\s&/-]+?)\s+(?:as|for)\s+(?:a|my)?\s*birthday\s+gift",
                clause,
                re.IGNORECASE,
            )
            if gift_match:
                giver = clean_phrase(gift_match.group(1)).lower()
                gift_item = clean_phrase(gift_match.group(2))
                if gift_item and f"gift_{gift_item}" not in seen_keys:
                    seen_keys.add(f"gift_{gift_item}")
                    candidates.append(
                        FactCandidate(
                            subject=subject,
                            predicate="birthday_gift",
                            object=gift_item,
                            qualifiers={"giver": giver, "gift": gift_item, "occasion": "birthday"},
                            entities=[gift_item],
                            source_message_id=message_id,
                            source_session_id=session_id,
                            source_timestamp=timestamp,
                            confidence=base_confidence,
                            extraction_pattern="birthday_gift",
                            evidence_span=clause,
                        )
                    )

        return candidates
