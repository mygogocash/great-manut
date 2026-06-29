"use node";

import { embed, embedMany } from "ai";
import type { EmbeddingModel } from "ai";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { creditsForEvent } from "../lib/usagePricing";
import { embeddingModel } from "./models";

const BACKFILL_BATCH_SIZE = 16;

export async function embedTextWithModel(
  model: EmbeddingModel,
  text: string
): Promise<number[]> {
  const { embedding } = await embed({
    model,
    value: text.slice(0, 8000),
  });
  return embedding;
}

/** Legacy helper for triage actions (node runtime). */
export async function embedText(text: string): Promise<number[]> {
  return embedTextWithModel(embeddingModel, text);
}

export const embedIssue = internalAction({
  args: { issueId: v.id("issues") },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const source = await ctx.runQuery(
      internal.agent.data.issueEmbeddingSource,
      { issueId: args.issueId }
    );
    if (!source) {
      return null;
    }

    const resolved = await ctx.runAction(
      internal.agent.resolveProvider.resolveOrgAiProvider,
      { orgId: source.orgId }
    );

    if (resolved.deductCredits) {
      await ctx.runMutation(internal.aiCredits.deductCredits, {
        orgId: source.orgId,
        amount: creditsForEvent("issueEmbedding"),
      });
    }

    const embedding = await embedTextWithModel(
      resolved.embeddingModel,
      source.text
    );
    await ctx.runMutation(internal.agent.data.saveIssueEmbeddings, {
      orgId: source.orgId,
      items: [{ issueId: args.issueId, embedding }],
    });
    return null;
  },
});

export const backfillOrgEmbeddings = internalAction({
  args: { orgId: v.id("organizations") },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const batch = await ctx.runQuery(
      internal.agent.data.issuesMissingEmbeddings,
      { orgId: args.orgId, limit: BACKFILL_BATCH_SIZE }
    );
    if (batch.length === 0) {
      return null;
    }

    const resolved = await ctx.runAction(
      internal.agent.resolveProvider.resolveOrgAiProvider,
      { orgId: args.orgId }
    );

    const { embeddings } = await embedMany({
      model: resolved.embeddingModel,
      values: batch.map((item) => item.text.slice(0, 8000)),
    });

    if (resolved.deductCredits) {
      await ctx.runMutation(internal.aiCredits.deductCredits, {
        orgId: args.orgId,
        amount: creditsForEvent("issueEmbedding") * batch.length,
      });
    }

    if (embeddings.length !== batch.length) {
      throw new Error("embedMany returned a mismatched embedding count");
    }
    await ctx.runMutation(internal.agent.data.saveIssueEmbeddings, {
      orgId: args.orgId,
      items: batch.map((item, index) => ({
        issueId: item.issueId,
        embedding: embeddings[index],
      })),
    });
    if (batch.length === BACKFILL_BATCH_SIZE) {
      await ctx.scheduler.runAfter(
        0,
        internal.agent.embeddingsActions.backfillOrgEmbeddings,
        { orgId: args.orgId }
      );
    }
    return null;
  },
});
