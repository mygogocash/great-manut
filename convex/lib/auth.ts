import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";

export type AuthContext = {
  user: Doc<"users">;
  org: Doc<"organizations">;
  membership: Doc<"members">;
};

export async function getCurrentUserOrNull(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return null;
  }
  return (await ctx.db.get(userId)) ?? null;
}

export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const user = await getCurrentUserOrNull(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

/**
 * Resolve user + active organization + membership. The active org is stored
 * on the user document and verified against the members table.
 */
export async function getAuthContext(
  ctx: QueryCtx | MutationCtx
): Promise<AuthContext> {
  const user = await getCurrentUser(ctx);
  if (!user.activeOrgId) {
    throw new Error("No active organization");
  }

  const org = await ctx.db.get(user.activeOrgId);
  if (!org) {
    throw new Error("Organization not found");
  }

  const membership = await ctx.db
    .query("members")
    .withIndex("by_org_and_user", (q) =>
      q.eq("orgId", org._id).eq("userId", user._id)
    )
    .unique();
  if (!membership) {
    throw new Error("Not a member of this organization");
  }

  return { user, org, membership };
}
