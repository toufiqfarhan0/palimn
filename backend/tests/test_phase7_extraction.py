"""Phase 7 Unit tests verifying structured fact extraction on known failure cases."""
import pytest
from backend.app.memory.structured_extractor import StructuredFactExtractor
from backend.app.memory.temporal_resolver import TemporalResolver
from backend.app.retrieval.query_analyzer import QueryAnalyzer


@pytest.fixture
def extractor():
    return StructuredFactExtractor()


@pytest.fixture
def resolver():
    return TemporalResolver()


@pytest.fixture
def analyzer():
    return QueryAnalyzer()


def test_failure_case_1_education(extractor, resolver, analyzer):
    # 1. "What degree did I graduate with?" -> Business Administration
    msg = "I graduated with a degree in Business Administration from state university."
    candidates = extractor.extract_from_message(msg, "s1", "m1")
    assert any(c.predicate == "graduated_with" and "Business Administration" in c.object for c in candidates)
    
    intent = analyzer.analyze("What degree did I graduate with?")
    res = resolver.resolve_facts_for_query(candidates, intent)
    assert res.decision == "answerable"
    assert "Business Administration" in res.answer


def test_failure_case_2_commute_duration(extractor, resolver, analyzer):
    # 2. "How long is my daily commute to work?" -> 45 minutes each way
    msg = "My daily commute to work is 45 minutes each way because of highway traffic."
    candidates = extractor.extract_from_message(msg, "s1", "m1")
    assert any(c.predicate == "commute_duration" and c.object == "45 minutes each way" for c in candidates)
    
    intent = analyzer.analyze("How long is my daily commute to work?")
    res = resolver.resolve_facts_for_query(candidates, intent)
    assert res.decision == "answerable"
    assert res.answer == "45 minutes each way"


def test_failure_case_3_coupon_redemption(extractor, resolver, analyzer):
    # 3. "Where did I redeem a $5 coupon on coffee creamer?" -> Target
    msg = "Yesterday I redeemed a $5 coupon on coffee creamer at Target while grocery shopping."
    candidates = extractor.extract_from_message(msg, "s1", "m1")
    assert any(c.predicate == "redeemed_coupon" and c.object == "Target" for c in candidates)
    
    intent = analyzer.analyze("Where did I redeem a $5 coupon on coffee creamer?")
    res = resolver.resolve_facts_for_query(candidates, intent)
    assert res.decision == "answerable"
    assert res.answer == "Target"


def test_failure_case_4_attended_play(extractor, resolver, analyzer):
    # 4. "What play did I attend at the local community theater?" -> The Glass Menagerie
    msg = "I attended The Glass Menagerie at the local community theater last weekend."
    candidates = extractor.extract_from_message(msg, "s1", "m1")
    assert any(c.predicate == "attended_play" and "The Glass Menagerie" in c.object for c in candidates)
    
    intent = analyzer.analyze("What play did I attend at the local community theater?")
    res = resolver.resolve_facts_for_query(candidates, intent)
    assert res.decision == "answerable"
    assert "The Glass Menagerie" in res.answer


def test_failure_case_5_playlist_name(extractor, resolver, analyzer):
    # 5. "What is the name of the playlist I created on Spotify?" -> Summer Vibes
    msg = "I created a Spotify playlist called Summer Vibes for road trips."
    candidates = extractor.extract_from_message(msg, "s1", "m1")
    assert any(c.predicate == "playlist_name" and c.object == "Summer Vibes" for c in candidates)
    
    intent = analyzer.analyze("What is the name of the playlist I created on Spotify?")
    res = resolver.resolve_facts_for_query(candidates, intent)
    assert res.decision == "answerable"
    assert res.answer == "Summer Vibes"


