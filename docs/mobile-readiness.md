# Mobile readiness

Great Manut is structured so Expo/RN is a **UI shell swap**, not a backend rewrite.

## What mobile reuses unchanged

- `@great-manut/core` Zod schemas
- TinyBase store definition and query helpers
- Mutation + outbox helpers
- `SyncManager` websocket/outbox loop
- Hono RPC/REST auth and bootstrap endpoints

## What mobile replaces

| Web adapter | Mobile adapter |
|---|---|
| IndexedDB persister | Expo SQLite / OP-SQLite persister |
| in-memory JWT holder | `expo-secure-store` |
| browser `fetch` | React Native networking |
| browser `WebSocket` | RN WebSocket (same DO endpoint) |

## Checklist before shipping iOS/Android

- [ ] Implement `StorageAdapter` for SQLite
- [ ] Background sync task to drain outbox when app resumes
- [ ] Secure token refresh on 401
- [ ] Attachment uploads via `/api/uploads/presign`
- [ ] App Store / Play Store signing + EAS profiles

Start from [`apps/mobile/README.md`](../apps/mobile/README.md).
