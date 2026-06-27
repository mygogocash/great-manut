import { describe, expect, it } from "vitest";
import { createLocalStore, listOutboxEntries } from "../local/index.js";
import { SyncManager } from "./index.js";

describe("SyncManager", () => {
  it("drains outbox via websocket ack", async () => {
    const store = createLocalStore();
    store.setRow("outbox_queue", "1", {
      id: "1",
      idempotency_key: "test-key",
      op: "issue.update",
      payload: JSON.stringify({}),
      created_at: new Date().toISOString(),
      retry_count: 0,
    });

    let sent = "";
    const ws = {
      connect() {
        return {
          send(data: string) {
            sent = data;
            const parsed = JSON.parse(data) as { idempotency_key?: string };
            handlers.message(
              JSON.stringify({ type: "ack", idempotency_key: parsed.idempotency_key })
            );
          },
          close() {},
          onOpen(handler: () => void) {
            handler();
          },
          onMessage(handler: (data: string) => void) {
            handlers.message = handler;
          },
          onClose() {},
          onError() {},
        };
      },
    };

    const handlers = {
      message: (_data: string) => {},
    };

    const manager = new SyncManager({
      store,
      http: {
        async request() {
          return {
            ok: true,
            status: 200,
            json: async <T>() => ({}) as T,
            text: async () => "",
          };
        },
      },
      ws,
      getAccessToken: () => "token",
      apiOrigin: "http://localhost:8787",
      orgSlug: "demo",
    });

    await manager.start();
    await manager.drainOutbox();

    expect(sent).toContain("test-key");
    expect(listOutboxEntries(store)).toHaveLength(0);
    manager.stop();
  });
});
