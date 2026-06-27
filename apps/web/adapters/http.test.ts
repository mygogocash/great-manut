import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { browserHttpAdapter } from "./http.js";
import { memoryAuthAdapter } from "./auth.js";

describe("browserHttpAdapter", () => {
  beforeEach(() => {
    memoryAuthAdapter.clearTokens();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("refreshes the access token once and retries after a 401", async () => {
    memoryAuthAdapter.setTokens({
      access_token: "expired",
      refresh_token: "refresh-1",
      expires_in: 60,
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
        text: async () => "",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: "fresh",
          refresh_token: "refresh-2",
          expires_in: 3600,
          token_type: "Bearer",
        }),
        text: async () => "",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
        text: async () => "",
      });
    vi.stubGlobal("fetch", fetchMock);

    const response = await browserHttpAdapter.request("http://127.0.0.1:8787/api/users/me");

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(memoryAuthAdapter.getAccessToken()).toBe("fresh");
    const retryInit = fetchMock.mock.calls[2][1] as { headers: Record<string, string> };
    expect(retryInit.headers.Authorization).toBe("Bearer fresh");
  });

  it("does not retry when no refresh token is available", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await browserHttpAdapter.request("http://127.0.0.1:8787/api/users/me");

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
