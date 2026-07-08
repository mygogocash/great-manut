#!/usr/bin/env bash
# Push Vertex express-mode API key to Convex (when SA keys are blocked by org policy).
#
# Usage:
#   ./scripts/convex-set-vertex-api-key.sh                    # reads ~/.config/manut/vertex-api-key
#   ./scripts/convex-set-vertex-api-key.sh path/to/key.txt
#   ./scripts/convex-set-vertex-api-key.sh --from-gcloud        # fetch manut-vertex-express key
#
# Sets: GOOGLE_VERTEX_API_KEY, GOOGLE_VERTEX_PROJECT=manut-500913, GOOGLE_VERTEX_LOCATION
set -euo pipefail

cd "$(dirname "$0")/.."

DEPLOYMENT="${CONVEX_DEPLOYMENT:-dev:sincere-oriole-287}"
PROJECT_ID="manut-500913"
LOCATION="${GOOGLE_VERTEX_LOCATION:-us-central1}"
KEY_FILE="${HOME}/.config/manut/vertex-api-key"
GCLOUD_KEY_ID="d499fd52-9690-4804-9759-62b0c9c65ace"

run_env() {
  CONVEX_DEPLOYMENT="$DEPLOYMENT" npx convex env set "$@"
}

read_api_key() {
  local source="$1"
  if [[ "$source" == "--from-gcloud" ]]; then
    gcloud services api-keys get-key-string "$GCLOUD_KEY_ID" \
      --project="$PROJECT_ID" \
      --format='value(keyString)'
    return
  fi
  if [[ ! -f "$source" ]]; then
    echo "error: key file not found: $source"
    exit 1
  fi
  tr -d '[:space:]' < "$source"
}

SOURCE="${1:-$KEY_FILE}"
API_KEY="$(read_api_key "$SOURCE")"

if [[ -z "$API_KEY" ]]; then
  echo "error: empty API key"
  exit 1
fi

echo "Deployment: $DEPLOYMENT"
echo "Project:    $PROJECT_ID (AI-only Vertex)"
echo "Auth:       express mode API key"
echo ""

run_env GOOGLE_VERTEX_PROJECT "$PROJECT_ID"
run_env GOOGLE_VERTEX_LOCATION "$LOCATION"
run_env GOOGLE_VERTEX_API_KEY "$API_KEY"

echo ""
echo "Done. Deploy backend:"
echo "  ./scripts/deploy-convex.sh"
echo ""
echo "Optional: remove legacy OpenAI key"
echo "  CONVEX_DEPLOYMENT=$DEPLOYMENT npx convex env remove OPENAI_API_KEY"
