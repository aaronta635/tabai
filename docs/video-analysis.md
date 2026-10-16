# Video analysis — decided stack

Do not show red chips in the teacher queue until confidence is high. Wrong flags kill trust faster than no chips.

## Now (score-model V1)

**ffmpeg + `scripts/analyze.py`** still run on every approved take (duration, RMS, onsets, tempo stability, silence). When librosa is installed (Cloud Run image) and `ANALYZE_BACKEND` is not `stdlib`, onset/tempo come from librosa. Same JSON keys.

**Gemini train/compare** is enabled when `GEMINI_API_KEY` is set and the piece has a `ready` PieceModel:

1. `train_piece` reads whichever of sheet / tutorial is attached (they are independent), extracts versioned `scoreJson` + `tutorialCuesJson`, stores them in Postgres. Gemini File API ids are not the model (they expire in ~48h). Tutorial-only models skip invented bars; sheet-only models skip invented video cues.
2. `analyze` uploads only the student video, plus the saved JSON, and writes `Analysis.observationsJson`.
3. `draft` waits until the teacher has marked every timed fact true or false, then writes a Vietnamese queue reply from the **true** facts + retrieved teacher replies (SQL RAG). Close matches and all-false bars get praise-only. The teacher sends it.

**Basic Pitch** is the pitch source when `BASIC_PITCH=1`. Train runs it on the **tutorial** and stores `tutorialCuesJson.pitch_notes`. Analyze runs it on the **take**. A lick is aligned to the tutorial with pitch-class DTW (a skipped or extra note does not slide the rest). A bar is created only when the expected pitch is missing from ±0.5s around that time. A 1-semitone miss stays quiet on purpose. If the whole take sits a constant number of semitones away, one key/capo bar replaces the per-note bars. A fret is read only for a note that still mismatches. The bar keeps the note name and adds `ngăn` when that frame shows the fret. Strings are not labeled. Chord songs drop a short isolated count-in, then cut where the chord root actually changes. Equal slices remain when that change is not clear. A different root is named when it fits (G instead of Am). Am versus A7 still needs C# and G. Too few notes, a Basic Pitch error, or an alignment that matches almost nothing sets `pitchJudge` to `weak`: the teacher sees that the take could not be judged, and those pitches do not become bars. Overlay version `pitch-overlay-v7`. `npm run bars:report` prints the false-bar rate from Đúng/Sai marks, grouped by piece, bar type, and overlay version. Local: `python3.11 -m pip install -r requirements-pitch.txt`. Optional `BASIC_PITCH_PYTHON=python3.11`. Image: `--build-arg INSTALL_BASIC_PITCH=true`. Gemini writes the draft only after the teacher marks every timed fact, and only from the bars marked true. A true chord fact is the chord name. A true lick fact is the note name plus fret when the frame had it. A weak judge must not be praised as a match.

If there is no ready model, analyze stores loudness metrics only, enqueues `train_piece` when a sheet or tutorial exists, and **does not draft**. Drafts start only after `score-compare-v1` observations exist. After train succeeds, those takes are re-analyzed. The teacher queue shows the latest draft, so a later compare draft replaces a metrics-only letter.

This overrides the earlier “raw video must not leave our storage” rule for train (tutorial) and compare (student take). See [`docs/decisions.md`](decisions.md).

## Next, when 20 videos exist

**JSON adjudicator** (not built): Gemini 3.1 Pro on overlay JSON + pitch notes, no extra video. Then **librosa** (same worker, still not a service) for onset / tempo as the timing source — overlay Gemini `type: timing` the way Basic Pitch overlays pitch. Cloud Run worker sets `ANALYZE_BACKEND=librosa`.

## Later (v3, gated)

**MediaPipe Tasks Hand Landmarker** in the Python worker on sampled frames — not in the Facebook/Zalo WebView. Observations with low confidence become questions for the teacher, never chips.

## Rejected for this product

| Library | Why not |
|---|---|
| CREPE / pitch-only | Guitar is polyphonic + buzz + room |
| Browser MediaPipe | Unreliable in in-app WebViews |
| Whisper | Speech, not guitar notes |
| Custom fine-tune on 3 videos | Too little data; the saved artifact is PieceModel JSON |
