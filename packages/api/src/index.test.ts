import { describe, expect, it } from "vitest";
import { generateMagicCode } from "./auth/jwt.js";

describe("auth helpers", () => {
  it("generates a 6 digit magic code", () => {
    const code = generateMagicCode();
    expect(code).toMatch(/^\d{6}$/);
  });
});

describe("health route", () => {
  it("returns ok from root handler module", async () => {
    const app = (await import("./index.js")).default;
    const response = await app.request("/healthz", {}, {
      DB: {} as D1Database,
      AUTH: {} as KVNamespace,
      UPLOADS: {} as R2Bucket,
      SYNC_ROOMS: {} as DurableObjectNamespace,
    });
    expect(response.status).toBe(200);
    const body = await response.json<{ ok: boolean }>();
    expect(body.ok).toBe(true);
  });
});
