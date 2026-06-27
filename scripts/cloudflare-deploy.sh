#!/usr/bin/env bash
set -euo pipefail

# Cloudflare Workers Builds: branch-aware deploy for great-manut API.
# - preview (and other non-production branches) → great-manut-api-preview
# - main → great-manut-api (--env production)

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/packages/api"

BRANCH="${CF_PAGES_BRANCH:-${WORKERS_CI_BRANCH:-${GITHUB_REF_NAME:-}}}"

if [ "$BRANCH" = "main" ]; then
  echo "Deploying production Worker (branch: main)"
  pnpm exec wrangler deploy --env production
else
  echo "Deploying staging Worker (branch: ${BRANCH:-unknown})"
  pnpm exec wrangler deploy
fi
