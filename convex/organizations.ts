import { v } from "convex/values";
import { query } from "./_generated/server";
import {
  authedMutation,
  authedQuery,
  orgAdminMutation,
  orgQuery,
} from "./lib/customFunctions";
import { getCurrentUserOrNull } from "./lib/auth";
import { assertUnderSeatLimit } from "./lib/limits";
import { uniqueOrgSlug } from "./lib/slug";
import { userDisplayName, userImageUrl } from "./lib/userDisplay";
import { memberRoleValidator, planValidator } from "./schema";

const orgShape = {
  _id: v.id("organizations"),
  _creationTime: v.number(),
  name: v.string(),
  slug: v.string(),
  imageUrl: v.optional(v.string()),
  plan: planValidator,
  subscriptionStatus: v.optional(v.string()),
};

const membershipSummary = v.object({
  memberId: v.id("members"),
  orgId: v.id("organizations"),
  role: memberRoleValidator,
  org: v.object(orgShape),
});

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Active organization for the signed-in user, or null if none selected. */
export const current = query({
  args: {},
  returns: v.union(v.object(orgShape), v.null()),
  handler: async (ctx) => {
    const user = await getCurrentUserOrNull(ctx);
    if (!user?.activeOrgId) {
      return null;
    }
    const org = await ctx.db.get(user.activeOrgId);
    if (!org) {
      return null;
    }
    const membership = await ctx.db
      .query("members")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", org._id).eq("userId", user._id)
      )
      .unique();
    if (!membership) {
      return null;
    }
    return org;
  },
});

/** Membership in the active organization. */
export const myMembership = orgQuery({
  args: {},
  returns: v.object({
    memberId: v.id("members"),
    role: memberRoleValidator,
  }),
  handler: async (ctx) => {
    return {
      memberId: ctx.membership._id,
      role: ctx.membership.role,
    };
  },
});

/** Workspaces the signed-in user belongs to. */
export const listMine = authedQuery({
  args: {},
  returns: v.array(membershipSummary),
  handler: async (ctx) => {
    const memberships = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .collect();
    const result = [];
    for (const membership of memberships) {
      const org = await ctx.db.get(membership.orgId);
      if (org) {
        result.push({
          memberId: membership._id,
          orgId: org._id,
          role: membership.role,
          org,
        });
      }
    }
    return result;
  },
});

/** Create a workspace and make the creator an admin. */
export const create = authedMutation({
  args: {
    name: v.string(),
  },
  returns: v.object({ orgId: v.id("organizations"), slug: v.string() }),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) {
      throw new Error("Workspace name is required");
    }
    const slug = await uniqueOrgSlug(ctx, name);
    const orgId = await ctx.db.insert("organizations", {
      name,
      slug,
      plan: "free",
    });
    await ctx.db.insert("members", {
      orgId,
      userId: ctx.user._id,
      role: "admin",
    });
    await ctx.db.patch(ctx.user._id, { activeOrgId: orgId });
    return { orgId, slug };
  },
});

/** Switch the active workspace for the signed-in user. */
export const setActive = authedMutation({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("members")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", ctx.user._id)
      )
      .unique();
    if (!membership) {
      throw new Error("Not a member of this workspace");
    }
    await ctx.db.patch(ctx.user._id, { activeOrgId: args.orgId });
    return null;
  },
});

/** Demo billing: org admins can change the workspace plan in-app. */
export const updatePlan = orgAdminMutation({
  args: {
    plan: planValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(ctx.org._id, {
      plan: args.plan,
      subscriptionStatus: args.plan === "free" ? undefined : "active",
    });
    return null;
  },
});

