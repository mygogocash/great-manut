-- Sync and idempotency

CREATE TABLE IF NOT EXISTS applied_idempotency_keys (
  key TEXT PRIMARY KEY NOT NULL,
  applied_at TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT
);

CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT NOT NULL,
  server_sequence INTEGER NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS sync_log_org_sequence_idx ON sync_log (org_id, server_sequence);
