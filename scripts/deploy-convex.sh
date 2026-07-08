#!/usr/bin/env bash
# Deploy Convex backend (auth, orgs, issues, etc.) to sincere-oriole-287.
#
# Prerequisites (one-time):
#   1. npx convex login
#   2. npx convex dev --once   # links .env.local to great-manut / sincere-oriole-287
#   3. npx @convex-dev/auth    # generates JWT keys on the deployment
#
# CI: set CONVEX_DEPLOY_KEY in GitHub repo secrets (Convex dashboard → Settings → Deploy key).
#
set -euo pipefail
cd "$(dirname "$0")/.."

DEPLOYMENT="dev:sincere-oriole-287"
SITE_URL="https://sincere-oriole-287.convex.site"

bootstrap_env() {
  if [[ -f .env.local ]]; then
    return
  fi
  if [[ ! -f .env.example ]]; then
    echo "error: missing .env.example"
    exit 1
  fi
  echo "Creating .env.local from .env.example (CONVEX_DEPLOYMENT only)…"
  {
    grep '^CONVEX_DEPLOYMENT=' .env.example || echo "CONVEX_DEPLOYMENT=${DEPLOYMENT}"
    grep '^NEXT_PUBLIC_CONVEX_URL=' .env.example || true
    grep '^NEXT_PUBLIC_CONVEX_SITE_URL=' .env.example || true
  } > .env.local
}

require_auth() {
  if [[ -n "${CONVEX_DEPLOY_KEY:-}" ]]; then
    return
  fi
  local status
  status="$(npx convex login status 2>&1 || true)"
  if echo "$status" | grep -q "Status: Logged in"; then
    return
  fi
  echo "error: Convex is not authenticated."
  echo "  Run: npx convex login"
  echo "  Or set CONVEX_DEPLOY_KEY for non-interactive deploy."
  exit 1
}

assert_deployment_access() {
  if [[ -n "${CONVEX_DEPLOY_KEY:-}" ]]; then
    return
  fi
  if CONVEX_DEPLOYMENT="${CONVEX_DEPLOYMENT:-$DEPLOYMENT}" npx convex function-spec 2>&1 | grep -q "don't have access"; then
    echo "error: logged-in Convex account cannot access ${DEPLOYMENT}."
    echo "  Run: npx convex dev --once --configure=existing --team kunanon-jarat --project great-manut"
    echo "  Or add CONVEX_DEPLOY_KEY from Convex dashboard → Settings → Deploy key to GitHub secrets."
    exit 1
  fi
}

bootstrap_env
require_auth
assert_deployment_access

echo "Pushing Convex functions to sincere-oriole-287 (dev)…"
CONVEX_DEPLOYMENT="${CONVEX_DEPLOYMENT:-$DEPLOYMENT}" npx convex dev --once

echo "Done. Verify auth is deployed (signIn is an Action, not missing):"
echo "  curl -s -X POST https://sincere-oriole-287.convex.cloud/api/action \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"path\":\"auth:signIn\",\"args\":{}}'"
