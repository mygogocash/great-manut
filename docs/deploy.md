# Deploy guide

Step-by-step operator runbook for first-time Cloudflare + GitHub setup of **Great Manut**.

**Account:** Cloudflare GoGoCash (`187ab61ed9dbc6e616cb23e6b95aa8f1`)  
**GitHub org:** `mygogocash`  
**Target repo:** `mygogocash/great-manut`

## Branching model

| Branch | Purpose | Deploy target |
|---|---|---|
| **`preview`** | Testing and staging | `great-manut-api-preview` + `great-manut-preview` D1 |
| **`main`** | Production | `great-manut-api` + `great-manut-prod` D1 |

- Feature work lands on **`preview`** first.
- Promote to **`main`** only after staging smoke passes.
- CI runs on both branches (`.github/workflows/ci.yml`).
- Workers Builds: connect **`preview`** branch → preview Worker; **`main`** branch → production Worker (`--env production`).

---

## 1. GitHub repository

Repo: https://github.com/mygogocash/great-manut

Both branches should exist:

```bash
git push -u origin preview   # staging
git push -u origin main      # production
```

Optional: set **`preview`** as the default branch in GitHub Settings (keeps PRs targeting staging by default).

## 2. Push the `preview` branch

CI runs on pushes to `preview` and `main` (see `.github/workflows/ci.yml`).

```bash
git checkout preview
git push -u origin preview
```

Open the **Actions** tab on GitHub and confirm the CI workflow passes (`pnpm check`, `pnpm test`, `@great-manut/web` build).

---

## 3. Create Cloudflare resources (GoGoCash account)

Authenticate Wrangler if needed:

```bash
pnpm --filter @great-manut/api exec wrangler whoami
```

All commands below run from `packages/api` unless noted.

### 3.1 D1 databases

```bash
cd packages/api

pnpm exec wrangler d1 create great-manut-preview
pnpm exec wrangler d1 create great-manut-prod
```

Copy each `database_id` from the command output.

### 3.2 KV namespaces

```bash
pnpm exec wrangler kv namespace create AUTH
pnpm exec wrangler kv namespace create AUTH --env production
```

Copy each namespace `id`.

### 3.3 R2 buckets

```bash
pnpm exec wrangler r2 bucket create great-manut-uploads-preview
pnpm exec wrangler r2 bucket create great-manut-uploads-prod
```

Bucket names only — no ID to paste.

---

## 4. Update `wrangler.toml` IDs

Edit `packages/api/wrangler.toml` and replace placeholder IDs:

| Placeholder | Replace with |
|---|---|
| `database_id = "00000000-0000-0000-0000-000000000001"` | `great-manut-preview` D1 id |
| `database_id = "00000000-0000-0000-0000-000000000002"` | `great-manut-prod` D1 id (under `[env.production]`) |
| `id = "00000000000000000000000000000001"` | preview `AUTH` KV id |
| `id = "00000000000000000000000000000002"` | production `AUTH` KV id |

Commit and push the updated `wrangler.toml` to `preview`.

---

## 5. Set Worker secrets

Preview (default worker `great-manut-api-preview`):

```bash
cd packages/api
pnpm exec wrangler secret put JWT_SECRET
# Optional until Resend is wired:
pnpm exec wrangler secret put RESEND_API_KEY
pnpm exec wrangler secret put RESEND_FROM_EMAIL
```

Production:

```bash
pnpm exec wrangler secret put JWT_SECRET --env production
pnpm exec wrangler secret put RESEND_API_KEY --env production
pnpm exec wrangler secret put RESEND_FROM_EMAIL --env production
```

Use strong, unique values for `JWT_SECRET` in each environment.

---

## 6. Apply D1 migrations (remote)

Preview:

```bash
pnpm --filter @great-manut/api db:migrate:preview
```

Production (when ready):

```bash
pnpm --filter @great-manut/api db:migrate:production
```

Local-only migrations (developer machines):

```bash
pnpm --filter @great-manut/api db:migrate:local
```

---

## 7. Deploy Workers

**Staging** (from `preview` branch):

```bash
pnpm --filter @great-manut/api deploy:preview
```

Deploys `great-manut-api-preview` (default env in `wrangler.toml`).

**Production** (from `main` branch):

```bash
pnpm --filter @great-manut/api deploy:production
```

