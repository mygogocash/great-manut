"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export type SuiteFeature =
  | "docs_write"
  | "discovery"
  | "service_desk"
  | "automations";

/** All suite modules are included on Free and Business. */
export function useSuiteFeatureAccess(_feature: SuiteFeature): {
  isLoaded: boolean;
  hasAccess: boolean;
} {
  const org = useQuery(api.organizations.current);
  return {
    isLoaded: org !== undefined,
    hasAccess: org !== null,
  };
}
