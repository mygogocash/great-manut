import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";
import { getOrgPage } from "./docs";
import { orgMutation, orgQuery } from "./lib/customFunctions";
import { userDisplayName, userImageUrl } from "./lib/userDisplay";

const enrichedCommentValidator = v.object({
  _id: v.id("docComments"),
  _creationTime: v.number(),
  pageId: v.id("docPages"),
  authorId: v.id("users"),
  body: v.string(),
  mentions: v.array(v.id("users")),
  createdAt: v.number(),
  authorName: v.string(),
  authorImageUrl: v.optional(v.string()),
  mentionedUsers: v.array(
    v.object({ userId: v.id("users"), name: v.string() })
  ),
});

async function getOrgDocComment(
  ctx: { db: QueryCtx["db"] },
  orgId: Id<"organizations">,
  commentId: Id<"docComments">
): Promise<Doc<"docComments">> {
  const comment = await ctx.db.get(commentId);
  if (!comment || comment.orgId !== orgId) {
    throw new Error("Comment not found");
  }
  return comment;
}

async function filterToOrgMembers(
  ctx: { db: QueryCtx["db"] },
  orgId: Id<"organizations">,
  userIds: Id<"users">[]
): Promise<Id<"users">[]> {
  const unique = [...new Set(userIds)];
  const valid: Id<"users">[] = [];
  for (const userId of unique) {
    const membership = await ctx.db
      .query("members")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", orgId).eq("userId", userId)
      )
      .unique();
    if (membership) {
      valid.push(userId);
    }
  }
  return valid;
}

export const listByPage = orgQuery({
  args: { pageId: v.id("docPages") },
  returns: v.array(enrichedCommentValidator),
  handler: async (ctx, args) => {
    await getOrgPage(ctx, ctx.org._id, args.pageId);

    const comments = await ctx.db
      .query("docComments")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .collect();

    const sorted = comments
      .filter((c) => c.orgId === ctx.org._id)
      .sort((a, b) => a.createdAt - b.createdAt);

    const userCache = new Map<Id<"users">, Doc<"users"> | null>();
    const getUser = async (userId: Id<"users">) => {
      if (!userCache.has(userId)) {
        userCache.set(userId, await ctx.db.get(userId));
      }
      return userCache.get(userId) ?? null;
    };

    const result = [];
    for (const comment of sorted) {
      const author = await getUser(comment.authorId);
      const mentions = comment.mentions ?? [];
      const mentionedUsers = [];
      for (const userId of mentions) {
        const user = await getUser(userId);
        if (user) {
          mentionedUsers.push({
            userId: user._id,
            name: userDisplayName(user),
          });
        }
      }
      result.push({
        _id: comment._id,
        _creationTime: comment._creationTime,
        pageId: comment.pageId,
        authorId: comment.authorId,
        body: comment.body,
        mentions,
        createdAt: comment.createdAt,
        authorName: userDisplayName(author),
        authorImageUrl: userImageUrl(author),
        mentionedUsers,
      });
    }
    return result;
  },
});

export const create = orgMutation({
  args: {
    pageId: v.id("docPages"),
    body: v.string(),
    mentions: v.optional(v.array(v.id("users"))),
  },
  returns: v.id("docComments"),
  handler: async (ctx, args) => {
    await getOrgPage(ctx, ctx.org._id, args.pageId);

    const body = args.body.trim();
    if (!body) {
      throw new Error("Comment cannot be empty");
    }

    const mentions = await filterToOrgMembers(
      ctx,
      ctx.org._id,
      args.mentions ?? []
    );

    return await ctx.db.insert("docComments", {
      orgId: ctx.org._id,
      pageId: args.pageId,
      authorId: ctx.user._id,
      body,
      mentions,
      createdAt: Date.now(),
    });
  },
});

export const remove = orgMutation({
  args: { commentId: v.id("docComments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const comment = await getOrgDocComment(ctx, ctx.org._id, args.commentId);
    const isAuthor = comment.authorId === ctx.user._id;
    const isAdmin = ctx.membership.role === "admin";
    if (!isAuthor && !isAdmin) {
      throw new Error("Only the author or an admin can delete a comment");
    }
    await ctx.db.delete(comment._id);
    return null;
  },
});
