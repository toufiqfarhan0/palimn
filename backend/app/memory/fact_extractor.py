"""Deterministic fact extractor for natural language memory statements."""
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from backend.app.memory.models import Fact, MemoryStatus, Provenance


# Pattern library mapping regex to (predicate, object_extractor_index)
EXTRACTION_PATTERNS = [
    # -------------------------------------------------------------
    # EDUCATION
    # -------------------------------------------------------------
    (
        r"(?:graduated with a degree in|degree in|majored in|graduated in|degree of)\s+([A-Za-z0-9\s&/-]+?)(?:\.|\,|\band\b|\bwhich\b|\bfor\b|\n|$)",
        "graduated_with",
        1,
    ),
    (
        r"(?:bachelor(?:'s)? in|master(?:'s)? in|phd in)\s+([A-Za-z0-9\s&/-]+?)(?:\.|\,|\band\b|\bwhich\b|\bfor\b|\n|$)",
        "graduated_with",
        1,
    ),

    # -------------------------------------------------------------
    # WORK & OCCUPATION & COMMUTE
    # -------------------------------------------------------------
    (
        r"(?:daily commute to work is|commute to work is|daily commute is|commute is)\s+([A-Za-z0-9\s&/-]+?)(?:\.|\,|\band\b|\bwhich\b|\n|$)",
        "commute_duration",
        1,
    ),
    (
        r"(?:started working at|work at|work for|job at|employed at)\s+([A-Za-z0-9\s&/-]+?)(?:\.|\,|\band\b|\bwhich\b|\bfor\b|\n|$)",
        "works_at",
        1,
    ),
    (
        r"(?:my job is|work as a|work as an|role as a|role as an)\s+([A-Za-z0-9\s&/-]+?)(?:\.|\,|\band\b|\bwhich\b|\bfor\b|\n|$)",
        "job_title",
        1,
    ),

    # -------------------------------------------------------------
    # TRANSACTIONS, COUPONS & PURCHASES
    # -------------------------------------------------------------
    (
        r"(?:redeemed (?:a|the)?\s*\$[0-9]+(?:\s+coupon)?\s+(?:on|for)\s+[A-Za-z0-9\s]+?\s+(?:at|in)\s+([A-Za-z0-9\s&/-]+?))(?:\.|\,|\band\b|\bwhich\b|\bfor\b|\n|$)",
        "redeemed_coupon_at",
        1,
    ),
    (
        r"(?:redeemed (?:a|the)?\s*coupon\s+(?:on|for)\s+[A-Za-z0-9\s]+?\s+(?:at|in)\s+([A-Za-z0-9\s&/-]+?))(?:\.|\,|\band\b|\bwhich\b|\bfor\b|\n|$)",
        "redeemed_coupon_at",
        1,
    ),
    (
        r"(?:bought|purchased)\s+[A-Za-z0-9\s]+?\s+(?:at|from)\s+([A-Za-z0-9\s&/-]+?)(?:\.|\,|\band\b|\bwhich\b|\bfor\b|\n|$)",
        "purchased_at",
        1,
    ),

    # -------------------------------------------------------------
    # MEDIA, PLAYLISTS & ENTERTAINMENT
    # -------------------------------------------------------------
    (
        r"(?:playlist (?:i created on spotify|called|named|is called|is named))\s*[:\"]?\s*([A-Za-z0-9\s&/-]+?)(?:[\"\.]|\band\b|\bwhich\b|\bfor\b|\n|$)",
        "playlist_name",
        1,
    ),
    (
        r"(?:playlist on spotify (?:called|named|is))\s*[:\"]?\s*([A-Za-z0-9\s&/-]+?)(?:[\"\.]|\band\b|\bwhich\b|\bfor\b|\n|$)",
        "playlist_name",
        1,
    ),
    (
        r"(?:attended the play|watched the play|saw the play|play called|attended (?:the)?\s*play)\s*[:\"]?\s*([A-Za-z0-9\s&/-]+?)(?:[\"\.]|\band\b|\bat\b|\bwhich\b|\bfor\b|\n|$)",
        "attended_play",
        1,
    ),

    # -------------------------------------------------------------
    # LOCATION & TRAVEL (PHASE 2 COMPATIBLE)
    # -------------------------------------------------------------
    (
        r"(?:live in|living in|moved to|reside in)\s+([A-Za-z0-9\s&/-]+?)(?:\.|\,|\band\b|\bwhich\b|\bfor\b|\n|$)",
        "lives_in",
        1,
    ),
    (
        r"(?:visited|trip to|traveled to)\s+([A-Za-z0-9\s&/-]+?)(?:\.|\,|\band\b|\bwhich\b|\bfor\b|\n|$)",
        "visited",
        1,
    ),

    # -------------------------------------------------------------
    # PREFERENCES & FAVORITES
    # -------------------------------------------------------------
    (
        r"(?:my favorite|favorite)\s+([a-zA-Z]+)\s+is\s+([A-Za-z0-9\s&/-]+?)(?:\.|\,|\band\b|\bwhich\b|\bfor\b|\n|$)",
        "favorite_item",
        2,
    ),
]

TRAILING_CLEANUP_WORDS = {
    "which", "that", "and", "but", "with", "for", "in", "at", "to", "from",
    "on", "by", "as", "is", "a", "an", "the", "it", "during"
}


def clean_extracted_object(raw_obj: str) -> str:
    """Clean extracted object string from trailing punctuation and conjunctions."""
    cleaned = raw_obj.strip(" \t\n\r.,?!;:'\"()[]{}<>")
    tokens = cleaned.split()
    while tokens and tokens[-1].lower() in TRAILING_CLEANUP_WORDS:
        tokens.pop()
    return " ".join(tokens).strip(" \t\n\r.,?!;:'\"()[]{}<>")


class DeterministicFactExtractor:
    """Extracts structured Fact models from natural language conversation turns."""

    def __init__(self):
        self.patterns = EXTRACTION_PATTERNS

    def extract_from_message(
        self,
        content: str,
        session_id: str,
        message_id: str,
        timestamp: Optional[str] = None,
        role: str = "user",
        subject: str = "user",
    ) -> List[Fact]:
        """Run pattern library against text and return extracted Fact objects."""
        facts: List[Fact] = []
        if not content:
            return facts

        provenance = Provenance(
            session_id=session_id,
            message_id=message_id,
            timestamp=timestamp,
            snippet=content[:200],
        )

        for p_idx, (pattern_str, predicate, grp_idx) in enumerate(self.patterns):
            match = re.search(pattern_str, content, re.IGNORECASE)
            if match:
                raw_extracted = match.group(grp_idx)
                obj_val = clean_extracted_object(raw_extracted)
                if obj_val and len(obj_val) >= 2:
                    fact_id = f"fact_{session_id}_{len(facts)+1}_{p_idx}"
                    confidence = 0.95 if role == "user" else 0.75
                    
                    fact = Fact(
                        memory_id=fact_id,
                        subject=subject,
                        predicate=predicate,
                        object=obj_val,
                        session_id=session_id,
                        message_id=message_id,
                        created_at=timestamp or datetime.now().isoformat(),
                        valid_from=timestamp,
                        status=MemoryStatus.ACTIVE,
                        confidence=confidence,
                        provenance=provenance,
                    )
                    facts.append(fact)

        return facts
