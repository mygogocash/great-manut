import type { Store } from "tinybase";
import type { HttpAdapter, WebSocketAdapter } from "../adapters/index.js";
import type { SyncDelta } from "../schemas/index.js";
import { listOutboxEntries, removeOutboxEntry, upsertIssue, TABLE_ISSUES } from "../local/index.js";
import { issueSchema, syncDeltaSchema } from "../schemas/index.js";

export type SyncManagerOptions = {
  store: Store;
  http: HttpAdapter;
  ws: WebSocketAdapter;
  getAccessToken: () => string | null;
  apiOrigin: string;
  orgSlug: string;
  onDelta?: (delta: SyncDelta) => void;
};

export class SyncManager {
  private connection: ReturnType<WebSocketAdapter["connect"]> | null = null;
  private draining = false;
  private reconnectAttempts = 0;
  private closed = false;

  constructor(private readonly options: SyncManagerOptions) {}

  async start(): Promise<void> {
    this.closed = false;
    await this.connect();
    void this.drainOutbox();
  }

  stop(): void {
    this.closed = true;
    this.connection?.close();
    this.connection = null;
  }

  private async connect(): Promise<void> {
    const token = this.options.getAccessToken();
    if (!token) {
      return;
    }

    const url = `${this.options.apiOrigin}/api/sync/ws?orgSlug=${encodeURIComponent(this.options.orgSlug)}&token=${encodeURIComponent(token)}`;
    const ws = this.options.ws.connect(url, ["great-manut-sync-v1"]);

    ws.onOpen(() => {
      this.reconnectAttempts = 0;
    });

    ws.onMessage((raw) => {
      try {
        const parsed = syncDeltaSchema.parse(JSON.parse(raw));
        if (parsed.type === "pong") {
          return;
        }
        if (parsed.type === "delta") {
          this.applyDelta(parsed);
        }
        this.options.onDelta?.(parsed);
        if (parsed.type === "ack" && parsed.idempotency_key) {
          this.ackOutbox(parsed.idempotency_key);
        }
      } catch {
        // ignore malformed frames
      }
    });

    ws.onClose(() => {
      this.connection = null;
      if (!this.closed) {
        this.scheduleReconnect();
      }
    });

    ws.onError(() => {
      // onClose handles reconnect
    });

    this.connection = ws;
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts += 1;
    const delayMs = Math.min(30_000, 500 * 2 ** this.reconnectAttempts);
    setTimeout(() => {
      if (!this.closed) {
        void this.connect();
      }
    }, delayMs);
  }

  private applyDelta(delta: SyncDelta): void {
    if (delta.type !== "delta" || !delta.entity) {
      return;
    }

    const data = (delta.data ?? {}) as Record<string, unknown>;

    switch (delta.entity) {
      case "issue.create":
      case "issue.update": {
        const parsed = issueSchema.safeParse(data.issue);
        if (parsed.success) {
          upsertIssue(this.options.store, parsed.data);
        }
        break;
      }
      case "issue.delete": {
        const issueId = typeof data.issue_id === "string" ? data.issue_id : undefined;
        if (issueId && this.options.store.hasRow(TABLE_ISSUES, issueId)) {
          this.options.store.setCell(TABLE_ISSUES, issueId, "deleted_at", new Date().toISOString());
        }
        break;
      }
      default:
        break;
    }
  }

  private ackOutbox(idempotencyKey: string): void {
    const entries = listOutboxEntries(this.options.store);
    for (const entry of entries) {
      if (entry.idempotency_key === idempotencyKey) {
        removeOutboxEntry(this.options.store, entry.id);
      }
    }
  }

  async drainOutbox(): Promise<void> {
    if (this.draining) {
      return;
    }
    this.draining = true;

    try {
      while (!this.closed) {
        const [next] = listOutboxEntries(this.options.store);
        if (!next) {
          break;
        }

        const sent = this.sendMutation(next.idempotency_key, next.op, next.payload);
        if (!sent) {
          break;
        }

        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 50);
        });
      }
    } finally {
      this.draining = false;
    }
  }

  private sendMutation(idempotencyKey: string, op: string, payload: Record<string, unknown>): boolean {
    if (!this.connection) {
      return false;
    }

    const message: SyncDelta = {
      type: "mutation",
      idempotency_key: idempotencyKey,
      entity: op,
      data: payload,
    };

    this.connection.send(JSON.stringify(message));
    return true;
  }

  ping(): void {
    this.connection?.send(JSON.stringify({ type: "ping" satisfies SyncDelta["type"] }));
  }
}

export async function bootstrapFromServer(
  http: HttpAdapter,
  apiOrigin: string,
  orgSlug: string,
  accessToken: string
) {
  const response = await http.request(
    `${apiOrigin}/api/sync/bootstrap?orgSlug=${encodeURIComponent(orgSlug)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Bootstrap failed with status ${response.status}`);
  }

  return response.json();
}
