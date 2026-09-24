#!/usr/bin/env python3
"""Extract note events from a WAV with Spotify Basic Pitch. Off unless the worker calls this."""

from __future__ import annotations

import json
import sys


def midi_name(midi: float) -> str:
    names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    rounded = int(round(midi))
    return f"{names[rounded % 12]}{rounded // 12}"


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: basic_pitch_notes.py <wav>", file=sys.stderr)
        return 2
    wav_path = sys.argv[1]
    try:
        from basic_pitch.inference import predict  # type: ignore
    except ImportError:
        print(json.dumps({"error": "basic-pitch not installed", "notes": []}))
        return 0

    _model_output, _midi, note_events = predict(wav_path)
    notes = []
    for event in note_events or []:
        if isinstance(event, dict):
            start = float(event.get("start_time_s") or event.get("start") or 0)
            end = float(event.get("end_time_s") or event.get("end") or start)
            pitch = float(event.get("pitch_midi") or event.get("pitch") or 0)
        else:
            start = float(event[0])
            end = float(event[1]) if len(event) > 1 else start
            pitch = float(event[2]) if len(event) > 2 else 0.0
        notes.append(
            {
                "tStart": round(start, 3),
                "tEnd": round(end, 3),
                "midi": round(pitch, 2),
                "name": midi_name(pitch),
            }
        )
    notes.sort(key=lambda row: row["tStart"])
    print(json.dumps({"notes": notes[:64]}, ensure_ascii=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
