import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/**
 * One-time migration: map legacy pro/enterprise orgs to business.
 * Run from Convex dashboard after deploy.
 */
export const migrateLegacyPlans = internalMutation({
  args: {},
  returns: v.object({ migrated: v.number() }),
  handler: async (ctx) => {
    const orgs = await ctx.db.query("organizations").collect();
    let migrated = 0;
    for (const org of orgs) {
      const plan = org.plan as string;
      if (plan === "pro" || plan === "enterprise") {
        await ctx.db.patch(org._id, { plan: "business" });
        migrated += 1;
      }
    }
    return { migrated };
  },
});
