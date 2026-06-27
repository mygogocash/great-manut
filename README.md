# Great Manut

Cloudflare-native, mobile-ready issue tracking built as a greenfield sibling to legacy Manut (`mygogocash-plane`).

- **Repo:** [`mygogocash/great-manut`](https://github.com/mygogocash/great-manut)
- **Branches:** `preview` → testing/staging · `main` → production
- **Stack:** Turborepo, Hono Worker, D1, Durable Objects, TinyBase local-first core, React Router v7 web shell
- **Domain:** Organization → Team → Issue (`ENG-123`)

## Packages

| Package | Purpose |
|---|---|
| `@great-manut/api` | Cloudflare Worker API + SyncRoom Durable Object |
| `@great-manut/core` | Zod schemas, TinyBase store, outbox, SyncManager |
| `@great-manut/web` | React Router v7 UI shell |
| `@great-manut/mobile` | Expo placeholder |

## Local development

```bash
pnpm install
pnpm --filter @great-manut/api db:migrate:local
pnpm --filter @great-manut/api dev
```

In another terminal:

```bash
pnpm --filter @great-manut/web dev
```

Seed preview data (with API running):

```bash
curl -X POST http://127.0.0.1:8787/api/dev/seed
```

Login flow:

1. Open `http://localhost:5173/login`
2. Send magic code for your email
3. Read the 6-digit code from the API worker logs
4. Verify and load org slug `demo` in the app shell

## Tests

```bash
pnpm test
pnpm check
```

## Branching & environments

| Git branch | Role | Cloudflare Worker | D1 |
|---|---|---|---|
| `preview` | Testing / staging | `great-manut-api-preview` | `great-manut-preview` |
| `main` | Production | `great-manut-api` | `great-manut-prod` |

Day-to-day work merges into **`preview`**. When staging is validated, promote to **`main`** (PR or merge). CI runs on both branches; deploy commands differ by environment (see below).

## Deploy

See **[`docs/deploy.md`](docs/deploy.md)** for first-time Cloudflare setup.

**Staging (`preview` branch):**

```bash
pnpm --filter @great-manut/api db:migrate:preview
pnpm --filter @great-manut/api deploy:preview
```

**Production (`main` branch):**

```bash
pnpm --filter @great-manut/api db:migrate:production
pnpm --filter @great-manut/api deploy:production
```

## Docs

- [`docs/deploy.md`](docs/deploy.md)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/sync-protocol.md`](docs/sync-protocol.md)
- [`docs/mobile-readiness.md`](docs/mobile-readiness.md)
