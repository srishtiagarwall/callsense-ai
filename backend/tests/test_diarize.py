from pathlib import Path

import pytest

from app.diarization.diarize import diarize_transcript

SEEDED_STORAGE_DIR = Path(__file__).resolve().parent.parent / "storage"


def test_empty_text_returns_no_segments():
    assert diarize_transcript("") == []


def test_alternates_speaker_per_sentence():
    text = "Hello there. How are you? I am fine."
    segments = diarize_transcript(text)
    assert [s.speaker for s in segments] == ["agent", "customer", "agent"]


def test_segments_are_sequential_in_time():
    text = "First sentence here. Second sentence follows. Third one too."
    segments = diarize_transcript(text)
    for prev, nxt in zip(segments, segments[1:]):
        assert nxt.start >= prev.end


def test_segment_text_matches_original_sentences():
    text = "One. Two. Three."
    segments = diarize_transcript(text)
    assert [s.text for s in segments] == ["One.", "Two.", "Three."]


def test_single_sentence_has_minimum_duration():
    segments = diarize_transcript("Hi.")
    assert len(segments) == 1
    assert segments[0].end - segments[0].start >= 1.0


@pytest.mark.skipif(not SEEDED_STORAGE_DIR.exists(), reason="no seeded audio available locally")
def test_diarize_audio_smoke_on_real_wav():
    pytest.importorskip("resemblyzer")
    pytest.importorskip("webrtcvad")
    from app.diarization.audio_diarize import DiarizationError, diarize_audio

    wav_files = list(SEEDED_STORAGE_DIR.glob("*.wav"))
    if not wav_files:
        pytest.skip("no seeded .wav files present")

    text = (
        "This is a test sentence for diarization. Here is another sentence. "
        "And a third one to give the aligner something to work with."
    )
    try:
        segments = diarize_audio(wav_files[0], text)
    except DiarizationError:
        pytest.skip("audio didn't have enough distinguishable speech turns to diarize")

    assert all(s.speaker in ("agent", "customer") for s in segments)
    assert all(seg.end >= seg.start for seg in segments)
