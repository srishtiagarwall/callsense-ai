from pydantic import BaseModel

from app.models.schemas import TranscriptSegment


class TalkMetrics(BaseModel):
    agent_seconds: float
    customer_seconds: float
    agent_pct: float
    customer_pct: float
    longest_monologue_speaker: str | None
    longest_monologue_seconds: float
    interruption_count: int


def compute_talk_metrics(segments: list[TranscriptSegment]) -> TalkMetrics:
    if not segments:
        return TalkMetrics(
            agent_seconds=0.0,
            customer_seconds=0.0,
            agent_pct=0.0,
            customer_pct=0.0,
            longest_monologue_speaker=None,
            longest_monologue_seconds=0.0,
            interruption_count=0,
        )

    talk_seconds: dict[str, float] = {}
    longest_speaker: str | None = None
    longest_seconds = 0.0
    interruptions = 0

    prev_end: float | None = None
    prev_speaker: str | None = None

    # Consecutive segments from the same speaker (no gap for a different
    # speaker in between) form one continuous monologue.
    monologue_start: float | None = None
    monologue_speaker: str | None = None

    for segment in segments:
        duration = max(segment.end - segment.start, 0.0)
        talk_seconds[segment.speaker] = talk_seconds.get(segment.speaker, 0.0) + duration

        if prev_end is not None and segment.start < prev_end and segment.speaker != prev_speaker:
            interruptions += 1

        if segment.speaker == monologue_speaker:
            pass  # monologue continues
        else:
            if monologue_speaker is not None and prev_end is not None and monologue_start is not None:
                mono_len = prev_end - monologue_start
                if mono_len > longest_seconds:
                    longest_seconds = mono_len
                    longest_speaker = monologue_speaker
            monologue_speaker = segment.speaker
            monologue_start = segment.start

        prev_end = segment.end
        prev_speaker = segment.speaker

    if monologue_speaker is not None and monologue_start is not None and prev_end is not None:
        mono_len = prev_end - monologue_start
        if mono_len > longest_seconds:
            longest_seconds = mono_len
            longest_speaker = monologue_speaker

    agent_seconds = talk_seconds.get("agent", 0.0)
    customer_seconds = talk_seconds.get("customer", 0.0)
    total = agent_seconds + customer_seconds
    agent_pct = round(agent_seconds / total * 100, 1) if total > 0 else 0.0
    customer_pct = round(customer_seconds / total * 100, 1) if total > 0 else 0.0

    return TalkMetrics(
        agent_seconds=round(agent_seconds, 2),
        customer_seconds=round(customer_seconds, 2),
        agent_pct=agent_pct,
        customer_pct=customer_pct,
        longest_monologue_speaker=longest_speaker,
        longest_monologue_seconds=round(longest_seconds, 2),
        interruption_count=interruptions,
    )
