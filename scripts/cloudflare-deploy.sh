#!/usr/bin/env bash
set -euo pipefail

# Cloudflare Workers Builds — use: pnpm run deploy  OR  bash deploy.sh
# Do NOT use: npx wrangler deploy (breaks pnpm monorepo detection without this script).

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BRANCH="${WORKERS_CI_BRANCH:-${CF_PAGES_BRANCH:-${GITHUB_REF_NAME:-preview}}}"
BRANCH="${BRANCH#refs/heads/}"

if [ "$BRANCH" = "main" ]; then
  echo "Deploying production Worker (WORKERS_CI_BRANCH=main)"
  pnpm exec wrangler deploy
else
  echo "Deploying staging Worker (WORKERS_CI_BRANCH=${BRANCH})"
  pnpm exec wrangler deploy --env staging
fi
