import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { memoryAuthAdapter, refreshAccessToken } from "./auth.js";

describe("memoryAuthAdapter", () => {
  it("stores and clears JWT tokens in memory", () => {
    memoryAuthAdapter.setTokens({
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_in: 3600,
    });

    expect(memoryAuthAdapter.getAccessToken()).toBe("access-token");
    expect(memoryAuthAdapter.getRefreshToken()).toBe("refresh-token");

    memoryAuthAdapter.clearTokens();

    expect(memoryAuthAdapter.getAccessToken()).toBeNull();
    expect(memoryAuthAdapter.getRefreshToken()).toBeNull();
  });
});

describe("refreshAccessToken", () => {
  beforeEach(() => {
    memoryAuthAdapter.clearTokens();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exchanges the stored refresh token for a new token pair", async () => {
    memoryAuthAdapter.setTokens({
      access_token: "old-access",
      refresh_token: "refresh-1",
      expires_in: 60,
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: "new-access",
        refresh_token: "new-refresh",
        expires_in: 3600,
        token_type: "Bearer",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await refreshAccessToken();

    expect(result).toBe(true);
    expect(memoryAuthAdapter.getAccessToken()).toBe("new-access");
    expect(memoryAuthAdapter.getRefreshToken()).toBe("new-refresh");
    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(JSON.parse(init.body)).toEqual({ refresh_token: "refresh-1" });
  });

  it("returns false when there is no refresh token stored", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await refreshAccessToken();

    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("clears tokens when the refresh request is rejected", async () => {
    memoryAuthAdapter.setTokens({
      access_token: "old-access",
      refresh_token: "bad-refresh",
      expires_in: 60,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) })
    );

    const result = await refreshAccessToken();

    expect(result).toBe(false);
    expect(memoryAuthAdapter.getAccessToken()).toBeNull();
    expect(memoryAuthAdapter.getRefreshToken()).toBeNull();
  });
});
