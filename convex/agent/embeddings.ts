import { v } from "convex/values";
import { internal } from "../_generated/api";
import { orgMutation } from "../lib/customFunctions";

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
