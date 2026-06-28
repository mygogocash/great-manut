import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";
import { logActivity } from "./lib/activity";
import { orgMutation, orgQuery } from "./lib/customFunctions";
import { assertCanCreateIssue } from "./lib/limits";
import { ideaStatusValidator } from "./schema";

export const ideaShape = {
  _id: v.id("ideas"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  title: v.string(),
  description: v.optional(v.string()),
  status: ideaStatusValidator,
  impact: v.number(),
  effort: v.number(),
  ownerId: v.optional(v.id("users")),
  projectId: v.optional(v.id("projects")),
  teamId: v.optional(v.id("teams")),
  promotedIssueId: v.optional(v.id("issues")),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
};

const ideaWithKeyShape = {
  ...ideaShape,
  promotedIssueKey: v.optional(v.string()),
};

function assertScore(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${label} must be an integer from 1 to 5`);
  }
}

async function getOrgIdea(
  ctx: { db: QueryCtx["db"] },
  orgId: Id<"organizations">,
  ideaId: Id<"ideas">
): Promise<Doc<"ideas">> {
  const idea = await ctx.db.get(ideaId);
  if (!idea || idea.orgId !== orgId) {
    throw new Error("Idea not found");
  }
  return idea;
}

async function resolvePromotedIssueKey(
  ctx: { db: QueryCtx["db"] },
  promotedIssueId: Id<"issues"> | undefined
): Promise<string | undefined> {
  if (!promotedIssueId) {
    return undefined;
  }
  const issue = await ctx.db.get(promotedIssueId);
  if (!issue) {
    return undefined;
  }
  const team = await ctx.db.get(issue.teamId);
  if (!team) {
    return undefined;
  }
  return `${team.key}-${issue.number}`;
}

async function enrichIdea(ctx: { db: QueryCtx["db"] }, idea: Doc<"ideas">) {
  return {
    ...idea,
    promotedIssueKey: await resolvePromotedIssueKey(ctx, idea.promotedIssueId),
  };
}

export const list = orgQuery({
  args: {},
  returns: v.array(v.object(ideaWithKeyShape)),
  handler: async (ctx) => {
    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .order("desc")
      .take(500);
    return await Promise.all(ideas.map((idea) => enrichIdea(ctx, idea)));
  },
});

export const get = orgQuery({
  args: { ideaId: v.id("ideas") },
  returns: v.union(v.object(ideaWithKeyShape), v.null()),
  handler: async (ctx, args) => {
    const idea = await ctx.db.get(args.ideaId);
    if (!idea || idea.orgId !== ctx.org._id) {
      return null;
    }
    return await enrichIdea(ctx, idea);
  },
});

export const create = orgMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(ideaStatusValidator),
    impact: v.optional(v.number()),
    effort: v.optional(v.number()),
    ownerId: v.optional(v.id("users")),
    projectId: v.optional(v.id("projects")),
    teamId: v.optional(v.id("teams")),
  },
  returns: v.id("ideas"),
  handler: async (ctx, args) => {
    const impact = args.impact ?? 3;
    const effort = args.effort ?? 3;
    assertScore(impact, "Impact");
    assertScore(effort, "Effort");

    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project || project.orgId !== ctx.org._id) {
        throw new Error("Project not found");
      }
    }
    if (args.teamId) {
      const team = await ctx.db.get(args.teamId);
      if (!team || team.orgId !== ctx.org._id) {
        throw new Error("Team not found");
      }
    }
    if (args.ownerId) {
      const ownerMembership = await ctx.db
        .query("members")
        .withIndex("by_org_and_user", (q) =>
          q.eq("orgId", ctx.org._id).eq("userId", args.ownerId!)
        )
        .unique();
      if (!ownerMembership) {
        throw new Error("Owner must be an org member");
      }
    }

    const now = Date.now();
    return await ctx.db.insert("ideas", {
      orgId: ctx.org._id,
      title: args.title.trim(),
      description: args.description?.trim() || undefined,
      status: args.status ?? "new",
      impact,
      effort,
      ownerId: args.ownerId,
      projectId: args.projectId,
      teamId: args.teamId,
      createdBy: ctx.user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = orgMutation({
  args: {
    ideaId: v.id("ideas"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(ideaStatusValidator),
    impact: v.optional(v.number()),
    effort: v.optional(v.number()),
    ownerId: v.optional(v.union(v.id("users"), v.null())),
    projectId: v.optional(v.union(v.id("projects"), v.null())),
    teamId: v.optional(v.union(v.id("teams"), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const idea = await getOrgIdea(ctx, ctx.org._id, args.ideaId);
    const updates: Partial<Doc<"ideas">> = { updatedAt: Date.now() };

    if (args.title !== undefined) {
      updates.title = args.title.trim();
    }
    if (args.description !== undefined) {
      updates.description = args.description.trim() || undefined;
    }
    if (args.status !== undefined) {
      updates.status = args.status;
    }
    if (args.impact !== undefined) {
      assertScore(args.impact, "Impact");
      updates.impact = args.impact;
    }
    if (args.effort !== undefined) {
      assertScore(args.effort, "Effort");
      updates.effort = args.effort;
    }
    if (args.ownerId !== undefined) {
      if (args.ownerId) {
        const ownerMembership = await ctx.db
          .query("members")
          .withIndex("by_org_and_user", (q) =>
            q.eq("orgId", ctx.org._id).eq("userId", args.ownerId!)
          )
          .unique();
        if (!ownerMembership) {
          throw new Error("Owner must be an org member");
        }
      }
      updates.ownerId = args.ownerId ?? undefined;
    }
    if (args.projectId !== undefined) {
      if (args.projectId) {
        const project = await ctx.db.get(args.projectId);
        if (!project || project.orgId !== ctx.org._id) {
          throw new Error("Project not found");
        }
      }
      updates.projectId = args.projectId ?? undefined;
    }
    if (args.teamId !== undefined) {
      if (args.teamId) {
        const team = await ctx.db.get(args.teamId);
        if (!team || team.orgId !== ctx.org._id) {
          throw new Error("Team not found");
        }
      }
      updates.teamId = args.teamId ?? undefined;
    }

    await ctx.db.patch(idea._id, updates);
    return null;
  },
});

export const remove = orgMutation({
  args: { ideaId: v.id("ideas") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const idea = await getOrgIdea(ctx, ctx.org._id, args.ideaId);
    await ctx.db.delete(idea._id);
    return null;
  },
});

export const promote = orgMutation({
  args: {
    ideaId: v.id("ideas"),
    teamId: v.id("teams"),
    title: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    cycleId: v.optional(v.id("cycles")),
  },
  returns: v.id("issues"),
  handler: async (ctx, args) => {
    const idea = await getOrgIdea(ctx, ctx.org._id, args.ideaId);
    if (idea.promotedIssueId) {
      throw new Error("Idea has already been promoted to an issue");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team || team.orgId !== ctx.org._id) {
      throw new Error("Team not found");
    }

    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project || project.orgId !== ctx.org._id) {
        throw new Error("Project not found");
      }
    }

    if (args.cycleId) {
      const cycle = await ctx.db.get(args.cycleId);
      if (!cycle || cycle.orgId !== ctx.org._id) {
        throw new Error("Cycle not found");
      }
      if (cycle.teamId !== args.teamId) {
        throw new Error("Cycle must belong to the selected team");
      }
    }

    await assertCanCreateIssue(ctx, ctx.org);

    const number = team.nextIssueNumber;
    await ctx.db.patch(team._id, { nextIssueNumber: number + 1 });

    const newest = await ctx.db
      .query("issues")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .order("desc")
      .first();
    const sortOrder = (newest?.sortOrder ?? 0) + 1000;

    const title = (args.title ?? idea.title).trim();
    const issueId = await ctx.db.insert("issues", {
      orgId: ctx.org._id,
      teamId: args.teamId,
      number,
      title,
      description: idea.description,
      status: "todo",
      priority: "none",
      creatorId: ctx.user._id,
      projectId: args.projectId ?? idea.projectId,
      cycleId: args.cycleId,
      sortOrder,
    });

    await ctx.db.patch(idea._id, {
      promotedIssueId: issueId,
      status: "planned",
      updatedAt: Date.now(),
    });

    await logActivity(ctx, {
      orgId: ctx.org._id,
      issueId,
      actorId: ctx.user._id,
      type: "created",
      field: "source",
      newValue: `idea:${idea._id}`,
    });

    return issueId;
  },
});
