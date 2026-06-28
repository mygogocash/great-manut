"use client";

import { PostHogAuthSync } from "@/components/analytics/posthog-auth-sync";

/** PostHog identify for signed-in routes outside the workspace shell. */
export function AuthedAnalytics() {
  return <PostHogAuthSync />;
}
