#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-h2gdm-hack26icn-2694}"
SERVICE_NAME="${SERVICE_NAME:-mentors-platform}"
REGION="${REGION:-asia-northeast3}"

echo "============================================================"
echo " Deploying MENTORS AI Learning Platform to Google Cloud Run"
echo " Project : ${PROJECT_ID}"
echo " Service : ${SERVICE_NAME}"
echo " Region  : ${REGION}"
echo "============================================================"

# Load GEMINI_API_KEY from .env.local if not already exported
if [ -z "${GEMINI_API_KEY:-}" ] && [ -f ".env.local" ]; then
  export $(grep -E '^GEMINI_API_KEY=' .env.local | xargs) || true
fi

PROJECT_NUMBER="${GOOGLE_CLOUD_PROJECT_NUMBER:-1001204402150}"
VERTEX_AGENT_ID="${VERTEX_AGENT_DESIGNER_ID:-agent_1792115718565}"

ENV_VARS="GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GCP_PROJECT_ID=${PROJECT_ID},GOOGLE_CLOUD_PROJECT_NUMBER=${PROJECT_NUMBER},GOOGLE_CLOUD_LOCATION=${REGION},VERTEX_AGENT_DESIGNER_ID=${VERTEX_AGENT_ID},NEXT_PUBLIC_GCP_PROJECT_ID=${PROJECT_ID}"
if [ -n "${GEMINI_API_KEY:-}" ]; then
  ENV_VARS="${ENV_VARS},GEMINI_API_KEY=${GEMINI_API_KEY}"
fi

gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --allow-unauthenticated \
  --set-env-vars "${ENV_VARS}" \
  --memory 1Gi \
  --cpu 1 \
  --port 8080 \
  --quiet

echo "✅ Cloud Run Deployment Complete!"
