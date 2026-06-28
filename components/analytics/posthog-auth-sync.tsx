"use client";

import { useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import {
  identifyUser,
  resetAnalytics,
  setOrgGroup,
} from "@/lib/posthog/client";

/** Keeps PostHog person + org group in sync with Convex auth state. */
export function PostHogAuthSync() {
  const user = useQuery(api.users.current);
  const org = useQuery(api.organizations.current);

  useEffect(() => {
    if (user === undefined) {
      return;
    }
    if (user === null) {
      resetAnalytics();
      return;
    }
    identifyUser({
      id: user._id,
      email: user.email,
      name: user.name,
    });
  }, [user]);

  useEffect(() => {
    if (!user || !org) {
      return;
    }
    setOrgGroup({
      orgId: org._id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
    });
  }, [org, user]);

  return null;
}
