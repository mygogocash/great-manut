import { describe, expect, it } from "vitest";
import { createLocalStore, listActiveIssues, listOutboxEntries } from "../local/index.js";
import { SyncManager } from "./index.js";

type MessageHandlers = { message: (data: string) => void };

function createDeltaManager(store: ReturnType<typeof createLocalStore>) {
  const handlers: MessageHandlers = { message: () => {} };
  const ws = {
    connect() {
      return {
        send() {},
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

  return { manager, handlers };
}

function makeIssue(teamId: string) {
  const timestamp = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    team_id: teamId,
    org_id: crypto.randomUUID(),
    number: 1,
    identifier: "GM-1",
    title: "Remote issue",
    description: "",
    priority: "none" as const,
    state_id: crypto.randomUUID(),
    assignee_ids: [],
    label_ids: [],
    created_by: crypto.randomUUID(),
    updated_by: crypto.randomUUID(),
    created_at: timestamp,
    updated_at: timestamp,
  };
}

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

  it("merges an incoming issue delta into the local store", async () => {
    const store = createLocalStore();
    const { manager, handlers } = createDeltaManager(store);
    await manager.start();

    const teamId = crypto.randomUUID();
    const issue = makeIssue(teamId);

    handlers.message(
      JSON.stringify({
        type: "delta",
        entity: "issue.create",
        idempotency_key: "remote-1",
        data: { issue },
        server_sequence: 1,
      })
    );

    const issues = listActiveIssues(store, teamId);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.id).toBe(issue.id);
    expect(issues[0]?.title).toBe("Remote issue");
    manager.stop();
  });

  it("removes an issue from active list when a delete delta arrives", async () => {
    const store = createLocalStore();
    const { manager, handlers } = createDeltaManager(store);
    await manager.start();

    const teamId = crypto.randomUUID();
    const issue = makeIssue(teamId);

    handlers.message(
      JSON.stringify({
        type: "delta",
        entity: "issue.create",
        idempotency_key: "remote-1",
        data: { issue },
        server_sequence: 1,
      })
    );
    expect(listActiveIssues(store, teamId)).toHaveLength(1);

    handlers.message(
      JSON.stringify({
        type: "delta",
        entity: "issue.delete",
        idempotency_key: "remote-2",
        data: { issue_id: issue.id },
        server_sequence: 2,
      })
    );

    expect(listActiveIssues(store, teamId)).toHaveLength(0);
    manager.stop();
  });
});
