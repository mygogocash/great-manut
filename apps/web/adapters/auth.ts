import type { AuthAdapter } from "@great-manut/core";

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const memoryAuthAdapter: AuthAdapter = {
  getAccessToken() {
    return accessToken;
  },
  getRefreshToken() {
    return refreshToken;
  },
  setTokens(tokens) {
    accessToken = tokens.access_token;
    refreshToken = tokens.refresh_token;
  },
  clearTokens() {
    accessToken = null;
    refreshToken = null;
  },
};

export function getApiOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://127.0.0.1:8787";
}

let refreshInFlight: Promise<boolean> | null = null;

async function performRefresh(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${getApiOrigin()}/api/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: token }),
    });

    if (!response.ok) {
      memoryAuthAdapter.clearTokens();
      return false;
    }

    const tokens = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
    memoryAuthAdapter.setTokens(tokens);
    return true;
  } catch {
    memoryAuthAdapter.clearTokens();
    return false;
  }
}

/**
 * Exchanges the stored refresh token for a fresh access/refresh pair.
 * Concurrent callers share a single in-flight request so a burst of 401s
 * does not trigger multiple rotations.
 */
export function refreshAccessToken(): Promise<boolean> {
  const token = memoryAuthAdapter.getRefreshToken();
  if (!token) {
    return Promise.resolve(false);
  }

  if (!refreshInFlight) {
    refreshInFlight = performRefresh(token).finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}
