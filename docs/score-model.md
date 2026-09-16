# Score-model V1 — contracts for UI agents

This slice is schema, worker, CLI, and prompts. Do not block on new screens. The teacher queue already shows `Draft.text`.

## Train / attach (shared with CLI)

```ts
import { attachPieceAssets, enqueueTrainPiece, getReadyPieceModel } from "@/lib/catalog";
```

- `attachPieceAssets({ pieceId, sheet?, tutorial? })` uploads to Storage, sets `Piece.sheetMediaId` / `Piece.tutorialMediaId`, and points `referenceMediaId` at the tutorial so `/l/<code>` can play it.
- `enqueueTrainPiece(pieceId)` requires both assets. Worker job type `train_piece` (no `submissionId`).
- `getReadyPieceModel(pieceId)` returns the latest `status: ready` version.

Catalog drop path (no UI): see [`catalog/README.md`](../catalog/README.md). `npm run catalog:train`.

## Models worth reading

- `PieceModel.status`: `training | ready | failed`
- `PieceModel.scoreJson`: `{ title, key, tempoBpm, timeSignature, barCount, sections[], techniqueFocus[], commonMistakes[] }`
- `PieceModel.tutorialCuesJson`: `{ cues: [{ tStart, tEnd, topic, instruction, bar }] }`
- `Analysis.observationsJson`: `{ overallFit, confidence, positives[], issues[], nextPractice }`
- `Analysis.pipelineVersion`: `audio-metrics-v1` or `score-compare-v1`

Issue types: `timing | pitch | chord | technique | missing`.

## Queue / student UI (optional later)

- Keep showing `Draft.text`. Teacher sends; nothing auto-sends to the student.
- Optional chips from `observationsJson.issues` only when `confidence >= 0.6` and issue `confidence >= 0.6`.
- Student `/l/<code>` already plays `referenceMedia` — tutorial attach is enough.

## Env

`GEMINI_API_KEY`, optional `GEMINI_MODEL_TRAIN` / `GEMINI_MODEL_COMPARE`. Never commit the key.
