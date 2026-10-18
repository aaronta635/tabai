#!/usr/bin/env python3
"""Audio metrics for a student take.

Stdlib RMS/onsets by default. When librosa is installed (Cloud Run image) and
ANALYZE_BACKEND is unset or `librosa`, onset/tempo come from librosa. Same JSON keys.
"""

from __future__ import annotations

import json
import math
import os
import struct
import subprocess
import sys
import tempfile
import wave


def extract_wav(src: str, dest: str) -> None:
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        src,
        "-vn",
        "-ac",
        "1",
        "-ar",
        "22050",
        "-sample_fmt",
        "s16",
        dest,
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def read_mono_wav(path: str) -> tuple[int, list[float]]:
    with wave.open(path, "rb") as wf:
        nch = wf.getnchannels()
        sw = wf.getsampwidth()
        rate = wf.getframerate()
        n = wf.getnframes()
        raw = wf.readframes(n)
    if sw != 2:
        raise RuntimeError("expected 16-bit pcm")
    samples = struct.unpack("<" + "h" * (len(raw) // 2), raw)
    if nch == 1:
        mono = [s / 32768.0 for s in samples]
    else:
        mono = []
        for i in range(0, len(samples), nch):
            mono.append(samples[i] / 32768.0)
    return rate, mono


def rms_frames(samples: list[float], rate: int, hop_s: float = 0.02) -> list[float]:
    hop = max(1, int(rate * hop_s))
    win = hop * 2
    out: list[float] = []
    for i in range(0, max(1, len(samples) - win), hop):
        chunk = samples[i : i + win]
        acc = sum(x * x for x in chunk) / len(chunk)
        out.append(math.sqrt(acc))
    return out or [0.0]


def onsets(rms: list[float], hop_s: float) -> list[float]:
    if len(rms) < 4:
        return []
    mean = sum(rms) / len(rms)
    thresh = mean * 1.6
    times: list[float] = []
    last = -1.0
    for i in range(1, len(rms)):
        if rms[i] > thresh and rms[i] > rms[i - 1] * 1.25:
            t = i * hop_s
            if t - last > 0.12:
                times.append(t)
                last = t
    return times


def metrics_stdlib(samples: list[float], rate: int) -> dict:
    hop_s = 0.02
    duration_s = len(samples) / float(rate) if rate else 0.0
    rms = rms_frames(samples, rate, hop_s)
    rms_mean = sum(rms) / len(rms)
    rms_var = sum((x - rms_mean) ** 2 for x in rms) / len(rms)
    silence_cut = max(0.01, rms_mean * 0.25)
    silence_ratio = sum(1 for x in rms if x < silence_cut) / len(rms)
    times = onsets(rms, hop_s)
    iois = [times[i] - times[i - 1] for i in range(1, len(times))]
    if len(iois) >= 4:
        ioi_mean = sum(iois) / len(iois)
        ioi_std = math.sqrt(sum((x - ioi_mean) ** 2 for x in iois) / len(iois))
        tempo_bpm = 60.0 / ioi_mean if ioi_mean > 0 else None
        tempo_stability = ioi_std
    else:
        tempo_bpm = None
        tempo_stability = None
    return {
        "backend": "stdlib",
        "duration_s": round(duration_s, 3),
        "rms_mean": round(rms_mean, 5),
        "rms_std": round(math.sqrt(rms_var), 5),
        "silence_ratio": round(silence_ratio, 4),
        "onset_count": len(times),
        "tempo_bpm": None if tempo_bpm is None else round(tempo_bpm, 2),
        "tempo_stability": None if tempo_stability is None else round(tempo_stability, 4),
    }


def metrics_librosa(wav_path: str) -> dict | None:
    try:
        import librosa  # type: ignore
        import numpy as np  # type: ignore
    except ImportError:
        return None
    y, sr = librosa.load(wav_path, sr=22050, mono=True)
    duration_s = float(len(y) / sr) if sr else 0.0
    hop = 512
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    rms_mean = float(np.mean(rms)) if len(rms) else 0.0
    rms_std = float(np.std(rms)) if len(rms) else 0.0
    silence_cut = max(0.01, rms_mean * 0.25)
    silence_ratio = float(np.mean(rms < silence_cut)) if len(rms) else 0.0
    onset_frames = librosa.onset.onset_detect(y=y, sr=sr, units="frames")
    times = librosa.frames_to_time(onset_frames, sr=sr)
    tempo_bpm = None
    tempo_stability = None
    if len(times) >= 5:
        iois = np.diff(times)
        if len(iois) >= 4 and float(np.mean(iois)) > 0:
            tempo_bpm = float(60.0 / np.mean(iois))
            tempo_stability = float(np.std(iois))
    beat_tempo = librosa.beat.tempo(y=y, sr=sr)
    if beat_tempo is not None and len(beat_tempo):
        tempo_bpm = float(beat_tempo[0])
    return {
        "backend": "librosa",
        "duration_s": round(duration_s, 3),
        "rms_mean": round(rms_mean, 5),
        "rms_std": round(rms_std, 5),
        "silence_ratio": round(silence_ratio, 4),
        "onset_count": int(len(times)),
        "tempo_bpm": None if tempo_bpm is None else round(tempo_bpm, 2),
        "tempo_stability": None if tempo_stability is None else round(tempo_stability, 4),
    }


def want_librosa() -> bool:
    backend = os.environ.get("ANALYZE_BACKEND", "auto").strip().lower()
    if backend in {"stdlib", "std"}:
        return False
    return True


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: analyze.py <video>", file=sys.stderr)
        return 2
    src = sys.argv[1]
    fd, wav_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    try:
        extract_wav(src, wav_path)
        if want_librosa():
            lib = metrics_librosa(wav_path)
            if lib is not None:
                print(json.dumps(lib, ensure_ascii=True))
                return 0
        rate, samples = read_mono_wav(wav_path)
        print(json.dumps(metrics_stdlib(samples, rate), ensure_ascii=True))
        return 0
    finally:
        try:
            os.remove(wav_path)
        except OSError:
            pass


if __name__ == "__main__":
    raise SystemExit(main())
