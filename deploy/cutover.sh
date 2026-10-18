#!/usr/bin/env bash
# Apply Prisma migrations against DIRECT_URL, then hit Cloud Run health endpoints.
# Does not change DNS. Point the app hostname at howl0-web after this succeeds.
set -euo pipefail

REGION="${REGION:-asia-northeast1}"
SERVICE_WEB="${SERVICE_WEB:-howl0-web}"
SERVICE_WORKER="${SERVICE_WORKER:-howl0-worker}"

if [[ -z "${DIRECT_URL:-}" ]]; then
  echo "DIRECT_URL must be set (or sourced from deploy/secrets.env)"
  exit 1
fi

npx prisma migrate deploy

WEB_URL="$(gcloud run services describe "${SERVICE_WEB}" --region "${REGION}" --format='value(status.url)')"
WORKER_URL="$(gcloud run services describe "${SERVICE_WORKER}" --region "${REGION}" --format='value(status.url)')"

echo "web ${WEB_URL}"
curl -fsS "${WEB_URL}/api/health"
echo
echo "worker ${WORKER_URL}"
TOKEN="$(gcloud auth print-identity-token)"
curl -fsS -H "Authorization: Bearer ${TOKEN}" "${WORKER_URL}/healthz"
echo
echo "Golden path: upload a take on a piece with a trained model, confirm Job analyze then draft in the DB, then switch DNS from Railway to ${WEB_URL}."
