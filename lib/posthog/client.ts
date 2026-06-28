import posthog from "posthog-js";

export function isPostHogEnabled(): boolean {
  return Boolean(
    typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
  );
}

export function captureEvent(
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (!isPostHogEnabled()) {
    return;
  }
  posthog.capture(event, properties);
}

export function capturePageview(url: string): void {
  if (!isPostHogEnabled()) {
    return;
  }
  posthog.capture("$pageview", { $current_url: url });
}

export function identifyUser(user: {
  id: string;
  email?: string;
  name?: string;
}): void {
  if (!isPostHogEnabled()) {
    return;
  }
  posthog.identify(user.id, {
    email: user.email,
    name: user.name,
  });
}

export function setOrgGroup(org: {
  orgId: string;
  name: string;
  slug: string;
  plan: string;
}): void {
  if (!isPostHogEnabled()) {
    return;
  }
  posthog.group("organization", org.orgId, {
    name: org.name,
    slug: org.slug,
    plan: org.plan,
  });
}

export function resetAnalytics(): void {
  if (!isPostHogEnabled()) {
    return;
  }
  posthog.reset();
}

export function captureException(error: unknown): void {
  if (!isPostHogEnabled()) {
    return;
  }
  posthog.captureException(error);
}
