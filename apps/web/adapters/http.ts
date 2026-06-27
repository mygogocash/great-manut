import type { HttpAdapter, HttpRequestInit } from "@great-manut/core";
import { memoryAuthAdapter, refreshAccessToken } from "./auth.js";

async function send(url: string, init: HttpRequestInit): Promise<Response> {
  const headers = { ...(init.headers ?? {}) };
  const token = memoryAuthAdapter.getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    method: init.method,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: init.body,
  });
}

export const browserHttpAdapter: HttpAdapter = {
  async request(url, init = {}) {
    let response = await send(url, init);

    // Access tokens are short-lived; on a 401 rotate via the refresh token once and retry.
    if (response.status === 401 && memoryAuthAdapter.getRefreshToken()) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        response = await send(url, init);
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      json: async <T>() => response.json() as Promise<T>,
      text: () => response.text(),
    };
  },
};
