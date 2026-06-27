# Architecture

## Decision: TinyBase over RxDB

Great Manut uses **TinyBase** for the local-first layer because:

- The sync loop is custom (outbox + Durable Object WebSockets), not RxDB replication.
- TinyBase exposes reactive table listeners used by both web and future mobile shells.
- Storage is swappable via a thin `StorageAdapter` (IndexedDB today, Expo SQLite later).

RxDB remains a valid future swap behind the same adapter boundary if replication needs grow.

## Layering

```txt
apps/web, apps/mobile (future)
  └── platform adapters (HTTP, auth memory, websocket, persister)
packages/core
  └── schemas, local store, mutations, outbox, SyncManager
packages/api
  └── Hono REST/RPC, JWT auth, D1, SyncRoom DO
```

## Rules

1. No `window`, `localStorage`, or raw `fetch` inside `packages/core`.
2. UI reads from TinyBase; writes go through mutation helpers that enqueue outbox rows.
3. JWT bearer auth only — no cookie-only session requirement.
4. Every mutation carries an `idempotency_key`.

## Cloudflare bindings

| Binding | Purpose |
|---|---|
| `DB` | D1 canonical data |
| `AUTH` | KV magic codes + refresh tokens |
| `UPLOADS` | R2 attachment presign (stub in v1) |
| `SYNC_ROOMS` | Durable Object websocket rooms per org |

## Legacy Manut relationship

This repository is intentionally separate from `mygogocash-plane`. Share operational patterns only; do not import Plane CE packages or Django API contracts.
