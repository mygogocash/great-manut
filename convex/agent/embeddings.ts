import { v } from "convex/values";
import { internal } from "../_generated/api";
import { orgAdminMutation, orgMutation, orgQuery } from "../lib/customFunctions";

export const ensureOrgEmbeddings = orgMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx): Promise<null> => {
    const missing = await ctx.db
      .query("issues")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      // eslint-disable-next-line @convex-dev/no-filter-in-query
      .filter((q) => q.eq(q.field("embedding"), undefined))
      .take(1);
    if (missing.length > 0) {
      await ctx.scheduler.runAfter(
        0,
        internal.agent.embeddingsActions.backfillOrgEmbeddings,
        { orgId: ctx.org._id }
      );
    }
    return null;
  },
});

export const embeddingStats = orgQuery({
  args: {},
  returns: v.object({
    total: v.number(),
    embedded: v.number(),
    missing: v.number(),
  }),
  handler: async (ctx) => {
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .collect();
    const embedded = issues.filter((issue) => issue.embedding !== undefined).length;
    return {
      total: issues.length,
      embedded,
      missing: issues.length - embedded,
    };
  },
});

/** Org admin: re-embed all issues with the active provider (post-Vertex migration). */
export const requestEmbeddingRebackfill = orgAdminMutation({
  args: {},
  returns: v.object({ started: v.literal(true) }),
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(
      0,
      internal.agent.embeddingsActions.backfillOrgEmbeddings,
      { orgId: ctx.org._id, force: true }
    );
    return { started: true as const };
  },
});
