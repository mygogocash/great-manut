import { ensurePostHogInit, isPostHogConfigured } from "@/lib/posthog/init";

export function isPostHogEnabled(): boolean {
  return isPostHogConfigured();
}

function withPostHog(
  run: (ph: NonNullable<Awaited<ReturnType<typeof ensurePostHogInit>>>) => void,
): void {
  if (!isPostHogConfigured()) {
    return;
  }
  void ensurePostHogInit().then((ph) => {
    if (!ph) {
      return;
    }
    run(ph);
  });
}

export function captureEvent(
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
): void {
  withPostHog((ph) => {
    ph.capture(event, properties);
  });
}

export function capturePageview(url: string): void {
  withPostHog((ph) => {
    ph.capture("$pageview", { $current_url: url });
  });
}

export function identifyUser(user: {
  id: string;
  email?: string;
  name?: string;
}): void {
  withPostHog((ph) => {
    ph.identify(user.id, {
      email: user.email,
      name: user.name,
    });
  });
}

export function setOrgGroup(org: {
  orgId: string;
  name: string;
  slug: string;
  plan: string;
}): void {
  withPostHog((ph) => {
    ph.group("organization", org.orgId, {
      name: org.name,
      slug: org.slug,
      plan: org.plan,
    });
  });
}

export function resetAnalytics(): void {
  withPostHog((ph) => {
    ph.reset();
  });
}

export function captureException(error: unknown): void {
  withPostHog((ph) => {
    ph.captureException(error);
  });
}
