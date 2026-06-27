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
