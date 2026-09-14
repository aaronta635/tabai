# Feedback Engine

Next.js App Router for online guitar teachers. The demo is: **sign in → make a piece link → students upload at `/l/<code>`**.

## Keys

| Variable | Required to | Where |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Auth, landing | Supabase → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth (public) | Supabase → API → anon |
| `DATABASE_URL` + `DIRECT_URL` | Prisma / creating links | Supabase → Database → URI |
| `SESSION_SECRET` | Invite/admin cookies | Generate locally |
| `SUPABASE_SERVICE_ROLE_KEY` | Reliable video Storage | Supabase → API → service_role |
| `ANTHROPIC_API_KEY` | AI drafts | Optional |

Anon is not the database. Paste the **Postgres URI** (with password) into `DATABASE_URL`.

Auth: `/auth` (email + password). After login, `/teacher/pieces` is the link generator.

Student: open `/l/<code>` or type the code on the homepage.

## Setup

1. Copy `.env.example` → `.env.local` and fill the table above.
2. Create a private Storage bucket `media`.
3. In Auth settings, turn off “Confirm email” for local demo, or confirm via inbox.
4. `npm install && npx prisma migrate deploy && npm run dev`

## Video analysis

See [`docs/video-analysis.md`](docs/video-analysis.md). v1 is ffmpeg + stdlib Python. Basic Pitch and MediaPipe wait until a teacher confirms flags.

## Railway

Same Docker image, two processes: `web` (`npm start`) and `worker` (`npm run worker`).
