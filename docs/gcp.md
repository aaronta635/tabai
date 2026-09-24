# Google Cloud Run (Tokyo)

Lift web + worker to Cloud Run in `asia-northeast1`. Keep Supabase for Postgres, Storage, and Auth. Gemini stays on `GEMINI_API_KEY` (AI Studio). Everyday deploys use branch `dev`. Do not deploy `main`.

## One-time

1. Install `gcloud` and `gcloud auth login`.
2. Create or pick a billed project. Export `PROJECT_ID`.
3. Copy [deploy/secrets.env.example](../deploy/secrets.env.example) to `deploy/secrets.env` and fill it (gitignored).
4. Run [deploy/setup-gcp.sh](../deploy/setup-gcp.sh). It enables APIs, Artifact Registry `howl0`, Secret Manager, and the `howl0-run` service account.
5. In Cloud Build, create a trigger on GitHub `dev` using [cloudbuild.yaml](../cloudbuild.yaml). Set substitutions `_NEXT_PUBLIC_SUPABASE_URL`, `_NEXT_PUBLIC_SUPABASE_ANON_KEY`, `_NEXT_PUBLIC_APP_URL`.
6. First image: `gcloud builds submit --config cloudbuild.yaml --substitutions=COMMIT_SHA=$(git rev-parse --short HEAD),_NEXT_PUBLIC_APP_URL=https://YOUR_RUN_URL`.

## Services

- `howl0-web`: `npm start`, scale 0–5, 1 vCPU / 1 GiB, health `/api/health`.
- `howl0-worker`: `npm run worker`, min 1, CPU always allocated, 2 vCPU / 2 GiB, `/healthz` on `$PORT`.

## Cut over

[deploy/cutover.sh](../deploy/cutover.sh) runs `prisma migrate deploy` and probes both services. After one real take produces train/analyze/draft jobs, point the app hostname at `howl0-web`. Leave Railway up until that works. Landing can stay on Vercel.

## Audio flags

- `ANALYZE_BACKEND=librosa` (Cloud Run worker default). `stdlib` forces the old RMS onsets.
- `BASIC_PITCH=1` only after a teacher confirms chips. Rebuild with `--build-arg INSTALL_BASIC_PITCH=true`.
