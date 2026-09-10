# Feedback Engine

Next.js App Router (web + worker) for online guitar teachers. Students upload a take through a piece link; the teacher answers from a queue; week-two drafts speak in the teacher's voice.

Vietnamese default, English toggle. Mobile-first. Facebook/Zalo WebView upload-first.

## Stack

- Next.js 15 + TypeScript + Tailwind
- Prisma → Supabase Postgres (Singapore)
- Supabase Storage (direct signed uploads, max 60 MB)
- Railway: one Docker image, two processes (`web`, `worker`)
- ffmpeg + Python stdlib metrics on the worker
- Anthropic for drafts (`prompts/draft_reply_vi.md`)

## Setup

1. Create a Supabase project in Singapore. Copy `DATABASE_URL` (pooler, port 6543, `?pgbouncer=true`) and `DIRECT_URL` (port 5432).
2. Create a **private** Storage bucket named `media`.
3. Copy `.env.example` to `.env` and fill secrets.
4. `npm install`
5. `npx prisma migrate deploy`
6. `npm run db:seed`
7. `npm run dev` and in another terminal `npm run worker`

Admin: open `/admin`, password is `ADMIN_SECRET`.
Create a teacher, copy `/t/<inviteToken>`, paste voice samples on `/admin/voices`.
Teacher posts `/l/<code>` in the group.

## Railway

Deploy the Dockerfile. Run two processes from the same image:

- `web`: `npm start`
- `worker`: `npm run worker`

Health check: `GET /api/health`.

## Never cut

Timestamps, append-only drafts/replies, consent, deletion.

## Out of v1

Student subscriptions, live calls, marketplace, wall comments, Facebook group APIs, RLS (until teacher #3), pitch alignment, hand tracking.
