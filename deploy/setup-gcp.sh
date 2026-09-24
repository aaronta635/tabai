#!/usr/bin/env bash
# One-time Tokyo GCP bootstrap for howl0 Cloud Run (keeps Supabase).
# Usage:
#   export PROJECT_ID=howl0-prod
#   export BILLING_ACCOUNT=XXXXXX-XXXXXX-XXXXXX   # optional if project exists
#   ./deploy/setup-gcp.sh
set -euo pipefail

REGION="${REGION:-asia-northeast1}"
REPO="${REPO:-howl0}"
PROJECT_ID="${PROJECT_ID:?set PROJECT_ID}"
SECRETS_FILE="${SECRETS_FILE:-deploy/secrets.env}"

echo "project ${PROJECT_ID} region ${REGION}"

if ! gcloud projects describe "${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud projects create "${PROJECT_ID}" --name="howl0"
  if [[ -n "${BILLING_ACCOUNT:-}" ]]; then
    gcloud billing projects link "${PROJECT_ID}" --billing-account="${BILLING_ACCOUNT}"
  fi
fi

gcloud config set project "${PROJECT_ID}"
gcloud config set run/region "${REGION}"

gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  logging.googleapis.com \
  cloudresourcemanager.googleapis.com

if ! gcloud artifacts repositories describe "${REPO}" --location="${REGION}" >/dev/null 2>&1; then
  gcloud artifacts repositories create "${REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="howl0 app image"
fi

RUNTIME_SA="howl0-run@${PROJECT_ID}.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "${RUNTIME_SA}" >/dev/null 2>&1; then
  gcloud iam service-accounts create howl0-run --display-name="howl0 Cloud Run"
fi

SECRET_NAMES=(
  DATABASE_URL
  DIRECT_URL
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SESSION_SECRET
  ADMIN_SECRET
  GEMINI_API_KEY
)

if [[ -f "${SECRETS_FILE}" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "${SECRETS_FILE}"
  set +a
  for name in "${SECRET_NAMES[@]}"; do
    value="${!name:-}"
    if [[ -z "${value}" ]]; then
      echo "skip secret ${name} (empty in ${SECRETS_FILE})"
      continue
    fi
    if gcloud secrets describe "${name}" >/dev/null 2>&1; then
      printf '%s' "${value}" | gcloud secrets versions add "${name}" --data-file=-
    else
      printf '%s' "${value}" | gcloud secrets create "${name}" --data-file=-
    fi
    gcloud secrets add-iam-policy-binding "${name}" \
      --member="serviceAccount:${RUNTIME_SA}" \
      --role="roles/secretmanager.secretAccessor" \
      --quiet
  done
else
  echo "No ${SECRETS_FILE}. Create it from deploy/secrets.env.example, then re-run to upload secrets."
fi

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/run.admin" \
  --quiet
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/artifactregistry.writer" \
  --quiet

echo "Bootstrap done. Next: copy deploy/secrets.env.example → deploy/secrets.env, re-run if needed,"
echo "then: gcloud builds submit --config cloudbuild.yaml --substitutions=COMMIT_SHA=\$(git rev-parse --short HEAD)"
echo "Or connect a Cloud Build trigger to branch dev."
