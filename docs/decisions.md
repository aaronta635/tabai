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
| 20 Sept 2026 | Build (LMS between lessons) | howl0 is the week between live lessons. Piece stays canonical (goal, due, clip, practice). No Zoom-class, MIDI, 150 games, recital hall, or multi-teacher live monitor until the take/practice/queue loop is habitual. Live 1-1 is a later satellite, not v1. |
| 20 Sept 2026 | Build (studio look) | Teacher workspace is Charis SIL for reading and Be Vietnam Pro for controls, on a dusk blush→mauve gradient. Full-width top bar holds the howl0 dog and an initials avatar menu; the rail is dog + nav only. Every page rests folded: a "+" opens the form, a section opens on click, classes and curriculum parts are tiles. |
| 21 Sept 2026 | Aaron | The dog is the logo. One heading per page — the rail already says where you are. A song opens from wherever it is named: `/teacher/curriculum/{pieceId}` is the piece page, reachable from a class's assigned work and from the curriculum card. |
| 21 Sept 2026 | Build (studio speed) | Postgres sits in Tokyo, so every query costs ~110 ms from Australia. Studio layouts read the JWT only (onboarded lives on the cookie after the first bind). Nav badges refresh in the background from sessionStorage. Client navigations reuse the last payload for 20s (`experimental.staleTimes`). Keep `DIRECT_URL` (5432); the transaction pooler on 6543 measured ~5× slower per query. Hosting the app next to the database is the remaining floor. `npx tsx scripts/db-latency.ts` re-measures. |
| 21 Sept 2026 | Aaron | Sheet and tutorial are independent. Train on whichever is uploaded; adding the other later retrains a new PieceModel version. Clip-only attach does not train. Teacher still sends. |
| 21 Sept 2026 | Aaron | Students get the same studio chrome as tutors: home, classes, pieces, takes, progress. A class tile shows the teacher's name; opening it shows this week's piece, assigned work, and upcoming sessions. A take is for the teacher to reply; a practice take is stored and shown under Progress, with no draft and no reply. Logged-in send/review lives in the studio (`/student/work/{code}`, `/student/takes`), not `/s/{token}`. |
| 20 Sept 2026 | Build (Class curriculum LMS) | Class is roster/invite/schedule. Curriculum is the tutor library (parts + pieces). Assignment sends a piece or part to a class or one student. Join is `/c/{code}` (mailto + copy, no SMTP). Submissions is a table; `/l/{code}` stays the piece classroom. Catalog demo UI retired. |
