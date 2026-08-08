import re

from app.models.schemas import TranscriptSegment

_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")

# Last-resort fallback when audio-based diarization (app.diarization.audio_diarize)
# fails or isn't possible (e.g. mono-speaker audio, unreadable file, <2 detected
# turns). Alternates speakers per sentence with no real speaker information.


def diarize_transcript(text: str, avg_seconds_per_word: float = 0.4) -> list[TranscriptSegment]:
    sentences = [s.strip() for s in _SENTENCE_SPLIT.split(text) if s.strip()]
    if not sentences:
        return []

    segments: list[TranscriptSegment] = []
    cursor = 0.0
    for i, sentence in enumerate(sentences):
        word_count = len(sentence.split())
        duration = max(word_count * avg_seconds_per_word, 1.0)
        speaker = "agent" if i % 2 == 0 else "customer"
        segments.append(
            TranscriptSegment(
                speaker=speaker,
                start=round(cursor, 2),
                end=round(cursor + duration, 2),
                text=sentence,
            )
        )
        cursor += duration

    return segments
