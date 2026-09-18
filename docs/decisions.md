# Decisions

Nothing ships unless a teacher asked for it aloud. Log date and who.

| Date | Who | Decision |
|---|---|---|
| 9 Sept 2026 | Spec (Aaron/Phong) | v1 is the queue + drafted replies. No wall, payments, OAuth, or perception. |
| 9 Sept 2026 | Build | Canonical entity is Piece (build spec "lesson"). Drafts and replies are append-only. |
| 9 Sept 2026 | Build | Railway one box, two processes (web + worker). Prisma + Supabase Postgres/Storage. |
| 16 Sept 2026 | Build (score-model V1) | Per-piece Gemini extract of sheet + tutorial is saved as `PieceModel`. Student takes are compared to that JSON, not to a fine-tuned weight file. Teacher remains the final gate (queue draft). Tutorial and student video are sent to Gemini for train/compare. |
| 16 Sept 2026 | Build (RAG drafts) | Drafts retrieve this teacher's sent replies + matching score/tutorial bars. No pgvector, no fine-tune until hundreds of labelled sends. Teacher still sends. |
| 18 Sept 2026 | Build (precise compare) | Issues are score/tutorial deltas only. Close match and same-as-tutorial takes get empty issues and praise-only drafts. Teacher still sends. |
