from app.models.schemas import TranscriptSegment
from app.trackers.config import Tracker
from app.trackers.matcher import match_trackers


def seg(speaker: str, text: str) -> TranscriptSegment:
    return TranscriptSegment(speaker=speaker, start=0.0, end=1.0, text=text)


def test_matches_keyword_case_insensitively():
    tracker = Tracker(id="refund", name="Refund request", keywords=["refund"])
    segments = [seg("customer", "I would like a REFUND please.")]
    matches = match_trackers("call-1", segments, [tracker])
    assert len(matches) == 1
    assert matches[0].tracker_id == "refund"
    assert matches[0].keyword == "refund"
    assert matches[0].segment_index == 0


def test_no_match_when_keyword_absent():
    tracker = Tracker(id="refund", name="Refund request", keywords=["refund"])
    segments = [seg("customer", "Everything is working great, thanks!")]
    assert match_trackers("call-1", segments, [tracker]) == []


def test_only_one_match_per_tracker_per_segment():
    tracker = Tracker(id="pricing", name="Pricing", keywords=["price", "cost"])
    segments = [seg("customer", "What's the price? Also what's the cost?")]
    matches = match_trackers("call-1", segments, [tracker])
    assert len(matches) == 1


def test_multiple_trackers_can_match_same_segment():
    trackers = [
        Tracker(id="pricing", name="Pricing", keywords=["price"]),
        Tracker(id="refund", name="Refund", keywords=["refund"]),
    ]
    segments = [seg("customer", "I want a refund on the price I paid.")]
    matches = match_trackers("call-1", segments, trackers)
    assert {m.tracker_id for m in matches} == {"pricing", "refund"}


def test_snippet_includes_surrounding_context():
    tracker = Tracker(id="escalation", name="Escalation", keywords=["manager"])
    segments = [seg("customer", "This is unacceptable, let me speak to your manager right now please.")]
    matches = match_trackers("call-1", segments, [tracker])
    assert "manager" in matches[0].snippet.lower()
