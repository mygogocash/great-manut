#!/usr/bin/env bash
set -euo pipefail

# Branch-aware deploy for Cloudflare Workers Builds (WORKERS_CI_BRANCH is injected by CF).
# preview → great-manut-api-preview | main → great-manut-api (--env production)

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BRANCH="${WORKERS_CI_BRANCH:-${CF_PAGES_BRANCH:-${GITHUB_REF_NAME:-preview}}}"
BRANCH="${BRANCH#refs/heads/}"

if [ "$BRANCH" = "main" ]; then
  echo "Deploying production Worker (WORKERS_CI_BRANCH=main)"
  pnpm exec wrangler deploy --env production
else
  echo "Deploying staging Worker (WORKERS_CI_BRANCH=${BRANCH})"
  pnpm exec wrangler deploy
fi
