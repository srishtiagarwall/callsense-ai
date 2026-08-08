import struct
from pathlib import Path

from app.audio.probe import get_duration_seconds


def _write_wav(path: Path, sample_rate: int, channels: int, bits_per_sample: int, num_samples: int, bogus_sizes: bool = False):
    bytes_per_sample = bits_per_sample // 8
    data_bytes = b"\x00" * (num_samples * channels * bytes_per_sample)

    fmt_chunk = (
        b"fmt "
        + struct.pack("<I", 16)
        + struct.pack("<H", 1)  # PCM
        + struct.pack("<H", channels)
        + struct.pack("<I", sample_rate)
        + struct.pack("<I", sample_rate * channels * bytes_per_sample)
        + struct.pack("<H", channels * bytes_per_sample)
        + struct.pack("<H", bits_per_sample)
    )
    data_chunk_size = 0xFFFFFFFF if bogus_sizes else len(data_bytes)
    data_chunk = b"data" + struct.pack("<I", data_chunk_size) + data_bytes

    riff_size = 0xFFFFFFFF if bogus_sizes else (4 + len(fmt_chunk) + len(data_chunk))
    content = b"RIFF" + struct.pack("<I", riff_size) + b"WAVE" + fmt_chunk + data_chunk
    path.write_bytes(content)


def test_probes_duration_of_well_formed_wav(tmp_path):
    path = tmp_path / "clean.wav"
    _write_wav(path, sample_rate=16000, channels=1, bits_per_sample=16, num_samples=16000 * 3)
    duration = get_duration_seconds(path)
    assert duration is not None
    assert abs(duration - 3.0) < 0.05


def test_falls_back_to_chunk_scan_for_malformed_riff_sizes(tmp_path):
    path = tmp_path / "malformed.wav"
    _write_wav(path, sample_rate=16000, channels=1, bits_per_sample=16, num_samples=16000 * 2, bogus_sizes=True)
    duration = get_duration_seconds(path)
    assert duration is not None
    assert abs(duration - 2.0) < 0.05


def test_returns_none_for_unreadable_file(tmp_path):
    path = tmp_path / "missing.wav"
    assert get_duration_seconds(path) is None


def test_returns_none_for_non_audio_file(tmp_path):
    path = tmp_path / "notes.txt"
    path.write_text("this is not audio")
    assert get_duration_seconds(path) is None
