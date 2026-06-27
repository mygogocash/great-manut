import type { HttpAdapter } from "@great-manut/core";
import { memoryAuthAdapter } from "./auth.js";

export const browserHttpAdapter: HttpAdapter = {
  async request(url, init = {}) {
    const headers = { ...(init.headers ?? {}) };
    const token = memoryAuthAdapter.getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: init.method,
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: init.body,
    });

    return {
      ok: response.ok,
      status: response.status,
      json: async <T>() => response.json() as Promise<T>,
      text: () => response.text(),
    };
  },
};
