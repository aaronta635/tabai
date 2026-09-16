# Feedback Engine

Next.js App Router for online guitar teachers. The demo is: **sign in → make a piece link → students upload at `/l/<code>`**.

## Keys

| Variable | Required to | Where |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Auth, landing | Supabase → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth (public) | Supabase → API → anon |
| `DATABASE_URL` + `DIRECT_URL` | Prisma / creating links | Supabase → Database → URI |
| `SESSION_SECRET` | Invite/admin cookies | Generate locally |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker + signed Storage (required) | Supabase → API → `service_role` |
| `ANTHROPIC_API_KEY` | AI drafts (fallback) | Optional |
| `GEMINI_API_KEY` | Score train/compare + preferred drafts | Optional |

Anon is not the database. Paste the **Postgres URI** (with password) into `DATABASE_URL`.

Auth: `/auth` (email + password). After login, `/teacher/pieces` is the link generator.

Student: open `/l/<code>` or type the code on the homepage.

## Setup

1. Copy `.env.example` → `.env.local` and fill the table above.
2. Create a private Storage bucket `media`.
3. In Auth settings, turn off “Confirm email” for local demo, or confirm via inbox.
4. `npm install && npx prisma migrate deploy && npm run dev`

Prisma CLI reads `.env.local` through [`prisma.config.ts`](prisma.config.ts) (`DATABASE_URL` + `DIRECT_URL` are required). `DIRECT_URL` is the direct (5432) URI; `DATABASE_URL` is the pooler (6543).

The worker (`npm run worker`) needs `SUPABASE_SERVICE_ROLE_KEY`. It also ships a `ws` fallback so Node 20 can run locally; Node 22+ (the Dockerfile) uses the native WebSocket.

## Video analysis

See [`docs/video-analysis.md`](docs/video-analysis.md) and [`docs/score-model.md`](docs/score-model.md). v1 metrics are ffmpeg + stdlib Python. When a piece has sheet + tutorial, `npm run catalog:train` plus the worker saves a `PieceModel` and later takes are compared with Gemini. Teacher still sends the draft.

## Railway

Same Docker image, two processes: `web` (`npm start`) and `worker` (`npm run worker`).
