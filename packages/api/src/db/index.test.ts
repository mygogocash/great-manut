import { describe, expect, it } from "vitest";
import type { Env } from "../types.js";
import { isIdempotencyApplied, markIdempotencyApplied } from "./index.js";

function createMockDb() {
  const rows = new Map<string, Record<string, unknown>>();

  return {
    prepare(query: string) {
      const state = { bindings: [] as unknown[] };
      return {
        bind(...values: unknown[]) {
          state.bindings = values;
          return this;
        },
        async first<T>() {
          if (query.includes("applied_idempotency_keys") && query.includes("WHERE key")) {
            const key = String(state.bindings[0]);
            return (rows.get(key) as T | undefined) ?? null;
          }
          return null;
        },
        async run() {
          if (query.includes("INSERT OR IGNORE INTO applied_idempotency_keys")) {
            const [key, appliedAt, entityType, entityId] = state.bindings as [
              string,
              string,
              string | null,
              string | null,
            ];
            if (!rows.has(key)) {
              rows.set(key, { key, applied_at: appliedAt, entity_type: entityType, entity_id: entityId });
            }
          }
        },
      };
    },
  } as unknown as D1Database;
}

describe("idempotency helpers", () => {
  it("marks a key as applied only once", async () => {
    const env: Env = {
      DB: createMockDb(),
      AUTH: {} as KVNamespace,
      UPLOADS: {} as R2Bucket,
      SYNC_ROOMS: {} as DurableObjectNamespace,
    };

    expect(await isIdempotencyApplied(env, "key-1")).toBe(false);

    await markIdempotencyApplied(env, "key-1", "issue.create");
    expect(await isIdempotencyApplied(env, "key-1")).toBe(true);

    await markIdempotencyApplied(env, "key-1", "issue.create");
    expect(await isIdempotencyApplied(env, "key-1")).toBe(true);
  });
});
