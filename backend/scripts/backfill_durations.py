"""Populate duration_seconds for calls that predate the audio-duration probe."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.audio.probe import get_duration_seconds
from app.storage.stores import calls_store


def main() -> None:
    calls = [c for c in calls_store.list_all() if c.duration_seconds is None]
    print(f"{len(calls)} calls missing duration_seconds")

    for call in calls:
        duration = get_duration_seconds(Path(call.audio_path))
        if duration is None:
            print(f"  {call.id}: could not determine duration, skipping")
            continue
        call.duration_seconds = duration
        calls_store.upsert(call)
        print(f"  {call.id}: {duration}s")

    print("Done.")


if __name__ == "__main__":
    main()