Deploys `great-manut-api` (`[env.production]` in `wrangler.toml`).

Smoke check:

```bash
curl -sS "$(pnpm --filter @great-manut/api exec wrangler deploy --dry-run 2>/dev/null || echo https://great-manut-api-preview.<subdomain>.workers.dev)/healthz"
```

Or hit `/healthz` on the Workers.dev URL shown after deploy.

Seed demo data (non-production only):

```bash
curl -X POST https://<preview-worker-host>/api/dev/seed
```

---

## 8. Wire Cloudflare Workers Builds

Create a **separate** Workers Builds project for Great Manut — do **not** reuse **`manut-app`**. That name is already the production **Plane Manut** Worker (`LiveRoomDurableObject`) in the same Cloudflare account. Pointing Great Manut at `manut-app` will fail deploy (DO class mismatch) or overwrite production Manut.

Recommended project / Worker names:

| Environment | Worker name | URL (example) |
|---|---|---|
| Staging (`preview`) | `great-manut-api-preview` | `https://great-manut-api-preview.bettergogocash.workers.dev` |
| Production (`main`) | `great-manut-api` | `https://great-manut-api.bettergogocash.workers.dev` |

### Dashboard settings (Build → Build configuration)

| Field | Value |
|---|---|
| Git repository | `mygogocash/great-manut` |
| **Production branch** | **`main`** |
| **Builds for non-production branches** | **Enabled** (deploys `preview` and feature branches to staging Worker) |
| Root directory | `/` |
| **Build command** | `pnpm run build` |
| **Deploy command** | **`pnpm run deploy`** (or `bash deploy.sh`) — **not** `npx wrangler deploy` |
| Version command | *(optional)* `cd packages/api && pnpm exec wrangler versions upload` |

The deploy script picks the Worker automatically:

- **`main`** → top-level `wrangler.toml` env → `great-manut-api`
- **`preview`** (and other branches) → `wrangler deploy --env staging` → `great-manut-api-preview`

Replace `npx wrangler deploy` — it fails on pnpm monorepos, ignores branch → environment mapping, and (if the Builds project is named `manut-app`) targets the wrong Worker.

### Resource IDs (GoGoCash account, 2026-06-27)

| Resource | Name | ID |
|---|---|---|
| D1 preview | `great-manut-preview` | `2b34f8e8-5793-4de3-b683-a2347de17578` |
| D1 production | `great-manut-prod` | `7ab2abcb-f876-4a35-996b-4d1a1e8c2fd1` |
| KV preview (`AUTH`) | `great-manut-auth-preview` | `068e8ef8254a4f0eb39e698e4e7105dc` |
| KV production (`AUTH`) | `great-manut-auth-prod` | `06c31f95835a4284b9a85a9e9b3003ec` |
| R2 preview | `great-manut-uploads-preview` | *(bucket name only)* |
| R2 production | `great-manut-uploads-prod` | *(bucket name only)* |

Remote migrations applied: `0001_core`, `0002_issues`, `0003_sync` on both D1 databases.

---

## 9. Web app (follow-up)

The web shell (`@great-manut/web`) builds in CI but is not yet deployed by this repo. Host `apps/web/build/client` on Cloudflare Pages or serve via the Worker once routing is defined.

Local web dev proxies `/api` to `http://127.0.0.1:8787` (see `apps/web/vite.config.ts`). Update `APP_ORIGIN` in `wrangler.toml` when the public web URL is known.

---

## Quick reference

| Resource | Staging (`preview`) | Production (`main`) |
|---|---|---|
| Worker | `great-manut-api-preview` | `great-manut-api` |
| D1 | `great-manut-preview` | `great-manut-prod` |
| R2 | `great-manut-uploads-preview` | `great-manut-uploads-prod` |
| KV binding | `AUTH` | `AUTH` |

| Command | Purpose |
|---|---|
| `pnpm check` | Typecheck all packages |
| `pnpm test` | Unit tests |
| `pnpm build` | Turbo build (includes web) |
| `pnpm --filter @great-manut/api deploy:preview` | Deploy staging Worker |
| `pnpm --filter @great-manut/api deploy:production` | Deploy production Worker |
| `pnpm --filter @great-manut/api db:migrate:preview` | Remote D1 migrations (staging) |
| `pnpm --filter @great-manut/api db:migrate:production` | Remote D1 migrations (production) |
