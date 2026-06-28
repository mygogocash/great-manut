import type posthog from "posthog-js";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

let initPromise: Promise<typeof posthog | null> | null = null;
let ready = false;

export function isPostHogConfigured(): boolean {
  return Boolean(token);
}

/** Lazy-load posthog-js after idle so clicks are not blocked on first paint. */
export function ensurePostHogInit(): Promise<typeof posthog | null> {
  if (!token || typeof window === "undefined") {
    return Promise.resolve(null);
  }
  if (ready) {
    return initPromise!;
  }
  initPromise ??= import("posthog-js").then(({ default: ph }) => {
    ph.init(token!, {
      api_host: "/ingest",
      ui_host:
        process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? "https://us.posthog.com",
      defaults: "2026-01-30",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      capture_exceptions: true,
      person_profiles: "identified_only",
      debug: process.env.NODE_ENV === "development",
    });
    ready = true;
    return ph;
  });
  return initPromise;
}

export function schedulePostHogInit(): void {
  if (!token || typeof window === "undefined") {
    return;
  }
  const run = () => {
    void ensurePostHogInit();
  };
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 3000 });
  } else {
    globalThis.setTimeout(run, 1);
  }
}
