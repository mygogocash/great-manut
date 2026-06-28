import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";
import { orgMutation, orgQuery } from "./lib/customFunctions";
import { epicStatusValidator } from "./schema";

const epicShape = {
  _id: v.id("epics"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  projectId: v.id("projects"),
  title: v.string(),
  description: v.optional(v.string()),
  status: epicStatusValidator,
  startDate: v.optional(v.number()),
  targetDate: v.optional(v.number()),
  color: v.optional(v.string()),
};

const epicWithProgressShape = {
  ...epicShape,
  issueCount: v.number(),
  doneCount: v.number(),
};

async function getOrgEpic(
  ctx: { db: QueryCtx["db"] },
  orgId: Id<"organizations">,
  epicId: Id<"epics">
): Promise<Doc<"epics">> {
  const epic = await ctx.db.get(epicId);
  if (!epic || epic.orgId !== orgId) {
    throw new Error("Epic not found");
  }
  return epic;
}

async function getOrgProject(
  ctx: { db: QueryCtx["db"] },
  orgId: Id<"organizations">,
  projectId: Id<"projects">
): Promise<Doc<"projects">> {
  const project = await ctx.db.get(projectId);
  if (!project || project.orgId !== orgId) {
    throw new Error("Project not found");
  }
  return project;
}

async function countEpicProgress(
  ctx: { db: QueryCtx["db"] },
  epicId: Id<"epics">
) {
  const issues = await ctx.db
    .query("issues")
    .withIndex("by_epic", (q) => q.eq("epicId", epicId))
    .collect();
  return {
    issueCount: issues.length,
    doneCount: issues.filter((issue) => issue.status === "done").length,
  };
}

export const listByProject = orgQuery({
  args: { projectId: v.id("projects") },
  returns: v.array(v.object(epicWithProgressShape)),
  handler: async (ctx, args) => {
    await getOrgProject(ctx, ctx.org._id, args.projectId);

    const epics = await ctx.db
      .query("epics")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const result = [];
    for (const epic of epics) {
      const progress = await countEpicProgress(ctx, epic._id);
      result.push({ ...epic, ...progress });
    }
    return result;
  },
});

export const create = orgMutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  returns: v.id("epics"),
  handler: async (ctx, args) => {
    await getOrgProject(ctx, ctx.org._id, args.projectId);

    const title = args.title.trim();
    if (!title) {
      throw new Error("Epic title is required");
    }

    return await ctx.db.insert("epics", {
      orgId: ctx.org._id,
      projectId: args.projectId,
      title,
      description: args.description?.trim() || undefined,
      status: "backlog",
      color: args.color ?? "#5e6ad2",
    });
  },
});

export const updateDates = orgMutation({
  args: {
    epicId: v.id("epics"),
    startDate: v.optional(v.number()),
    targetDate: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const epic = await getOrgEpic(ctx, ctx.org._id, args.epicId);

    const updates: Partial<Doc<"epics">> = {};
    if (args.startDate !== undefined) {
      updates.startDate = args.startDate;
    }
    if (args.targetDate !== undefined) {
      updates.targetDate = args.targetDate;
    }

    await ctx.db.patch(epic._id, updates);
    return null;
  },
});

export const remove = orgMutation({
  args: { epicId: v.id("epics") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const epic = await getOrgEpic(ctx, ctx.org._id, args.epicId);

    const issues = await ctx.db
      .query("issues")
      .withIndex("by_epic", (q) => q.eq("epicId", epic._id))
      .collect();
    for (const issue of issues) {
      await ctx.db.patch(issue._id, { epicId: undefined });
    }

    await ctx.db.delete(epic._id);
    return null;
  },
});
