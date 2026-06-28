"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { OrgPlan } from "@/lib/plans";

export type SuiteFeature =
  | "docs_write"
  | "discovery"
  | "service_desk"
  | "automations";

function hasSuiteFeature(plan: OrgPlan, feature: SuiteFeature): boolean {
  switch (feature) {
    case "docs_write":
    case "discovery":
      return plan === "pro" || plan === "enterprise";
    case "service_desk":
    case "automations":
      return plan === "enterprise";
    default: {
      const _exhaustive: never = feature;
      return _exhaustive;
    }
  }
}

/** Cosmetic plan gate for suite modules. Convex enforces access in mutations. */
export function useSuiteFeatureAccess(feature: SuiteFeature): {
  isLoaded: boolean;
  hasAccess: boolean;
} {
  const org = useQuery(api.organizations.current);
  return {
    isLoaded: org !== undefined,
    hasAccess: org ? hasSuiteFeature(org.plan, feature) : false,
  };
}
