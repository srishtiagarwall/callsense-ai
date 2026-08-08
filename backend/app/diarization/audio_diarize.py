"""Real speaker diarization: VAD turn-detection + speaker-embedding clustering.

Pipeline: webrtcvad finds speech/silence turn boundaries in the raw audio,
resemblyzer embeds each turn into a speaker-identity vector, and
AgglomerativeClustering groups turns into 2 speakers (agent/customer — this
codebase only handles 2-party calls). None of the transcription providers
return word-level timestamps, so transcript sentences are aligned onto the
detected turns by matching each sentence's position in the text to the turn
whose time range it falls into (proportionally, by cumulative word count).
"""
import re
from pathlib import Path

import librosa
import numpy as np
import webrtcvad
from resemblyzer import VoiceEncoder, preprocess_wav
from sklearn.cluster import AgglomerativeClustering

from app.models.schemas import TranscriptSegment

_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")

_SAMPLE_RATE = 16000
_FRAME_MS = 30
_VAD_AGGRESSIVENESS = 2
_MIN_TURN_SECONDS = 0.3
_SILENCE_GAP_FRAMES = 5  # ~150ms of silence ends a turn

_encoder: VoiceEncoder | None = None


class DiarizationError(Exception):
    pass


def _get_encoder() -> VoiceEncoder:
    global _encoder
    if _encoder is None:
        _encoder = VoiceEncoder()
    return _encoder


def _detect_turns(audio: np.ndarray, sr: int) -> list[tuple[float, float]]:
    vad = webrtcvad.Vad(_VAD_AGGRESSIVENESS)
    frame_len = int(sr * _FRAME_MS / 1000)
    pcm16 = (audio * 32768).clip(-32768, 32767).astype(np.int16).tobytes()
    bytes_per_frame = frame_len * 2

    speech_flags = [
        vad.is_speech(pcm16[i : i + bytes_per_frame], sr)
        for i in range(0, len(pcm16) - bytes_per_frame, bytes_per_frame)
    ]

    turns: list[tuple[float, float]] = []
    in_turn = False
    turn_start = 0.0
    silence_run = 0
    for idx, is_speech in enumerate(speech_flags):
        t = idx * _FRAME_MS / 1000.0
        if is_speech:
            if not in_turn:
                in_turn = True
                turn_start = t
            silence_run = 0
        elif in_turn:
            silence_run += 1
            if silence_run > _SILENCE_GAP_FRAMES:
                turns.append((turn_start, t - silence_run * _FRAME_MS / 1000.0))
                in_turn = False
                silence_run = 0
    if in_turn:
        turns.append((turn_start, len(speech_flags) * _FRAME_MS / 1000.0))

    return [(s, e) for s, e in turns if e - s > _MIN_TURN_SECONDS]


def _cluster_speakers(audio: np.ndarray, sr: int, turns: list[tuple[float, float]]) -> list[str]:
    encoder = _get_encoder()
    embeddings = []
    valid_indices = []
    for i, (s, e) in enumerate(turns):
        clip = audio[int(s * sr) : int(e * sr)]
        wav = preprocess_wav(clip, source_sr=sr)
        if len(wav) == 0:
            continue
        embeddings.append(encoder.embed_utterance(wav))
        valid_indices.append(i)

    if len(embeddings) < 2:
        raise DiarizationError("Not enough embeddable speech turns to cluster speakers")

    labels = AgglomerativeClustering(n_clusters=2).fit_predict(np.array(embeddings))

    # First-clustered speaker is assumed to be the agent (typically opens the call).
    speaker_by_index = {idx: ("agent" if label == labels[0] else "customer") for idx, label in zip(valid_indices, labels)}
    return [speaker_by_index.get(i, "customer") for i in range(len(turns))]


def _align_sentences_to_turns(text: str, turns: list[tuple[float, float]], speakers: list[str]) -> list[TranscriptSegment]:
    sentences = [s.strip() for s in _SENTENCE_SPLIT.split(text) if s.strip()]
    if not sentences:
        return []

    total_words = sum(len(s.split()) for s in sentences) or 1
    call_end = turns[-1][1]

    segments: list[TranscriptSegment] = []
    cumulative_words = 0
    for sentence in sentences:
        word_count = len(sentence.split())
        frac_start = cumulative_words / total_words
        frac_end = (cumulative_words + word_count) / total_words
        cumulative_words += word_count

        sentence_start = frac_start * call_end
        sentence_end = frac_end * call_end

        # Speaker = turn whose midpoint is closest to this sentence's midpoint.
        sentence_mid = (sentence_start + sentence_end) / 2
        closest_turn_idx = min(
            range(len(turns)),
            key=lambda i: abs((turns[i][0] + turns[i][1]) / 2 - sentence_mid),
        )

        segments.append(
            TranscriptSegment(
                speaker=speakers[closest_turn_idx],
                start=round(sentence_start, 2),
                end=round(sentence_end, 2),
                text=sentence,
            )
        )

    return segments


def diarize_audio(audio_path: Path, text: str) -> list[TranscriptSegment]:
    try:
        audio, sr = librosa.load(str(audio_path), sr=_SAMPLE_RATE, mono=True)
    except Exception as exc:
        raise DiarizationError(f"Could not load audio: {exc}") from exc

    turns = _detect_turns(audio, sr)
    if len(turns) < 2:
        raise DiarizationError("Fewer than 2 speech turns detected — cannot diarize")

    speakers = _cluster_speakers(audio, sr, turns)
    return _align_sentences_to_turns(text, turns, speakers)
