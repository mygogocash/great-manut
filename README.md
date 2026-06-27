# Great Manut

Cloudflare-native, mobile-ready issue tracking built as a greenfield sibling to legacy Manut (`mygogocash-plane`).

- **Repo:** `gogocash/great-manut`
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

## Deploy

Cloudflare resources use the GoGoCash account with separate D1/R2 bindings from legacy Manut:

- Preview worker: `great-manut-api-preview`
- Production worker: `great-manut-api`
- D1: `great-manut-preview`, `great-manut-prod`

```bash
pnpm --filter @great-manut/api db:migrate:preview
pnpm --filter @great-manut/api deploy
```

Wire Cloudflare Workers Builds to `gogocash/great-manut` in the Cloudflare dashboard.

## Docs

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/sync-protocol.md`](docs/sync-protocol.md)
- [`docs/mobile-readiness.md`](docs/mobile-readiness.md)
