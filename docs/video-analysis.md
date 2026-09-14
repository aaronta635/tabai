# Video analysis — decided stack

Do not add a note-transcription library until a teacher confirms flags on 20 stored videos. Wrong red chips kill trust faster than no chips.

## Now (v1)

**ffmpeg + `scripts/analyze.py` (Python stdlib).**

Extract mono WAV, then duration, RMS envelope, energy onsets, tempo stability (IOI std), silence ratio. Target < 20s. This is already in the worker.

Skip librosa until the stdlib onset detector is clearly wrong on real phone takes.

## Next, when 20 videos exist

**librosa** (same worker, still not a service) for onset / tempo only — not pitch.

## After a teacher says the flags are true

**Basic Pitch** (Spotify, `basic-pitch` Python) for note events, then DTW to a reference take *offline first*. Promote into the draft prompt only for high-confidence, audio-only observations.

Do not use CREPE (monophonic, chords break it). Do not send video to the LLM.

## Later (v3, gated)

**MediaPipe Tasks Hand Landmarker** in the Python worker on sampled frames — not in the Facebook/Zalo WebView. Observations with low confidence become questions for the teacher, never chips.

## Rejected for this product

| Library | Why not |
|---|---|
| CREPE / pitch-only | Guitar is polyphonic + buzz + room |
| Cloud video APIs | Raw video must not leave our storage |
| Browser MediaPipe | Unreliable in in-app WebViews |
| Whisper | Speech, not guitar notes |
