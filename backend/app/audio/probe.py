"""Audio duration probing.

mutagen handles most formats well but trusts a WAV file's RIFF/data chunk
size fields, which can be bogus placeholder values (some tools write
0xFFFFFFFF for streamed/unknown-length audio). When that happens mutagen
reports a wildly wrong duration (hours instead of seconds), so WAV files
get a manual chunk-scan fallback that derives duration from the actual
file size and the `fmt ` chunk's sample rate / channel / bit-depth fields
instead of trusting the declared sizes.
"""
import logging
import struct
from pathlib import Path

from mutagen import File as MutagenFile

logger = logging.getLogger(__name__)

_IMPLAUSIBLE_DURATION_SECONDS = 3600 * 4  # no call recording is 4+ hours


def _wav_duration_from_chunks(path: Path) -> float | None:
    try:
        data = path.read_bytes()
    except OSError:
        return None

    if len(data) < 44 or data[0:4] != b"RIFF" or data[8:12] != b"WAVE":
        return None

    channels = sample_rate = bits_per_sample = None
    offset = 12
    while offset + 8 <= len(data):
        chunk_id = data[offset : offset + 4]
        declared_size = struct.unpack("<I", data[offset + 4 : offset + 8])[0]
        chunk_start = offset + 8

        if chunk_id == b"fmt ":
            channels = struct.unpack("<H", data[chunk_start + 2 : chunk_start + 4])[0]
            sample_rate = struct.unpack("<I", data[chunk_start + 4 : chunk_start + 8])[0]
            bits_per_sample = struct.unpack("<H", data[chunk_start + 14 : chunk_start + 16])[0]
        elif chunk_id == b"data":
            # Trust the actual remaining file size over a possibly-bogus
            # declared chunk size (e.g. 0xFFFFFFFF placeholder).
            actual_remaining = len(data) - chunk_start
            data_size = declared_size if declared_size not in (0, 0xFFFFFFFF) and declared_size <= actual_remaining else actual_remaining

            if not (channels and sample_rate and bits_per_sample):
                return None
            bytes_per_second = sample_rate * channels * (bits_per_sample / 8)
            if bytes_per_second <= 0:
                return None
            return data_size / bytes_per_second

        # Chunks are padded to even byte boundaries.
        advance = declared_size + (declared_size % 2)
        if declared_size in (0, 0xFFFFFFFF) or advance <= 0:
            offset = chunk_start  # bail out of chunk-size-driven advancement, scan won't find `data` reliably
            break
        offset = chunk_start + advance

    return None


def get_duration_seconds(path: Path) -> float | None:
    try:
        audio = MutagenFile(path)
        if audio is not None and audio.info is not None:
            duration = audio.info.length
            if 0 < duration < _IMPLAUSIBLE_DURATION_SECONDS:
                return round(duration, 2)
    except Exception as exc:
        logger.warning("mutagen failed to probe duration for %s: %s", path, exc)

    if path.suffix.lower() == ".wav":
        fallback = _wav_duration_from_chunks(path)
        if fallback is not None and fallback > 0:
            return round(fallback, 2)

    logger.warning("Could not determine a plausible duration for %s", path)
    return None
