/**
 * Free-tier caps removed — unlimited seats, projects, issues, and suite modules.
 * Storage and AI credits are enforced via convex/lib/usageLimits.ts.
 */

import { Doc } from "../_generated/dataModel";

export function isBusinessPlan(org: Doc<"organizations">): boolean {
  return org.plan === "business";
}

/** All orgs have full suite access on both plans. */
export function hasAiAccess(_org: Doc<"organizations">): boolean {
  return true;
}

export function hasDocsWrite(_org: Doc<"organizations">): boolean {
  return true;
}

export function hasDiscovery(_org: Doc<"organizations">): boolean {
  return true;
}

export function hasServiceDesk(_org: Doc<"organizations">): boolean {
  return true;
}

export function hasAutomations(_org: Doc<"organizations">): boolean {
  return true;
}

export function assertHasDocsWrite(_org: Doc<"organizations">): void {}

export function assertHasDiscovery(_org: Doc<"organizations">): void {}

export function assertHasServiceDesk(_org: Doc<"organizations">): void {}

export function assertHasAutomations(_org: Doc<"organizations">): void {}
