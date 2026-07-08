#!/usr/bin/env bash
# Trigger or inspect issue embedding backfill on Convex (Vertex / managed AI).
#
# Usage:
#   ./scripts/backfill-embeddings.sh status [orgId]
#   ./scripts/backfill-embeddings.sh org <orgId>        # force re-embed one org
#   ./scripts/backfill-embeddings.sh all                # force re-embed every org
#   ./scripts/backfill-embeddings.sh missing <orgId>    # only issues without embeddings
#
# Requires: npx convex login (or CONVEX_DEPLOY_KEY), Vertex env vars set on deployment.
set -euo pipefail

cd "$(dirname "$0")/.."

DEPLOYMENT="${CONVEX_DEPLOYMENT:-dev:sincere-oriole-287}"

run() {
  CONVEX_DEPLOYMENT="$DEPLOYMENT" npx convex run "$@"
}

usage() {
  cat <<EOF
Usage:
  $0 status [orgId]           Show embedding counts
  $0 org <orgId>              Force re-embed all issues in org (Vertex migration)
  $0 all [staggerMs]          Force re-embed all orgs (default stagger 1000ms)
  $0 missing <orgId>          Backfill only issues missing embeddings

Environment:
  CONVEX_DEPLOYMENT  (default: dev:sincere-oriole-287)
EOF
  exit 1
}

CMD="${1:-}"
shift || true

case "$CMD" in
  status)
    ORG_ID="${1:-}"
    if [[ -n "$ORG_ID" ]]; then
      run internal.agent.embeddingsActions.embeddingBackfillStatus "{\"orgId\":\"$ORG_ID\"}"
    else
      run internal.agent.embeddingsActions.embeddingBackfillStatus '{}'
    fi
    ;;
  org)
    ORG_ID="${1:?org id required}"
    run internal.agent.embeddingsActions.rebackfillOrgEmbeddings "{\"orgId\":\"$ORG_ID\"}"
    echo "Scheduled force re-embed for org $ORG_ID (batched, async)."
    ;;
  all)
    STAGGER="${1:-1000}"
    run internal.agent.embeddingsActions.rebackfillAllOrganizations "{\"staggerMs\":$STAGGER}"
    echo "Scheduled force re-embed for all orgs (stagger ${STAGGER}ms)."
    ;;
  missing)
    ORG_ID="${1:?org id required}"
    run internal.agent.embeddingsActions.backfillOrgEmbeddings "{\"orgId\":\"$ORG_ID\"}"
    echo "Started missing-only backfill for org $ORG_ID."
    ;;
  *)
    usage
    ;;
esac
