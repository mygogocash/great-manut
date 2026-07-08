#!/usr/bin/env bash
# Push Google Vertex credentials to a Convex deployment.
#
# GCP project manut-500913 is AI-only (Vertex chat + embeddings). App hosting
# stays on Cloudflare; attachments stay on R2/Convex — nothing else on this GCP project.
# Usage:
#   ./scripts/convex-set-vertex-env.sh path/to/service-account.json
#   ./scripts/convex-set-vertex-env.sh path/to/service-account.json us-central1
#   ./scripts/convex-set-vertex-env.sh path/to/service-account.json us-central1 dev:sincere-oriole-287
#
# Options:
#   --unset-openai      Remove OPENAI_API_KEY from the deployment after setting Vertex vars.
#   --unset-api-key     Remove GOOGLE_VERTEX_API_KEY (recommended when switching to OAuth).
#
# Prerequisites: npx convex login (or CONVEX_DEPLOY_KEY)
set -euo pipefail

cd "$(dirname "$0")/.."

UNSET_OPENAI=false
UNSET_API_KEY=false
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --unset-openai) UNSET_OPENAI=true ;;
    --unset-api-key) UNSET_API_KEY=true ;;
    *) ARGS+=("$arg") ;;
  esac
done

JSON_FILE="${ARGS[0]:?Usage: $0 [--unset-openai] service-account.json [location] [deployment]}"
LOCATION="${ARGS[1]:-us-central1}"
DEPLOYMENT="${ARGS[2]:-dev:sincere-oriole-287}"

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq is required (brew install jq)"
  exit 1
fi

if [[ ! -f "$JSON_FILE" ]]; then
  echo "error: file not found: $JSON_FILE"
  exit 1
fi

PROJECT_ID="$(jq -r '.project_id // empty' "$JSON_FILE")"
CLIENT_EMAIL="$(jq -r '.client_email // empty' "$JSON_FILE")"
PRIVATE_KEY="$(jq -r '.private_key // empty' "$JSON_FILE")"

if [[ -z "$PROJECT_ID" ]]; then
  PROJECT_ID="manut-500913"
fi
if [[ -z "$CLIENT_EMAIL" || -z "$PRIVATE_KEY" ]]; then
  echo "error: service account JSON must include client_email and private_key"
  exit 1
fi

JSON_COMPACT="$(jq -c . "$JSON_FILE")"

echo "Deployment: $DEPLOYMENT"
echo "Project:    $PROJECT_ID"
echo "Location:   $LOCATION"
echo "Service account: $CLIENT_EMAIL"
echo ""

run_env() {
  CONVEX_DEPLOYMENT="$DEPLOYMENT" npx convex env set "$@"
}

echo "Setting Convex env vars…"
run_env GOOGLE_VERTEX_PROJECT "$PROJECT_ID"
run_env GOOGLE_VERTEX_LOCATION "$LOCATION"
run_env GOOGLE_APPLICATION_CREDENTIALS_JSON "$JSON_COMPACT"

if [[ "$UNSET_API_KEY" == true ]]; then
  echo "Removing GOOGLE_VERTEX_API_KEY (OAuth takes precedence)…"
  CONVEX_DEPLOYMENT="$DEPLOYMENT" npx convex env remove GOOGLE_VERTEX_API_KEY || true
fi

if [[ "$UNSET_OPENAI" == true ]]; then
  echo "Removing OPENAI_API_KEY…"
  CONVEX_DEPLOYMENT="$DEPLOYMENT" npx convex env remove OPENAI_API_KEY || true
fi

echo ""
echo "Done. Deploy backend then verify:"
echo "  ./scripts/deploy-convex.sh"
echo "  ./scripts/backfill-embeddings.sh status"
echo ""
echo "GCP checklist (AI-only project — no other GCP services needed):"
echo "  1. Enable Vertex AI API: aiplatform.googleapis.com"
echo "  2. Service account role: roles/aiplatform.user only"
echo "  3. Billing on project manut-500913 (Vertex usage only)"
