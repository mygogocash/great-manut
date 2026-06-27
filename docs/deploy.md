# Deploy guide

Step-by-step operator runbook for first-time Cloudflare + GitHub setup of **Great Manut**.

**Account:** Cloudflare GoGoCash (`187ab61ed9dbc6e616cb23e6b95aa8f1`)  
**GitHub org:** `mygogocash`  
**Target repo:** `mygogocash/great-manut`  
**Default branch for CI:** `preview`

---

## 1. Create the GitHub repository

The repo does not exist yet. An org owner or member with **repo creation** permission must create it.

### Option A — GitHub CLI (recommended)

From the local clone (on branch `preview`):

```bash
cd /path/to/great-manut
gh repo create mygogocash/great-manut \
  --private \
  --description "Cloudflare-native issue tracking (Great Manut greenfield)" \
  --source=. \
  --remote=origin \
  --push
```

If the repo already exists but has no remote:

```bash
git remote add origin git@github.com:mygogocash/great-manut.git
git push -u origin preview
```

### Option B — GitHub web UI

1. Go to https://github.com/organizations/mygogocash/repositories/new
2. Name: `great-manut`, visibility: Private
3. Do **not** initialize with README (this clone already has history)
4. Add remote and push:

```bash
git remote add origin git@github.com:mygogocash/great-manut.git
git push -u origin preview
```

### Verify

```bash
gh repo view mygogocash/great-manut
```

Expected: repository metadata (URL, default branch, visibility).  
If you see `Could not resolve to a Repository`, the repo is not created or your token lacks org access.

---

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

## 7. Deploy preview Worker

```bash
pnpm --filter @great-manut/api deploy
```

This deploys `great-manut-api-preview` (default env in `wrangler.toml`).

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

Connect GitHub so pushes to `preview` auto-deploy the API Worker.

1. Cloudflare dashboard → **Workers & Pages** → **great-manut-api-preview**
2. **Settings** → **Builds** → **Connect to Git**
3. Select GitHub account → repository **`mygogocash/great-manut`**
4. Production branch: **`preview`** (matches CI default)
5. Build settings:
   - **Root directory:** `/` (monorepo root)
   - **Build command:** `pnpm install --frozen-lockfile && pnpm --filter @great-manut/api build`
   - **Deploy command:** `pnpm --filter @great-manut/api exec wrangler deploy`
6. Save and trigger a test build from the latest `preview` commit

Repeat for production worker **`great-manut-api`** with branch **`main`** and `--env production` on deploy when production cutover is ready.

---

## 9. Web app (follow-up)

The web shell (`@great-manut/web`) builds in CI but is not yet deployed by this repo. Host `apps/web/build/client` on Cloudflare Pages or serve via the Worker once routing is defined.

Local web dev proxies `/api` to `http://127.0.0.1:8787` (see `apps/web/vite.config.ts`). Update `APP_ORIGIN` in `wrangler.toml` when the public web URL is known.

---

## Quick reference

| Resource | Preview | Production |
|---|---|---|
| Worker | `great-manut-api-preview` | `great-manut-api` |
| D1 | `great-manut-preview` | `great-manut-prod` |
| R2 | `great-manut-uploads-preview` | `great-manut-uploads-prod` |
| KV binding | `AUTH` | `AUTH` |
| Git branch (CI/deploy) | `preview` | `main` |

| Command | Purpose |
|---|---|
| `pnpm check` | Typecheck all packages |
| `pnpm test` | Unit tests |
| `pnpm build` | Turbo build (includes web) |
| `pnpm --filter @great-manut/api deploy` | Deploy preview Worker |
| `pnpm --filter @great-manut/api db:migrate:preview` | Remote D1 migrations (preview) |
