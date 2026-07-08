"use node";

import { embed, embedMany } from "ai";
import type { EmbeddingModel } from "ai";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { internalAction } from "../_generated/server";
import { creditsForEvent } from "../lib/usagePricing";
import {
  embeddingCallOptions,
  getPlatformEmbeddingModel,
} from "./vertexClient";
import { resolveOrgAiProviderForOrg } from "./resolveProvider";

const BACKFILL_BATCH_SIZE = 16;

type EmbeddingBatchItem = {
  issueId: Id<"issues">;
  text: string;
};

type OrgEmbeddingStats = {
  total: number;
  embedded: number;
  missing: number;
};

type EmbeddingBackfillStatusResult =
  | ({ kind: "org"; orgId: Id<"organizations"> } & OrgEmbeddingStats)
  | {
      kind: "all";
      orgs: Array<{ orgId: Id<"organizations"> } & OrgEmbeddingStats>;
    };

export async function embedTextWithModel(
  model: EmbeddingModel,
  text: string
): Promise<number[]> {
  const { embedding } = await embed({
    model,
    value: text.slice(0, 8000),
    ...embeddingCallOptions(model),
  });
  return embedding;
}

/** Legacy helper for triage actions (node runtime). */
export async function embedText(text: string): Promise<number[]> {
  return embedTextWithModel(getPlatformEmbeddingModel(), text);
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

    const resolved = await resolveOrgAiProviderForOrg(ctx, source.orgId);

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
  args: {
    orgId: v.id("organizations"),
    force: v.optional(v.boolean()),
    afterIssueId: v.optional(v.id("issues")),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const force = args.force ?? false;
    let batch: EmbeddingBatchItem[];
    if (force) {
      batch = await ctx.runQuery(
        internal.agent.data.issuesForEmbeddingBackfill,
        {
          orgId: args.orgId,
          limit: BACKFILL_BATCH_SIZE,
          afterIssueId: args.afterIssueId,
          includeEmbedded: true,
        }
      );
    } else {
      batch = await ctx.runQuery(internal.agent.data.issuesMissingEmbeddings, {
        orgId: args.orgId,
        limit: BACKFILL_BATCH_SIZE,
      });
    }
    if (batch.length === 0) {
      return null;
    }

    const resolved = await resolveOrgAiProviderForOrg(ctx, args.orgId);

    const { embeddings } = await embedMany({
      model: resolved.embeddingModel,
      values: batch.map((item) => item.text.slice(0, 8000)),
      ...embeddingCallOptions(resolved.embeddingModel),
    });

    if (embeddings.length !== batch.length) {
      throw new Error("embedMany returned a mismatched embedding count");
    }

    if (resolved.deductCredits) {
      await ctx.runMutation(internal.aiCredits.deductCredits, {
        orgId: args.orgId,
        amount: creditsForEvent("issueEmbedding") * batch.length,
      });
    }

    await ctx.runMutation(internal.agent.data.saveIssueEmbeddings, {
      orgId: args.orgId,
      items: batch.map((item, index) => ({
        issueId: item.issueId,
        embedding: embeddings[index],
      })),
    });

    const lastIssueId = batch[batch.length - 1]?.issueId;
    if (batch.length === BACKFILL_BATCH_SIZE && lastIssueId) {
      await ctx.scheduler.runAfter(
        0,
        internal.agent.embeddingsActions.backfillOrgEmbeddings,
        {
          orgId: args.orgId,
          force,
          afterIssueId: force ? lastIssueId : undefined,
        }
      );
    }
    return null;
  },
});

/** Force re-embed every issue in one org (e.g. after switching to Vertex). */
export const rebackfillOrgEmbeddings = internalAction({
  args: { orgId: v.id("organizations") },
  returns: v.object({ started: v.literal(true) }),
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(
      0,
      internal.agent.embeddingsActions.backfillOrgEmbeddings,
      { orgId: args.orgId, force: true }
    );
    return { started: true as const };
  },
});

/** Ops entry: re-embed all orgs (staggered). */
export const rebackfillAllOrganizations = internalAction({
  args: { staggerMs: v.optional(v.number()) },
  returns: v.object({ scheduled: v.number() }),
  handler: async (ctx, args) => {
    const orgIds: Id<"organizations">[] = await ctx.runQuery(
      internal.agent.data.listOrgIds,
      {}
    );
    const staggerMs = args.staggerMs ?? 1000;
    for (let i = 0; i < orgIds.length; i++) {
      await ctx.scheduler.runAfter(
        i * staggerMs,
        internal.agent.embeddingsActions.backfillOrgEmbeddings,
        { orgId: orgIds[i], force: true }
      );
    }
    return { scheduled: orgIds.length };
  },
});

export const embeddingBackfillStatus = internalAction({
  args: { orgId: v.optional(v.id("organizations")) },
  returns: v.union(
    v.object({
      kind: v.literal("org"),
      orgId: v.id("organizations"),
      total: v.number(),
      embedded: v.number(),
      missing: v.number(),
    }),
    v.object({
      kind: v.literal("all"),
      orgs: v.array(
        v.object({
          orgId: v.id("organizations"),
          total: v.number(),
          embedded: v.number(),
          missing: v.number(),
        })
      ),
    })
  ),
  handler: async (ctx, args): Promise<EmbeddingBackfillStatusResult> => {
    if (args.orgId) {
      const stats: OrgEmbeddingStats = await ctx.runQuery(
        internal.agent.data.orgEmbeddingStats,
        {
          orgId: args.orgId,
        }
      );
      return { kind: "org" as const, orgId: args.orgId, ...stats };
    }
    const orgIds: Id<"organizations">[] = await ctx.runQuery(
      internal.agent.data.listOrgIds,
      {}
    );
    const orgs: Array<{ orgId: Id<"organizations"> } & OrgEmbeddingStats> = [];
    for (const orgId of orgIds) {
      const stats: OrgEmbeddingStats = await ctx.runQuery(
        internal.agent.data.orgEmbeddingStats,
        {
          orgId,
        }
      );
      orgs.push({ orgId, ...stats });
    }
    return { kind: "all" as const, orgs };
  },
});

/** Ops smoke test — verifies Vertex embedding API from the deployment. */
export const smokeTestVertexEmbedding = internalAction({
  args: {},
  returns: v.object({
    modelId: v.string(),
    dimensions: v.number(),
  }),
  handler: async () => {
    const model = getPlatformEmbeddingModel();
    const embedding = await embedTextWithModel(model, "Manut Vertex smoke test");
    return {
      modelId:
        typeof model === "object" &&
        model !== null &&
        "modelId" in model &&
        typeof model.modelId === "string"
          ? model.modelId
          : "gemini-embedding-001",
      dimensions: embedding.length,
    };
  },
});
