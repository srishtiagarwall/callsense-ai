import re

from app.models.schemas import TrackerMatch, TranscriptSegment
from app.trackers.config import Tracker


def _find_keyword_snippet(text: str, keyword: str) -> str | None:
    pattern = re.compile(re.escape(keyword), re.IGNORECASE)
    match = pattern.search(text)
    if not match:
        return None
    start = max(match.start() - 30, 0)
    end = min(match.end() + 30, len(text))
    return text[start:end].strip()


def match_trackers(call_id: str, segments: list[TranscriptSegment], trackers: list[Tracker]) -> list[TrackerMatch]:
    matches: list[TrackerMatch] = []
    for segment_index, segment in enumerate(segments):
        for tracker in trackers:
            for keyword in tracker.keywords:
                snippet = _find_keyword_snippet(segment.text, keyword)
                if snippet is not None:
                    matches.append(
                        TrackerMatch(
                            call_id=call_id,
                            tracker_id=tracker.id,
                            keyword=keyword,
                            segment_index=segment_index,
                            snippet=snippet,
                        )
                    )
                    break  # one match per tracker per segment is enough
    return matches
