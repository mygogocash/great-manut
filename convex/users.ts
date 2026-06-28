import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUserOrNull } from "./lib/auth";
import { userDisplayName, userImageUrl } from "./lib/userDisplay";

/** The signed-in user's profile, or null when signed out. */
export const current = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.string(),
      imageUrl: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const user = await getCurrentUserOrNull(ctx);
    if (!user) {
      return null;
    }
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      name: userDisplayName(user),
      email: user.email ?? "",
      imageUrl: userImageUrl(user),
    };
  },
});

/** Whether the client has a valid auth session. */
export const isSignedIn = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId !== null;
  },
});