def test_failure_case_6_identity_revision(extractor, resolver, analyzer):
    # 6. "What was my last name before I changed it?" -> Johnson
    msg = "My last name was Johnson before I changed my last name to Smith."
    candidates = extractor.extract_from_message(msg, "s1", "m1")
    
    intent = analyzer.analyze("What was my last name before I changed it?")
    res = resolver.resolve_facts_for_query(candidates, intent)
    assert res.decision == "answerable"
    assert res.answer == "Johnson"

    intent_now = analyzer.analyze("What is my last name now?")
    res_now = resolver.resolve_facts_for_query(candidates, intent_now)
    assert res_now.decision == "answerable"
    assert res_now.answer == "Smith"


def test_failure_case_7_yoga_classes(extractor, resolver, analyzer):
    # 7. "Where do I take yoga classes?" -> Serenity Yoga
    msg = "I take yoga classes at Serenity Yoga twice every week."
    candidates = extractor.extract_from_message(msg, "s1", "m1")
    assert any(c.predicate == "takes_classes_at" and c.object == "Serenity Yoga" for c in candidates)
    
    intent = analyzer.analyze("Where do I take yoga classes?")
    res = resolver.resolve_facts_for_query(candidates, intent)
    assert res.decision == "answerable"
    assert res.answer == "Serenity Yoga"


def test_failure_case_8_wall_color(extractor, resolver, analyzer):
    # 8. "What color did I repaint my bedroom walls?" -> a lighter shade of gray
    msg = "I repainted my bedroom walls a lighter shade of gray last Saturday."
    candidates = extractor.extract_from_message(msg, "s1", "m1")
    assert any(c.predicate == "color" and c.object == "a lighter shade of gray" for c in candidates)
    
    intent = analyzer.analyze("What color did I repaint my bedroom walls?")
    res = resolver.resolve_facts_for_query(candidates, intent)
    assert res.decision == "answerable"
    assert res.answer == "a lighter shade of gray"


def test_failure_case_9_volunteer_date(extractor, resolver, analyzer):
    # 9. "When did I volunteer at the local animal shelter's fundraising dinner?" -> February 14th
    msg = "I volunteered at the local animal shelter's fundraising dinner on February 14th."
    candidates = extractor.extract_from_message(msg, "s1", "m1")
    assert any(c.predicate == "volunteered_at" and c.object == "February 14th" for c in candidates)
    
    intent = analyzer.analyze("When did I volunteer at the local animal shelter's fundraising dinner?")
    res = resolver.resolve_facts_for_query(candidates, intent)
    assert res.decision == "answerable"
    assert res.answer == "February 14th"


def test_failure_case_10_purchase_location(extractor, resolver, analyzer):
    # 10. "Where did I buy my new tennis racket from?" -> the sports store downtown
    msg = "I bought my new tennis racket from the sports store downtown."
    candidates = extractor.extract_from_message(msg, "s1", "m1")
    assert any(c.predicate == "purchased_from" and "sports store downtown" in c.object for c in candidates)
    
    intent = analyzer.analyze("Where did I buy my new tennis racket from?")
    res = resolver.resolve_facts_for_query(candidates, intent)
    assert res.decision == "answerable"
    assert "sports store downtown" in res.answer


def test_failure_case_11_spent_amount(extractor, resolver, analyzer):
    # 11. "How much did I spend on a designer handbag?" -> $800
    msg = "I spent $800 on a designer handbag at the luxury boutique."
    candidates = extractor.extract_from_message(msg, "s1", "m1")
    assert any(c.predicate == "spent_amount" and c.object == "$800" for c in candidates)
    
    intent = analyzer.analyze("How much did I spend on a designer handbag?")
    res = resolver.resolve_facts_for_query(candidates, intent)
    assert res.decision == "answerable"
    assert res.answer == "$800"


def test_abstention_entity_mismatch(extractor, resolver, analyzer):
    # Abstention on gift from dad when source says gift was from sister
    msg = "My sister gave me a watch as a birthday gift."
    candidates = extractor.extract_from_message(msg, "s1", "m1")
    
    intent = analyzer.analyze("What did my dad gave me as a birthday gift?")
    res = resolver.resolve_facts_for_query(candidates, intent)
    assert res.decision == "abstain"
