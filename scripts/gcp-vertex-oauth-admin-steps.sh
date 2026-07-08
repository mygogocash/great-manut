#!/usr/bin/env bash
# Print GCP org-admin steps to enable Vertex OAuth (path B) for Manut on Convex.
#
# Org policy iam.disableServiceAccountKeyCreation blocks SA key downloads on
# manut-500913 for all users — an org/folder admin must grant an exception or
# create the key on your behalf.
set -euo pipefail

PROJECT="manut-500913"
PROJECT_NUMBER="46856403198"
SA="manut-vertex-ai@${PROJECT}.iam.gserviceaccount.com"
LOCATION="us-central1"

cat <<EOF
Vertex OAuth setup (path B) — manut-500913
=========================================

Service account (already created):
  ${SA}
  Role: roles/aiplatform.user

Blocker:
  Org constraint iam.disableServiceAccountKeyCreation prevents key creation
  on this project (including new service accounts).

Org admin — pick ONE:

  1) Project exception (recommended)
     GCP Console → IAM & Admin → Organization Policies
     → "Disable service account key creation"
     → Manage policy → Override parent → Add rule
     → Enforce: Off (or allow exception for project ${PROJECT})
     Then you run:
       gcloud iam service-accounts keys create ~/.config/manut/vertex-sa.json \\
         --iam-account=${SA} --project=${PROJECT}

  2) Admin creates key and sends JSON securely (1Password / not Slack)
     You run:
       ./scripts/convex-set-vertex-env.sh ~/.config/manut/vertex-sa.json \\
         ${LOCATION} dev:sincere-oriole-287 --unset-api-key --unset-openai

  3) Admin sets split creds on Convex directly (no local JSON file):
       npx convex env set GOOGLE_VERTEX_PROJECT ${PROJECT}
       npx convex env set GOOGLE_VERTEX_LOCATION ${LOCATION}
       npx convex env set GOOGLE_CLIENT_EMAIL '${SA}'
       npx convex env set GOOGLE_PRIVATE_KEY '-----BEGIN PRIVATE KEY-----\\n...'
       npx convex env remove GOOGLE_VERTEX_API_KEY

After credentials are on Convex:
  ./scripts/deploy-convex.sh
  npx convex run internal.agent.embeddingsActions.smokeTestVertexEmbedding '{}'
  ./scripts/backfill-embeddings.sh all

GCP billing (Vertex, not AI Studio prepay):
  https://console.cloud.google.com/billing/linkedaccount?project=${PROJECT}

Verify APIs enabled:
  aiplatform.googleapis.com

Do NOT commit SA JSON or paste private keys in chat.
EOF