/** All members of the active org with their user info (assignee pickers, @mentions). */
export const listMembers = orgQuery({
  args: {},
  returns: v.array(
    v.object({
      memberId: v.id("members"),
      userId: v.id("users"),
      role: memberRoleValidator,
      name: v.string(),
      email: v.string(),
      imageUrl: v.optional(v.string()),
      joinedAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .collect();
    const result = [];
    for (const member of members) {
      const user = await ctx.db.get(member.userId);
      if (user) {
        result.push({
          memberId: member._id,
          userId: user._id,
          role: member.role,
          name: userDisplayName(user),
          email: user.email ?? "",
          imageUrl: userImageUrl(user),
          joinedAt: member._creationTime,
        });
      }
    }
    return result;
  },
});

/** Pending invitations for the active org. */
export const listInvitations = orgQuery({
  args: {},
  returns: v.array(
    v.object({
      invitationId: v.id("invitations"),
      email: v.string(),
      role: memberRoleValidator,
      invitedAt: v.number(),
      expiresAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .collect();
    return invitations
      .filter((invitation) => invitation.status === "pending")
      .map((invitation) => ({
        invitationId: invitation._id,
        email: invitation.email,
        role: invitation.role,
        invitedAt: invitation._creationTime,
        expiresAt: invitation.expiresAt,
      }));
  },
});

/** Invitations addressed to the signed-in user's email. */
export const listPendingForMe = authedQuery({
  args: {},
  returns: v.array(
    v.object({
      invitationId: v.id("invitations"),
      token: v.string(),
      orgName: v.string(),
      orgSlug: v.string(),
      role: memberRoleValidator,
    })
  ),
  handler: async (ctx) => {
    const email = ctx.user.email?.toLowerCase();
    if (!email) {
      return [];
    }
    const invitations = await ctx.db.query("invitations").collect();
    const now = Date.now();
    const result = [];
    for (const invitation of invitations) {
      if (
        invitation.status !== "pending" ||
        invitation.email.toLowerCase() !== email ||
        invitation.expiresAt <= now
      ) {
        continue;
      }
      const org = await ctx.db.get(invitation.orgId);
      if (!org) {
        continue;
      }
      result.push({
        invitationId: invitation._id,
        token: invitation.token,
        orgName: org.name,
        orgSlug: org.slug,
        role: invitation.role,
      });
    }
    return result;
  },
});

/** Invite a teammate by email. Adds immediately if they already have an account. */
export const inviteMember = orgAdminMutation({
  args: {
    email: v.string(),
    role: memberRoleValidator,
  },
  returns: v.union(v.literal("added"), v.literal("invited")),
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!email) {
      throw new Error("Email is required");
    }

    await assertUnderSeatLimit(ctx, ctx.org);

    const existingMembers = await ctx.db
      .query("members")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .collect();
    for (const member of existingMembers) {
      const user = await ctx.db.get(member.userId);
      if (user?.email?.toLowerCase() === email) {
        throw new Error("This person is already a member");
      }
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();

    if (existingUser) {
      const alreadyMember = await ctx.db
        .query("members")
        .withIndex("by_org_and_user", (q) =>
          q.eq("orgId", ctx.org._id).eq("userId", existingUser._id)
        )
        .unique();
      if (alreadyMember) {
        throw new Error("This person is already a member");
      }
      await ctx.db.insert("members", {
        orgId: ctx.org._id,
        userId: existingUser._id,
        role: args.role,
      });
      return "added";
    }

    const pending = await ctx.db
      .query("invitations")
      .withIndex("by_org_and_email", (q) =>
        q.eq("orgId", ctx.org._id).eq("email", email)
      )
      .collect();
    for (const invitation of pending) {
      if (invitation.status === "pending") {
        throw new Error("An invitation is already pending for this email");
      }
    }

    await ctx.db.insert("invitations", {
      orgId: ctx.org._id,
      email,
      role: args.role,
      token: randomToken(),
      invitedBy: ctx.user._id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      status: "pending",
    });
    return "invited";
  },
});

export const revokeInvitation = orgAdminMutation({
  args: {
    invitationId: v.id("invitations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation || invitation.orgId !== ctx.org._id) {
      throw new Error("Invitation not found");
    }
    await ctx.db.patch(invitation._id, { status: "revoked" });
    return null;
  },
});

export const acceptInvitation = authedMutation({
  args: {
    token: v.string(),
  },
  returns: v.object({ slug: v.string() }),
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!invitation || invitation.status !== "pending") {
      throw new Error("Invitation not found");
    }
    if (invitation.expiresAt <= Date.now()) {
      throw new Error("Invitation has expired");
    }
    const email = ctx.user.email?.toLowerCase();
    if (!email || invitation.email.toLowerCase() !== email) {
      throw new Error("This invitation was sent to a different email address");
    }

    const existing = await ctx.db
      .query("members")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", invitation.orgId).eq("userId", ctx.user._id)
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("members", {
        orgId: invitation.orgId,
        userId: ctx.user._id,
        role: invitation.role,
      });
    }
    await ctx.db.patch(invitation._id, { status: "accepted" });

    const org = await ctx.db.get(invitation.orgId);
    if (!org) {
      throw new Error("Organization not found");
    }
    await ctx.db.patch(ctx.user._id, { activeOrgId: org._id });
    return { slug: org.slug };
  },
});

export const updateMemberRole = orgAdminMutation({
  args: {
    memberId: v.id("members"),
    role: memberRoleValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member || member.orgId !== ctx.org._id) {
      throw new Error("Member not found");
    }
    if (member.userId === ctx.user._id) {
      throw new Error("You cannot change your own role");
    }
    await ctx.db.patch(member._id, { role: args.role });
    return null;
  },
});

export const removeMember = orgAdminMutation({
  args: {
    memberId: v.id("members"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member || member.orgId !== ctx.org._id) {
      throw new Error("Member not found");
    }
    if (member.userId === ctx.user._id) {
      throw new Error("You cannot remove yourself");
    }
    await ctx.db.delete(member._id);
    const removedUser = await ctx.db.get(member.userId);
    if (removedUser?.activeOrgId === ctx.org._id) {
      await ctx.db.patch(member.userId, { activeOrgId: undefined });
    }
    return null;
  },
});

/** Resolve org by slug and set it active — used when navigating directly to /:slug. */
export const activateBySlug = authedMutation({
  args: {
    slug: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!org) {
      throw new Error("Workspace not found");
    }
    const membership = await ctx.db
      .query("members")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", org._id).eq("userId", ctx.user._id)
      )
      .unique();
    if (!membership) {
      throw new Error("Not a member of this workspace");
    }
    await ctx.db.patch(ctx.user._id, { activeOrgId: org._id });
    return null;
  },
});
