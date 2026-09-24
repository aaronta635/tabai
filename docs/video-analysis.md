# Video analysis — decided stack

Do not show red chips in the teacher queue until confidence is high. Wrong flags kill trust faster than no chips.

## Now (score-model V1)

**ffmpeg + `scripts/analyze.py`** still run on every approved take (duration, RMS, onsets, tempo stability, silence). When librosa is installed (Cloud Run image) and `ANALYZE_BACKEND` is not `stdlib`, onset/tempo come from librosa. Same JSON keys.

**Gemini train/compare** is enabled when `GEMINI_API_KEY` is set and the piece has a `ready` PieceModel:

1. `train_piece` reads whichever of sheet / tutorial is attached (they are independent), extracts versioned `scoreJson` + `tutorialCuesJson`, stores them in Postgres. Gemini File API ids are not the model (they expire in ~48h). Tutorial-only models skip invented bars; sheet-only models skip invented video cues.
2. `analyze` uploads only the student video, plus the saved JSON, and writes `Analysis.observationsJson`.
3. `draft` writes a Vietnamese queue reply from compare facts + retrieved teacher replies (SQL RAG). Close matches are praise-only. The teacher sends it.

If there is no ready model, analyze stores loudness metrics only, enqueues `train_piece` when a sheet or tutorial exists, and **does not draft**. Drafts start only after `score-compare-v1` observations exist. After train succeeds, those takes are re-analyzed. The teacher queue shows the latest draft, so a later compare draft replaces a metrics-only letter.

This overrides the earlier “raw video must not leave our storage” rule for train (tutorial) and compare (student take). See [`docs/decisions.md`](decisions.md).

## Next, when 20 videos exist

**librosa** (same worker, still not a service) for onset / tempo only — not pitch. Cloud Run worker sets `ANALYZE_BACKEND=librosa`.

## After a teacher says the flags are true

**Basic Pitch** (Spotify, `basic-pitch` Python) can fill the same `observationsJson` pitch issues. Runtime: `BASIC_PITCH=1`. Image: `--build-arg INSTALL_BASIC_PITCH=true`. Do not enable until a teacher confirms flags on stored videos. Gemini still writes the draft from those facts.

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
