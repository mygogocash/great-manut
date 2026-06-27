# Sync protocol

WebSocket endpoint: `GET /api/sync/ws?orgSlug=<slug>&token=<jwt>`

## Client → server

```json
{ "type": "ping" }
```

```json
{
  "type": "mutation",
  "idempotency_key": "issue_update_…",
  "entity": "issue.update",
  "data": { "issue": { "…": "…" } }
}
```

## Server → client

```json
{ "type": "pong" }
```

```json
{
  "type": "ack",
  "idempotency_key": "issue_update_…",
  "server_sequence": 12
}
```

```json
{
  "type": "delta",
  "idempotency_key": "issue_update_…",
  "entity": "issue.update",
  "data": { "…": "…" },
  "server_sequence": 12
}
```

## Outbox drain

1. UI mutation writes local TinyBase state + outbox row.
2. `SyncManager` sends the oldest outbox row over WebSocket.
3. Server dedupes with `applied_idempotency_keys`.
4. Server broadcasts `delta` to all room members.
5. Originating client removes outbox row on `ack`.

HTTP `/api/sync/bootstrap` hydrates cold start before subscribing to the room.
