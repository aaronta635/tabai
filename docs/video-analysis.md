# Video analysis — decided stack

Do not show red chips in the teacher queue until confidence is high. Wrong flags kill trust faster than no chips.

## Now (score-model V1)

**ffmpeg + `scripts/analyze.py` (Python stdlib)** still run on every approved take (duration, RMS, onsets, tempo stability, silence).

**Gemini train/compare** is enabled when `GEMINI_API_KEY` is set and the piece has a `ready` PieceModel:

1. `train_piece` reads sheet + tutorial, extracts versioned `scoreJson` + `tutorialCuesJson`, stores them in Postgres. Gemini File API ids are not the model (they expire in ~48h).
2. `analyze` uploads only the student video, plus the saved JSON, and writes `Analysis.observationsJson`.
3. `draft` writes a Vietnamese queue reply from compare facts + retrieved teacher replies (SQL RAG). The teacher sends it.

If there is no ready model, analyze behaves as audio-metrics-only.

This overrides the earlier “raw video must not leave our storage” rule for train (tutorial) and compare (student take). See [`docs/decisions.md`](decisions.md).

## Next, when 20 videos exist

**librosa** (same worker, still not a service) for onset / tempo only — not pitch.

## After a teacher says the flags are true

**Basic Pitch** (Spotify, `basic-pitch` Python) can fill the same `scoreJson` / `observationsJson` contract. Do not add it until a teacher confirms flags on stored videos.

Do not use CREPE (monophonic, chords break it).

## Later (v3, gated)

**MediaPipe Tasks Hand Landmarker** in the Python worker on sampled frames — not in the Facebook/Zalo WebView. Observations with low confidence become questions for the teacher, never chips.

## Rejected for this product

| Library | Why not |
|---|---|
| CREPE / pitch-only | Guitar is polyphonic + buzz + room |
| Browser MediaPipe | Unreliable in in-app WebViews |
| Whisper | Speech, not guitar notes |
| Custom fine-tune on 3 videos | Too little data; the saved artifact is PieceModel JSON |
