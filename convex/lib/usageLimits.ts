import { Doc, Id } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";
import {
  AI_CREDIT_WEIGHTS,
  storageIncludedBytes,
  type AiCreditEvent,
} from "./usagePricing";

export function isBusinessPlan(org: Doc<"organizations">): boolean {
  return org.plan === "business";
}

export function getStorageBytesUsed(org: Doc<"organizations">): number {
  return org.storageBytesUsed ?? 0;
}

export function getAiCreditBalance(org: Doc<"organizations">): number {
  return org.aiCreditBalance ?? 0;
}

export function getAiMode(org: Doc<"organizations">): "managed" | "byok" {
  return org.aiMode ?? "managed";
}

/**
 * Block uploads when org storage would exceed plan quota.
 * Free: hard cap at included bytes. Business: allow overage (metered).
 */
export function assertStorageQuota(
  org: Doc<"organizations">,
  additionalBytes: number
): void {
  const used = getStorageBytesUsed(org);
  const after = used + additionalBytes;
  const included = storageIncludedBytes(org.plan);

  if (org.plan === "free" && after > included) {
    const includedGb = included / (1024 * 1024 * 1024);
    throw new Error(
      `Free plan includes ${includedGb} GB of storage. Upgrade to Business for ${storageIncludedBytes("business") / (1024 * 1024 * 1024)} GB and metered overage.`
    );
  }
}

/** Managed mode: require sufficient prepaid balance before AI work. */
export function assertAiCreditBalance(
  org: Doc<"organizations">,
  event: AiCreditEvent
): void {
  if (getAiMode(org) === "byok") {
    return;
  }
  const cost = AI_CREDIT_WEIGHTS[event];
  const balance = getAiCreditBalance(org);
  if (balance < cost) {
    throw new Error(
      `AI credit balance is ${balance.toFixed(1)}. Top up credits or switch to BYOK in workspace AI settings.`
    );
  }
}

export async function adjustStorageBytesUsed(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
  deltaBytes: number
): Promise<void> {
  const org = await ctx.db.get(orgId);
  if (!org) {
    return;
  }
  const current = getStorageBytesUsed(org);
  await ctx.db.patch(orgId, {
    storageBytesUsed: Math.max(0, current + deltaBytes),
  });
}
