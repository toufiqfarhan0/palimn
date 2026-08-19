"""Deterministic query normalization and concept extraction."""
import re
from typing import Dict, List, Set, Tuple

STOP_WORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can", "can't", "cannot", "could",
    "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down",
    "during", "each", "few", "for", "from", "further", "had", "hadn't", "has",
    "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her",
    "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's",
    "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it",
    "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
    "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
    "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't",
    "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
    "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
    "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
    "they've", "this", "those", "through", "to", "too", "under", "until", "up",
    "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which",
    "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
    "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
    "yourself", "yourselves"
}

# Deterministic morphological variant map for consistent concept extraction
STEM_MAP: Dict[str, str] = {
    # Education
    "graduated": "graduat",
    "graduate": "graduat",
    "graduating": "graduat",
    "graduation": "graduat",
    "degrees": "degree",
    "degree": "degree",
    "majored": "major",
    "majoring": "major",
    "major": "major",
    "majors": "major",
    "studied": "studi",
    "studying": "studi",
    "study": "studi",
    "studies": "studi",
    "university": "univers",
    "universities": "univers",
    "college": "colleg",
    "colleges": "colleg",
    
    # Location / Travel
    "lived": "live",
    "lives": "live",
    "living": "live",
    "live": "live",
    "moved": "move",
    "moving": "move",
    "moves": "move",
    "move": "move",
    "resided": "resid",
    "resides": "resid",
    "residing": "resid",
    "reside": "resid",
    "visited": "visit",
    "visiting": "visit",
    "visits": "visit",
    "visit": "visit",
    "traveled": "travel",
    "traveling": "travel",
    "travel": "travel",
    
    # Commute / Work
    "commute": "commut",
    "commuting": "commut",
    "commutes": "commut",
    "commuted": "commut",
    "worked": "work",
    "working": "work",
    "works": "work",
    "work": "work",
    "employed": "employ",
    "employment": "employ",
    "company": "compani",
    "companies": "compani",
    
    # Transactions / Purchases
    "redeemed": "redeem",
    "redeeming": "redeem",
    "redeems": "redeem",
    "redeem": "redeem",
    "bought": "bought",
    "buy": "buy",
    "buying": "buy",
    "purchased": "purchas",
    "purchasing": "purchas",
    "purchase": "purchas",
    "coupons": "coupon",
    "coupon": "coupon",
    
    # Media / Entertainment
    "playlist": "playlist",
    "playlists": "playlist",
    "created": "creat",
    "creating": "creat",
    "creates": "creat",
    "create": "creat",
    "attended": "attend",
    "attending": "attend",
    "attends": "attend",
    "attend": "attend",
    "watched": "watch",
    "watching": "watch",
    "watches": "watch",
    "watch": "watch",
    "theater": "theater",
    "theatre": "theater",
    "theaters": "theater",
    "theatres": "theater",
}


def normalize_token(token: str) -> str:
    """Strip punctuation and lowercase."""
    return token.lower().strip(".,?!;:'\"()[]{}<>`~@#$%^&*-_+=/\\|")


def stem_token(token: str) -> str:
    """Return deterministic morphological root of a token."""
    cleaned = normalize_token(token)
    if cleaned in STEM_MAP:
        return STEM_MAP[cleaned]
    # Suffix stripping rules for regular plurals and common inflections
    if len(cleaned) > 4 and cleaned.endswith("ing"):
        return cleaned[:-3]
    if len(cleaned) > 4 and cleaned.endswith("ed"):
        return cleaned[:-2]
    if len(cleaned) > 3 and cleaned.endswith("s") and not cleaned.endswith("ss"):
        return cleaned[:-1]
    return cleaned


def normalize_query_text(text: str) -> str:
    """Normalize raw query text into clean lowercase tokenized form."""
    cleaned = re.sub(r"[^\w\s\$\-\']", " ", text)
    return " ".join(cleaned.lower().split())


def extract_query_concepts(query: str) -> Tuple[List[str], List[str], Dict[str, float]]:
    """Extract keywords, stemmed concepts, and term weights from query text.
    
    Returns:
        Tuple of (keywords, stemmed_concepts, term_weights)
    """
    normalized = normalize_query_text(query)
    raw_tokens = [t for t in normalized.split() if t]
    
    keywords: List[str] = []
    stemmed_concepts: List[str] = []
    term_weights: Dict[str, float] = {}

    for token in raw_tokens:
        clean_t = normalize_token(token)
        if not clean_t or clean_t in STOP_WORDS:
            continue
            
        stem = stem_token(clean_t)
        keywords.append(clean_t)
        stemmed_concepts.append(stem)
        
        # Term weighting calculation
        weight = 1.0
        # Longer terms / domain terms get higher weight
        if len(clean_t) >= 6:
            weight += 0.5
        # Numbers or currency symbols get higher weight
        if any(c.isdigit() for c in clean_t) or "$" in clean_t:
            weight += 1.0
            
        term_weights[clean_t] = weight
        term_weights[stem] = weight

    return keywords, stemmed_concepts, term_weights
