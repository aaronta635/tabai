# Metric definitions

## Time per reply

`sent_at - opened_at` on `Reply`.

- `opened_at` is copied from `Submission.reviewOpenedAt`, set when the queue card is focused.
- `sent_at` is set on send.
- Nothing else is included (no upload time, no student wait).

Median is computed separately for `source = manual` and `source in (approved_draft, edited_draft)`.

## Approve-untouched

Share of replies with `source = approved_draft` (edit_distance = 0 against the latest draft).

Unlock AI-direct (per piece): ≥100 replies on the piece **and** approve-untouched ≥80% over the last 50. Practice submissions do not count. After unlock, high-confidence drafts (`confidence ≥ 0.8`) auto-send. If override rate on recent AI-direct replies rises above 30%, clear `Piece.aiDirectUnlockedAt`.

## Override rate (v2)

Share of AI-direct replies the teacher later replaces. If this rises, clear `Piece.aiDirectUnlockedAt`.

## Cost per submission

Sum of `Event name=draft.cost` `propsJson.costCents` plus analyze `costCents` (0 in v1), divided by submission count.

## Weekly active students

Distinct `Student` with a take, overdub, or timed `PracticeSession` on an assigned Piece in the last 7 days, per teacher. Games played and minutes-in-call are not metrics.
