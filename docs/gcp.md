# Google Cloud Run (Singapore)

`cloudbuild.yaml` deploys the worker service `para-music` in `asia-southeast1`. The studio stays on Vercel. Keep Supabase for Postgres, Storage, and Auth. Gemini stays on `GEMINI_API_KEY` (AI Studio). Everyday deploys use branch `dev`. Do not deploy `main`.

## One-time

1. Install `gcloud` and `gcloud auth login`.
2. Create or pick a billed project. Export `PROJECT_ID`.
3. Copy [deploy/secrets.env.example](../deploy/secrets.env.example) to `deploy/secrets.env` and fill it (gitignored).
4. Run [deploy/setup-gcp.sh](../deploy/setup-gcp.sh) only for a new project. The live worker already exists: service `para-music`, region `asia-southeast1`, Artifact Registry repo `para-music`.
5. In Cloud Build, create a trigger on GitHub `dev` using [cloudbuild.yaml](../cloudbuild.yaml). Set substitutions `_NEXT_PUBLIC_SUPABASE_URL`, `_NEXT_PUBLIC_SUPABASE_ANON_KEY`, `_NEXT_PUBLIC_APP_URL`.
6. First image: `gcloud builds submit --config cloudbuild.yaml --substitutions=COMMIT_SHA=$(git rev-parse --short HEAD),_NEXT_PUBLIC_APP_URL=https://YOUR_RUN_URL`.

## Services

- `para-music`: `npm run worker`, min 1, CPU always allocated, 2 vCPU / 2 GiB, `/healthz` on `$PORT`. `POST /api/jobs/run` claims waiting jobs. The studio is not deployed from this file.

## Cut over

[deploy/cutover.sh](../deploy/cutover.sh) still probes the old Tokyo service names. The live worker is `para-music` in `asia-southeast1`. The studio hostname stays on Vercel.

## Audio flags

- `ANALYZE_BACKEND=librosa` (Cloud Run worker default). `stdlib` forces the old RMS onsets.
- `BASIC_PITCH=1` on the worker for measured pitch issues. Train runs Basic Pitch on the tutorial; analyze runs it on the take. `cloudbuild.yaml` builds with `INSTALL_BASIC_PITCH=true` and sets the flag; never set the flag on an image without it, or every take re-analyzes on each restart.

## Job retries

A job left `running` for 20 minutes goes back to `pending`, up to 3 attempts, then stays `failed`. A piece whose last 3 trains failed is not re-queued on worker start or on a take; a new teacher upload still trains it.
