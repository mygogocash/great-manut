import { v } from "convex/values";
import { orgQuery } from "./lib/customFunctions";
import {
  getAiCreditBalance,
  getAiMode,
  getStorageBytesUsed,
} from "./lib/usageLimits";
import {
  STORAGE_OVERAGE_USD_PER_GB_MONTH,
  storageIncludedBytes,
} from "./lib/usagePricing";
import { aiModeValidator, planValidator } from "./schema";

function bytesToGb(bytes: number): number {
  return bytes / (1024 * 1024 * 1024);
}

export const getOrgUsage = orgQuery({
  args: {},
  returns: v.object({
    plan: planValidator,
    storageBytesUsed: v.number(),
    storageIncludedBytes: v.number(),
    storageOverageBytes: v.number(),
    estimatedStorageOverageUsd: v.number(),
    aiMode: aiModeValidator,
    aiCreditBalance: v.number(),
    memberCount: v.number(),
  }),
  handler: async (ctx) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .collect();

    const used = getStorageBytesUsed(ctx.org);
    const included = storageIncludedBytes(ctx.org.plan);
    const overage =
      ctx.org.plan === "business" && used > included ? used - included : 0;

    return {
      plan: ctx.org.plan,
      storageBytesUsed: used,
      storageIncludedBytes: included,
      storageOverageBytes: overage,
      estimatedStorageOverageUsd:
        bytesToGb(overage) * STORAGE_OVERAGE_USD_PER_GB_MONTH,
      aiMode: getAiMode(ctx.org),
      aiCreditBalance: getAiCreditBalance(ctx.org),
      memberCount: members.length,
    };
  },
});
