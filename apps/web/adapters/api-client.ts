import { hc } from "hono/client";

// Keep the RPC client loosely typed until Worker-only modules are split from the public client surface.
export function createApiClient(baseUrl: string) {
  return hc<any>(baseUrl);
}
