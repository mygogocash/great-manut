#!/usr/bin/env bash
# Deploy Convex backend (auth, orgs, issues, etc.) to modest-schnauzer-996.
# Required once after clone and whenever convex/ changes.
#
# Prerequisites:
#   1. Log in: npx convex dev (once) — creates .env.local with CONVEX_DEPLOYMENT
#   2. Or set CONVEX_DEPLOY_KEY in CI / env for non-interactive deploy
#
# Auth JWT keys (one-time per deployment):
#   npx @convex-dev/auth
#
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${CONVEX_DEPLOY_KEY:-}" && ! -f .env.local ]]; then
  echo "error: run 'npx convex dev' once to create .env.local, or set CONVEX_DEPLOY_KEY"
  exit 1
fi

echo "Deploying Convex functions to modest-schnauzer-996..."
npx convex deploy --yes

echo "Done. Verify auth with:"
echo "  curl -s https://modest-schnauzer-996.convex.cloud/api/query \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"path\":\"auth:signIn\",\"args\":{},\"format\":\"json\"}'"
echo "(Should NOT say 'Could not find public function for auth:signIn')"
