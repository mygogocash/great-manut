import { DurableObject } from "cloudflare:workers";
import type { Env } from "../types.js";
import { isIdempotencyApplied, markIdempotencyApplied } from "../db/index.js";
import { nowIso } from "../lib/http.js";

type SyncMessage = {
  type: "mutation" | "ack" | "delta" | "ping" | "pong";
  idempotency_key?: string;
  entity?: string;
  data?: unknown;
  server_sequence?: number;
};

export class SyncRoomDurableObject extends DurableObject<Env> {
  private sequence = 0;
  private sessions = new Map<WebSocket, { userId: string; orgId: string }>();

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected websocket", { status: 426 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const orgId = url.searchParams.get("orgId");

    if (!userId || !orgId) {
      return new Response("Missing session params", { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server);
    this.sessions.set(server, { userId, orgId });

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const session = this.sessions.get(ws);
    if (!session) {
      ws.close(1008, "Unknown session");
      return;
    }

    const raw = typeof message === "string" ? message : new TextDecoder().decode(message);
    let parsed: SyncMessage;
    try {
      parsed = JSON.parse(raw) as SyncMessage;
    } catch {
      return;
    }

    if (parsed.type === "ping") {
      ws.send(JSON.stringify({ type: "pong" satisfies SyncMessage["type"] }));
      return;
    }

    if (parsed.type !== "mutation" || !parsed.idempotency_key) {
      return;
    }

    const alreadyApplied = await isIdempotencyApplied(this.env, parsed.idempotency_key);
    if (alreadyApplied) {
      ws.send(
        JSON.stringify({
          type: "ack",
          idempotency_key: parsed.idempotency_key,
        } satisfies SyncMessage)
      );
      return;
    }

    this.sequence += 1;
    await markIdempotencyApplied(this.env, parsed.idempotency_key, parsed.entity, undefined);

    await this.env.DB.prepare(
      "INSERT INTO sync_log (org_id, server_sequence, payload, created_at) VALUES (?, ?, ?, ?)"
    )
      .bind(session.orgId, this.sequence, raw, nowIso())
      .run();

    const delta: SyncMessage = {
      type: "delta",
      idempotency_key: parsed.idempotency_key,
      entity: parsed.entity,
      data: parsed.data,
      server_sequence: this.sequence,
    };

    ws.send(
      JSON.stringify({
        type: "ack",
        idempotency_key: parsed.idempotency_key,
        server_sequence: this.sequence,
      } satisfies SyncMessage)
    );

    for (const [socket] of this.sessions) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(delta));
      }
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    this.sessions.delete(ws);
  }
}
