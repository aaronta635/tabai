#!/usr/bin/env python3
"""Extract note events from a WAV with Spotify Basic Pitch. Off unless the worker calls this."""

from __future__ import annotations

import io
import json
import sys
from contextlib import redirect_stderr, redirect_stdout


def midi_name(midi: float) -> str:
    names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    rounded = int(round(midi))
    # MIDI 60 = C4
    return f"{names[rounded % 12]}{(rounded // 12) - 1}"


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

    try:
        sink = io.StringIO()
        with redirect_stdout(sink), redirect_stderr(sink):
            _model_output, _midi, note_events = predict(wav_path)
    except Exception as exc:  # noqa: BLE001 — return JSON so the worker can keep compare
        print(json.dumps({"error": str(exc), "notes": []}))
        return 0

    notes = []
    for event in note_events or []:
        amplitude = 1.0
        if isinstance(event, dict):
            start = float(event.get("start_time_s") or event.get("start") or 0)
            end = float(event.get("end_time_s") or event.get("end") or start)
            pitch = float(event.get("pitch_midi") or event.get("pitch") or 0)
            amplitude = float(event.get("amplitude") or event.get("velocity") or 1)
        else:
            start = float(event[0])
            end = float(event[1]) if len(event) > 1 else start
            pitch = float(event[2]) if len(event) > 2 else 0.0
            if len(event) > 3:
                try:
                    amplitude = float(event[3])
                except (TypeError, ValueError):
                    amplitude = 1.0
        if end - start < 0.08:
            continue
        if amplitude < 0.25:
            continue
        notes.append(
            {
                "tStart": round(start, 3),
                "tEnd": round(end, 3),
                "midi": round(pitch, 2),
                "name": midi_name(pitch),
            }
        )
    notes.sort(key=lambda row: row["tStart"])
    print(json.dumps({"notes": notes[:96], "backend": "basic-pitch"}, ensure_ascii=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
