from app.analytics.talk_metrics import compute_talk_metrics
from app.models.schemas import TranscriptSegment


def seg(speaker: str, start: float, end: float, text: str = "x") -> TranscriptSegment:
    return TranscriptSegment(speaker=speaker, start=start, end=end, text=text)


def test_empty_segments_returns_zeroed_metrics():
    metrics = compute_talk_metrics([])
    assert metrics.agent_pct == 0.0
    assert metrics.customer_pct == 0.0
    assert metrics.interruption_count == 0
    assert metrics.longest_monologue_speaker is None


def test_talk_time_percentages_sum_to_100():
    segments = [seg("agent", 0, 5), seg("customer", 5, 15)]
    metrics = compute_talk_metrics(segments)
    assert metrics.agent_seconds == 5.0
    assert metrics.customer_seconds == 10.0
    assert round(metrics.agent_pct + metrics.customer_pct, 1) == 100.0
    assert metrics.agent_pct < metrics.customer_pct


def test_longest_monologue_spans_consecutive_same_speaker_segments():
    segments = [
        seg("agent", 0, 2),
        seg("agent", 2, 4),
        seg("agent", 4, 6),  # agent monologue: 0-6 (6s)
        seg("customer", 6, 8),  # customer monologue: 6-8 (2s)
    ]
    metrics = compute_talk_metrics(segments)
    assert metrics.longest_monologue_speaker == "agent"
    assert metrics.longest_monologue_seconds == 6.0


def test_no_interruptions_when_segments_are_sequential():
    segments = [seg("agent", 0, 5), seg("customer", 5, 10), seg("agent", 10, 15)]
    metrics = compute_talk_metrics(segments)
    assert metrics.interruption_count == 0


def test_interruption_detected_when_speaker_starts_before_prior_ends():
    segments = [seg("agent", 0, 10), seg("customer", 7, 12)]
    metrics = compute_talk_metrics(segments)
    assert metrics.interruption_count == 1


def test_same_speaker_overlap_is_not_an_interruption():
    segments = [seg("agent", 0, 5), seg("agent", 4, 8)]
    metrics = compute_talk_metrics(segments)
    assert metrics.interruption_count == 0
