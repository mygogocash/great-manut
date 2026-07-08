import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { orgQuery } from "./lib/customFunctions";
import { getAiCreditBalance, getAiMode } from "./lib/usageLimits";
import {
  AI_CREDIT_PACKS,
  type AiCreditPackId,
  creditsForEvent,
} from "./lib/usagePricing";
import { aiModeValidator } from "./schema";

const aiCreditEventValidator = v.union(
  v.literal("chatMessage"),
  v.literal("issueEmbedding"),
  v.literal("semanticSearch"),
  v.literal("triageSuggestion"),
  v.literal("duplicateDetection")
);

export const deductCredits = internalMutation({
  args: {
    orgId: v.id("organizations"),
    amount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      return null;
    }
    if (getAiMode(org) === "byok") {
      return null;
    }
    const balance = getAiCreditBalance(org);
    if (balance < args.amount) {
      throw new Error(
        `AI credit balance is ${balance.toFixed(1)}. Top up credits or switch to BYOK in workspace AI settings.`
      );
    }
    await ctx.db.patch(args.orgId, {
      aiCreditBalance: balance - args.amount,
    });
    return null;
  },
});

/** Atomically verify balance and deduct for a billable AI event. */
export const assertAndDeductCredits = internalMutation({
  args: {
    orgId: v.id("organizations"),
    event: aiCreditEventValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      return null;
    }
    if (getAiMode(org) === "byok") {
      return null;
    }
    const amount = creditsForEvent(args.event);
    const balance = getAiCreditBalance(org);
    if (balance < amount) {
      throw new Error(
        `AI credit balance is ${balance.toFixed(1)}. Top up credits or switch to BYOK in workspace AI settings.`
      );
    }
    await ctx.db.patch(args.orgId, {
      aiCreditBalance: balance - amount,
    });
    return null;
  },
});

export const grantCredits = internalMutation({
  args: {
    orgId: v.id("organizations"),
    credits: v.number(),
    stripeSessionId: v.string(),
    packId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("aiCreditGrants")
      .withIndex("by_session", (q) => q.eq("stripeSessionId", args.stripeSessionId))
      .unique();
    if (existing) {
      return null;
    }

    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new Error("Organization not found");
    }

    await ctx.db.insert("aiCreditGrants", {
      orgId: args.orgId,
      stripeSessionId: args.stripeSessionId,
      credits: args.credits,
      packId: args.packId,
      grantedAt: Date.now(),
    });

    const balance = getAiCreditBalance(org);
    await ctx.db.patch(args.orgId, {
      aiCreditBalance: balance + args.credits,
    });
    return null;
  },
});

export const getBalance = orgQuery({
  args: {},
  returns: v.object({
    aiMode: aiModeValidator,
    balance: v.number(),
  }),
  handler: async (ctx) => {
    return {
      aiMode: getAiMode(ctx.org),
      balance: getAiCreditBalance(ctx.org),
    };
  },
});

export const listPacks = orgQuery({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      credits: v.number(),
      priceUsd: v.number(),
    })
  ),
  handler: async () => {
    return AI_CREDIT_PACKS.map((pack) => ({
      id: pack.id,
      credits: pack.credits,
      priceUsd: pack.priceUsd,
    }));
  },
});

export function packById(packId: string): {
  id: AiCreditPackId;
  credits: number;
  priceUsd: number;
} | null {
  const pack = AI_CREDIT_PACKS.find((p) => p.id === packId);
  return pack ?? null;
}