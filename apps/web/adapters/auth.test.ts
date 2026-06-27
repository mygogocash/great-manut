import { describe, expect, it } from "vitest";
import { memoryAuthAdapter } from "./auth.js";

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
