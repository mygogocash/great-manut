import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { orgAdminMutation, orgQuery } from "./lib/customFunctions";
import {
  aiModeValidator,
  aiProviderValidator,
  embeddingProviderValidator,
} from "./schema";
import { encryptSecret } from "./lib/crypto";
import { validateProviderKey } from "./lib/aiProviderValidate";

const credentialSummaryValidator = v.object({
  provider: aiProviderValidator,
  maskedKey: v.string(),
  chatModelId: v.optional(v.string()),
  embeddingProvider: v.optional(embeddingProviderValidator),
  embeddingModelId: v.optional(v.string()),
  lastValidatedAt: v.optional(v.number()),
});

export const orgAiState = internalQuery({
  args: { orgId: v.id("organizations") },
  returns: v.object({
    org: v.object({
      aiMode: v.optional(aiModeValidator),
    }),
    credential: v.union(
      v.null(),
      v.object({
        provider: aiProviderValidator,
        encryptedApiKey: v.string(),
        chatModelId: v.optional(v.string()),
        embeddingProvider: v.optional(embeddingProviderValidator),
        embeddingModelId: v.optional(v.string()),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new Error("Organization not found");
    }
    const credential = await ctx.db
      .query("orgAiCredentials")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .unique();
    return {
      org: { aiMode: org.aiMode },
      credential: credential
        ? {
            provider: credential.provider,
            encryptedApiKey: credential.encryptedApiKey,
            chatModelId: credential.chatModelId,
            embeddingProvider: credential.embeddingProvider,
            embeddingModelId: credential.embeddingModelId,
          }
        : null,
    };
  },
});

export const getSettings = orgQuery({
  args: {},
  returns: v.object({
    aiMode: aiModeValidator,
    aiCreditBalance: v.number(),
    credential: v.union(v.null(), credentialSummaryValidator),
  }),
  handler: async (ctx) => {
    const credential = await ctx.db
      .query("orgAiCredentials")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .unique();

    let maskedKey = "";
    if (credential) {
      // Never decrypt for display — mask from stored prefix metadata only.
      maskedKey = `${credential.provider} key saved`;
    }

    return {
      aiMode: ctx.org.aiMode ?? "managed",
      aiCreditBalance: ctx.org.aiCreditBalance ?? 0,
      credential: credential
        ? {
            provider: credential.provider,
            maskedKey,
            chatModelId: credential.chatModelId,
            embeddingProvider: credential.embeddingProvider,
            embeddingModelId: credential.embeddingModelId,
            lastValidatedAt: credential.lastValidatedAt,
          }
        : null,
    };
  },
});

export const setAiMode = orgAdminMutation({
  args: { aiMode: aiModeValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.aiMode === "byok") {
      const credential = await ctx.db
        .query("orgAiCredentials")
        .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
        .unique();
      if (!credential) {
        throw new Error("Add a provider API key before switching to BYOK.");
      }
    }
    await ctx.db.patch(ctx.org._id, { aiMode: args.aiMode });
    return null;
  },
});

export const saveCredential = orgAdminMutation({
  args: {
    provider: aiProviderValidator,
    apiKey: v.string(),
    chatModelId: v.optional(v.string()),
    embeddingProvider: v.optional(embeddingProviderValidator),
    embeddingModelId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const apiKey = args.apiKey.trim();
    if (!apiKey) {
      throw new Error("API key is required");
    }

    await validateProviderKey(args.provider, apiKey);

    const encryptedApiKey = await encryptSecret(apiKey);
    const existing = await ctx.db
      .query("orgAiCredentials")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .unique();

    const payload = {
      orgId: ctx.org._id,
      provider: args.provider,
      encryptedApiKey,
      chatModelId: args.chatModelId?.trim() || undefined,
      embeddingProvider: args.embeddingProvider,
      embeddingModelId: args.embeddingModelId?.trim() || undefined,
      lastValidatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert("orgAiCredentials", payload);
    }
    return null;
  },
});

export const removeCredential = orgAdminMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("orgAiCredentials")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    if (ctx.org.aiMode === "byok") {
      await ctx.db.patch(ctx.org._id, { aiMode: "managed" });
    }
    return null;
  },
});
