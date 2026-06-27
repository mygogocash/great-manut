# @great-manut/mobile

Placeholder for the future Expo / React Native shell.

## Integration plan

1. Add Expo app bootstrap with `@great-manut/core` as the only business-logic dependency.
2. Implement `StorageAdapter` using Expo SQLite or OP-SQLite.
3. Reuse `SyncManager`, mutation handlers, and Zod schemas unchanged.
4. Store JWTs in `expo-secure-store`.
5. Connect to the same `/api/sync/ws` Durable Object endpoint as web.

See [`docs/mobile-readiness.md`](../../docs/mobile-readiness.md).
