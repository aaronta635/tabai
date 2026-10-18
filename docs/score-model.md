# Score-model V1 — contracts for UI agents

This slice is schema, worker, CLI, and prompts. Do not block on new screens. The teacher queue already shows `Draft.text`.

## Train / attach (shared with CLI)

```ts
import { attachPieceAssets, enqueueTrainPiece, getReadyPieceModel } from "@/lib/catalog";
```

- `attachPieceAssets({ pieceId, sheet?, tutorial? })` uploads to Storage, sets `Piece.sheetMediaId` / `Piece.tutorialMediaId`, and points `referenceMediaId` at the tutorial so `/l/<code>` can play it.
- `enqueueTrainPiece(pieceId)` requires a sheet **or** a tutorial (both is better, neither is not enough). Worker job type `train_piece` (no `submissionId`). Adding the other asset later trains a new version.
- `getReadyPieceModel(pieceId)` returns the latest `status: ready` version.

Catalog drop path (no UI): see [`catalog/README.md`](../catalog/README.md). `npm run catalog:train`.

## Models worth reading

- `PieceModel.status`: `training | ready | failed`
- `PieceModel.scoreJson`: `{ title, key, tempoBpm, timeSignature, barCount, sections[], techniqueFocus[], commonMistakes[] }`
- `PieceModel.tutorialCuesJson`: `{ cues: [...], pitch_notes?: Basic Pitch events from the tutorial }`
- `Analysis.observationsJson`: `{ overallFit, confidence, positives[], issues[], nextPractice, pitchJudge? }`. `pitchJudge: "weak"` means the pitch path refused to judge the take.
- `Analysis.metricsJson.heard_extract`: same shape as a train extract (`score` fields + `tutorialCues`) — a **chart of this take’s video**, not a listen log. Prompt `extract_take-v2` writes chord symbols as `topic`, not “Heard …”.
- `Analysis.metricsJson.pitch_notes`: Basic Pitch events `{ tStart, tEnd, midi, name, fret?, visible? }` from **this take**. Tutorial notes on `tutorialCuesJson.pitch_notes` can carry the same fret fields. When `BASIC_PITCH=1`, a lick is aligned with pitch-class DTW, then a bar is created only when the expected pitch is missing from a ±0.5s window. A 1-semitone miss stays quiet. A constant shift becomes one key/capo bar. A fret is read only for a note that still mismatches, and the bar adds `ngăn` when the frame is clear. Chord changes are detected when they are stable; otherwise the cue is split into equal slices after a count-in is dropped. A different root can be named (G instead of Am). Am versus A7 still needs G. Too few notes, a pitch error, or a failed alignment sets `pitchJudge` to `weak` and makes no pitch bars. Overlay version `pitch-overlay-v7`.
- `Analysis.pipelineVersion`: `audio-metrics-v1` or `score-compare-v1`

Issue types: `timing | pitch | chord | technique | missing`.

## Queue / student UI (optional later)

- Keep showing `Draft.text`. Teacher sends; nothing auto-sends to the student.
- Take page fact bars: every issue with `tStart` is a seek button (`0:05 · Am vs C#`) plus true/false. Verdicts write `issues[].verdict` / `verdictAt` on `observationsJson` (no new table). The letter stays hidden until every bar is marked. Draft then uses only `verdict: true` issues (false drops out). Analyze does not draft while bars are still unmarked.
- Drafts include clock times (`0:12`) from `tStart` / `tEnd`. Compare must fill `tStart` on every issue.
- Student `/l/<code>` already plays `referenceMedia` — tutorial attach is enough.

## Next PR — JSON adjudicator (not built yet)

After overlay, before draft: Gemini 3.1 Pro (`GEMINI_MODEL_VERIFY`, default train model) reviews overlay issues + a short pitch-note window + chord list. **No second video upload.** Per issue: `keep` / `drop` / `uncertain`. Dropped issues never become bars or draft facts. Then librosa onset overlay for `type: timing`, same pattern as Basic Pitch for pitch.

## RAG drafts (v1.1)

Drafts pull: compare facts, matching score/tutorial bars, this student's last reply, up to 5 teacher replies on the same piece, and up to 3 replies with the same issue types. Teacher sends still teach the next draft. Fine-tuning waits until hundreds of sent replies exist.

Close takes (`overallFit >= 0.9` and no issue at `confidence >= 0.75`) get praise-only drafts. The same media as the tutorial is forced to `issues: []`. Metrics must not invent a timing problem on a close match.

Without a ready PieceModel, do not draft from `silence_ratio` / `tempo_stability`. Prompt `draft_reply_vi-v8` forbids khoảng lặng / nhịp / cảm xúc padding. A true chord fact is written as the chord name. A true lick fact keeps the note name and adds the fret only when the frame read had it. Analyze enqueues train if a sheet or tutorial is present, then train re-enqueues those takes for compare. Analyze does not enqueue draft while timed facts still need Đúng/Sai.

Gemini thinking on drafts is `MINIMAL` so the visible reply is not eaten by hidden reasoning tokens. Compare uses `LOW`. Train (once per song) uses `HIGH`. If a tutorial is attached and `tutorialCues` is empty, `npm run catalog:train -- --retrain`.

## Cost (paid Gemini API list, Sep 2026)

No new host for RAG. Same Railway web + worker and Supabase Postgres/Storage. Retrieval is extra SQL on `Reply` / `PieceModel` you already store.

Rates used: Gemini 3.5 Flash **$1.50 / 1M input, $9 / 1M output** (thinking billed as output). Gemini 3.1 Pro Preview **$2 / 1M input, $12 / 1M output** (prompts ≤ 200k). Video ~**300 tokens/s** at default resolution (~100/s if you later set low media resolution).

| Step | Model | Typical size | Approx USD |
|---|---|---|---|
| Train one song (once) | 3.1 Pro | ~3 min tutorial + sheet, HIGH thinking | $0.12–$0.30 |
| Compare one 60s take | 3.5 Flash | ~18k video tokens + short JSON | $0.03–$0.06 |
| Draft + RAG | 3.5 Flash | ~2–4k text in, ~200 visible out | < $0.01 |

**100 takes/month:** about **$4–$8** Gemini (compare is ~90% of that) + a few dollars the first time you train 3 songs. **1,000 takes/month:** about **$40–$70**. RAG examples add almost nothing versus video.

### Hosting (unchanged architecture)

| Piece | Typical | Notes |
|---|---|---|
| Railway `web` + `worker` | **$5–$20 / mo** | Two processes, same image. RAG adds no extra service. |
| Supabase Postgres | **$0** on free until the DB grows | PieceModel JSON is tiny. |
| Supabase Storage | **$0** then **~$25 Pro** | Videos dominate. ~100 takes × 20 MB ≈ 2 GB stored; free 1 GB fills fast. Pro is the realistic floor once students upload. |
| Gemini | see table | Billed to the Google AI Studio / Cloud project, not Railway. |

Fine-tunes later cost a training run plus hosted tokens; skip until the teacher has labelled hundreds–~1000 sends. Prices move; treat these as order-of-magnitude, not invoices.

## Env

`GEMINI_API_KEY`, optional `GEMINI_MODEL_TRAIN` / `GEMINI_MODEL_COMPARE` / `GEMINI_MODEL_DRAFT` / `GEMINI_MODEL_VERIFY`. Defaults: **gemini-3.1-pro-preview** (train) and **gemini-3.5-flash** (compare + draft). Verify is the next-PR JSON adjudicator (no video). If `.env.local` still names `gemini-2.5-*`, compare/draft 404 and the worker skips score compare. Never commit the key.
