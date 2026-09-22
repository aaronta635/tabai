## Learned User Preferences
- Plan first, then implement; when a plan is attached, finish its todos and do not edit the plan file.
- Keep `main` untouched; everyday work and PRs go through `dev`.
- Run commands and choose recommendations without waiting; proceed after a reproduced issue.
- UI must work in Vietnamese and English with a font that renders both scripts evenly; avoid “AI-looking” display type (Charis SIL is the requested studio face).
- Keep Howl0 branding: the Howl0 palette, a luxury mixed-palette landing background, and the original dog logo (not a substitute icon).
- Teacher and student are separate roles with different onboarding; signing in on the student path must not open a teacher account even if the email belongs to a teacher.
- LMS chrome should match across teacher and student: class-first, one page title, “+” to open create flows, submissions as a normal dashboard section (not a separate vertical pipeline).
- Split landing vs studio; landing may live on a separate Vercel/GitHub from the app.

## Learned Workspace Facts
- Feedback_AI (howl0) is a Next.js + Prisma LMS using Supabase Postgres and Storage; Prisma needs both `DATABASE_URL` and `DIRECT_URL`.
- Score-model V1 trains from catalog sheet music plus a tutorial video, stores a piece model, then a worker compares student takes (Gemini extract + local compare) and writes feedback; analysis waits on the worker.
- Catalog ingest (`catalog:train`) skips a song unless `sheet.*` and `tutorial.*` exist; teachers upload score and tutorial with the piece, and students see the tutorial on the submit link.
- Near-term product center is “AI between lessons” (practice, assignments, submissions), not a live Zoom-replacement classroom.
- Teachers create classes, invite by link or email, keep a custom curriculum of levels and pieces (title, tutorial, sheet, description, tips), and assign pieces to a class or a student; class pieces should be clickable from the class.
- Students get a dashboard with classes and teacher name, current piece, submissions, practice vs take, and progress; schedule is a click-to-create calendar, with attendance on the teacher side.
- Signed uploads need the Supabase service role (anon + RLS fails); regenerate the Prisma client after schema changes.
- Tests are Vitest plus Playwright e2e; Playwright browsers must be installed locally. Node 22+ is expected for `@supabase/supabase-js`. Local nav slowness is often round-trips to remote/free Supabase.
