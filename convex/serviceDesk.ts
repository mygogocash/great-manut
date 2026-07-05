import { HOUR, RateLimiter } from "@convex-dev/rate-limiter";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { runAutomations } from "./lib/automationEngine";
import { orgMutation, orgQuery } from "./lib/customFunctions";
import { hasServiceDesk } from "./lib/limits";
import { userDisplayName, userImageUrl } from "./lib/userDisplay";
import { serviceRequestStatusValidator } from "./schema";

const OPEN_STATUSES = new Set(["new", "waiting", "in_progress"]);

const DEFAULT_REQUEST_TYPES = [
  {
    name: "General support",
    description: "Questions, account help, or anything else.",
    fields: "[]",
    slaHours: 48,
  },
  {
    name: "Report a bug",
    description: "Something is broken or not working as expected.",
    fields: "[]",
    slaHours: 24,
  },
] as const;

export const portalRateLimiter = new RateLimiter(components.rateLimiter, {
  portalSubmit: {
    kind: "fixed window",
    rate: 10,
    period: HOUR,
  },
});

const queueRequestShape = {
  _id: v.id("serviceRequests"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  requestTypeId: v.id("requestTypes"),
  number: v.number(),
  displayNumber: v.string(),
  title: v.string(),
  description: v.string(),
  status: serviceRequestStatusValidator,
  requesterEmail: v.string(),
  requesterName: v.optional(v.string()),
  assigneeId: v.optional(v.id("users")),
  linkedIssueId: v.optional(v.id("issues")),
  createdAt: v.number(),
  dueAt: v.optional(v.number()),
  resolvedAt: v.optional(v.number()),
  requestTypeName: v.string(),
  assigneeName: v.optional(v.string()),
  assigneeImageUrl: v.optional(v.string()),
};

const requestDetailShape = {
  ...queueRequestShape,
  linkedIssueKey: v.optional(v.string()),
};

function formatRequestNumber(number: number): string {
  return `REQ-${number}`;
}

async function nextRequestNumber(
  ctx: QueryCtx,
  orgId: Id<"organizations">
): Promise<number> {
  const latest = await ctx.db
    .query("serviceRequests")
    .withIndex("by_org", (q) => q.eq("orgId", orgId))
    .order("desc")
    .first();
  return (latest?.number ?? 0) + 1;
}

async function logRequestEvent(
  ctx: MutationCtx,
  args: {
    orgId: Id<"organizations">;
    requestId: Id<"serviceRequests">;
    type: string;
    actorId?: Id<"users">;
    oldValue?: string;
    newValue?: string;
  }
) {
  await ctx.db.insert("serviceRequestEvents", {
    orgId: args.orgId,
    requestId: args.requestId,
    type: args.type,
    actorId: args.actorId,
    oldValue: args.oldValue,
    newValue: args.newValue,
    createdAt: Date.now(),
  });
}

async function enrichRequest(
  ctx: { db: QueryCtx["db"] },
  request: Doc<"serviceRequests">
) {
  const requestType = await ctx.db.get(request.requestTypeId);
  let assigneeName: string | undefined;
  let assigneeImageUrl: string | undefined;
  if (request.assigneeId) {
    const user = await ctx.db.get(request.assigneeId);
    if (user) {
      assigneeName = userDisplayName(user);
      assigneeImageUrl = userImageUrl(user);
    }
  }

  let linkedIssueKey: string | undefined;
  if (request.linkedIssueId) {
    const issue = await ctx.db.get(request.linkedIssueId);
    if (issue) {
      const team = await ctx.db.get(issue.teamId);
      if (team) {
        linkedIssueKey = `${team.key}-${issue.number}`;
      }
    }
  }

  return {
    ...request,
    displayNumber: formatRequestNumber(request.number),
    requestTypeName: requestType?.name ?? "Unknown",
    assigneeName,
    assigneeImageUrl,
    linkedIssueKey,
  };
}

async function getOrgBySlug(ctx: QueryCtx, orgSlug: string) {
  return await ctx.db
    .query("organizations")
    .withIndex("by_slug", (q) => q.eq("slug", orgSlug))
    .unique();
}

async function getOrgRequest(
  ctx: { db: QueryCtx["db"] },
  orgId: Id<"organizations">,
  requestId: Id<"serviceRequests">
): Promise<Doc<"serviceRequests">> {
  const request = await ctx.db.get(requestId);
  if (!request || request.orgId !== orgId) {
    throw new Error("Request not found");
  }
  return request;
}

export const ensureDefaults = orgMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("requestTypes")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .first();
    if (existing) {
      return null;
    }

    for (const type of DEFAULT_REQUEST_TYPES) {
      await ctx.db.insert("requestTypes", {
        orgId: ctx.org._id,
        ...type,
      });
    }
    return null;
  },
});

export const listQueue = orgQuery({
  args: {
    queue: v.union(
      v.literal("unassigned"),
      v.literal("mine"),
      v.literal("all_open")
    ),
  },
  returns: v.array(v.object(queueRequestShape)),
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("serviceRequests")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .order("desc")
      .take(500);

    const filtered = all.filter((request) => {
      const isOpen = OPEN_STATUSES.has(request.status);
      switch (args.queue) {
        case "unassigned":
          return isOpen && !request.assigneeId;
        case "mine":
          return isOpen && request.assigneeId === ctx.user._id;
        case "all_open":
          return isOpen;
        default: {
          const _exhaustive: never = args.queue;
          return _exhaustive;
        }
      }
    });

    const result = [];
    for (const request of filtered) {
      const enriched = await enrichRequest(ctx, request);
      result.push({
        ...enriched,
        linkedIssueKey: undefined,
      });
    }
    return result;
  },
});

export const get = orgQuery({
  args: { requestId: v.id("serviceRequests") },
  returns: v.union(v.object(requestDetailShape), v.null()),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request || request.orgId !== ctx.org._id) {
      return null;
    }
    return await enrichRequest(ctx, request);
  },
});

export const assign = orgMutation({
  args: {
    requestId: v.id("serviceRequests"),
    assigneeId: v.union(v.id("users"), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const request = await getOrgRequest(ctx, ctx.org._id, args.requestId);
    const previous = request.assigneeId;

    if (args.assigneeId) {
      const membership = await ctx.db
        .query("members")
        .withIndex("by_org_and_user", (q) =>
          q.eq("orgId", ctx.org._id).eq("userId", args.assigneeId!)
        )
        .unique();
      if (!membership) {
        throw new Error("Assignee must be an org member");
      }
    }

    await ctx.db.patch(request._id, {
      assigneeId: args.assigneeId ?? undefined,
    });

    await logRequestEvent(ctx, {
      orgId: ctx.org._id,
      requestId: request._id,
      type: "assigned",
      actorId: ctx.user._id,
      oldValue: previous,
      newValue: args.assigneeId ?? undefined,
    });
    return null;
  },
});

export const updateStatus = orgMutation({
  args: {
    requestId: v.id("serviceRequests"),
    status: serviceRequestStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const request = await getOrgRequest(ctx, ctx.org._id, args.requestId);
    if (request.status === args.status) {
      return null;
    }

    const updates: Partial<Doc<"serviceRequests">> = { status: args.status };
    if (args.status === "resolved" || args.status === "closed") {
      updates.resolvedAt = Date.now();
    }

    await ctx.db.patch(request._id, updates);

    await logRequestEvent(ctx, {
      orgId: ctx.org._id,
      requestId: request._id,
      type: "status_changed",
      actorId: ctx.user._id,
      oldValue: request.status,
      newValue: args.status,
    });
    return null;
  },
});

export const convertToIssue = orgMutation({
  args: {
    requestId: v.id("serviceRequests"),
    teamId: v.id("teams"),
  },
  returns: v.object({
    issueId: v.id("issues"),
    issueKey: v.string(),
  }),
  handler: async (ctx, args) => {
    const request = await getOrgRequest(ctx, ctx.org._id, args.requestId);
    if (request.linkedIssueId) {
      throw new Error("Request is already linked to an issue");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team || team.orgId !== ctx.org._id) {
      throw new Error("Team not found");
    }

    const portalUrl = `/portal/${ctx.org.slug}`;
    const number = team.nextIssueNumber;
    await ctx.db.patch(team._id, { nextIssueNumber: number + 1 });

    const newest = await ctx.db
      .query("issues")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .order("desc")
      .first();
    const sortOrder = (newest?.sortOrder ?? 0) + 1000;

    const description = [
      request.description,
      "",
      "---",
      `Converted from ${formatRequestNumber(request.number)}`,
      `Portal: ${portalUrl}`,
      `Requester: ${request.requesterName ?? request.requesterEmail}`,
    ].join("\n");

    const issueId = await ctx.db.insert("issues", {
      orgId: ctx.org._id,
      teamId: args.teamId,
      number,
      title: request.title,
      description,
      status: "todo",
      priority: "none",
      creatorId: ctx.user._id,
      sortOrder,
    });

    await ctx.db.patch(request._id, {
      linkedIssueId: issueId,
      status: "in_progress",
    });

    await logRequestEvent(ctx, {
      orgId: ctx.org._id,
      requestId: request._id,
      type: "converted",
      actorId: ctx.user._id,
      newValue: `${team.key}-${number}`,
    });

    return { issueId, issueKey: `${team.key}-${number}` };
  },
});

export const portalGetOrg = query({
  args: { orgSlug: v.string() },
  returns: v.union(v.object({ name: v.string() }), v.null()),
  handler: async (ctx, args) => {
    const org = await getOrgBySlug(ctx, args.orgSlug);
    if (!org || !hasServiceDesk(org)) {
      return null;
    }
    return { name: org.name };
  },
});

export const portalListRequestTypes = query({
  args: { orgSlug: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("requestTypes"),
      name: v.string(),
      description: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const org = await getOrgBySlug(ctx, args.orgSlug);
    if (!org || !hasServiceDesk(org)) {
      return [];
    }

    const types = await ctx.db
      .query("requestTypes")
      .withIndex("by_org", (q) => q.eq("orgId", org._id))
      .collect();

    return types.map((type) => ({
      _id: type._id,
      name: type.name,
      description: type.description,
    }));
  },
});

export const portalSubmit = mutation({
  args: {
    orgSlug: v.string(),
    requestTypeId: v.id("requestTypes"),
    title: v.string(),
    description: v.string(),
    requesterEmail: v.string(),
    requesterName: v.optional(v.string()),
    rateLimitKey: v.string(),
  },
  returns: v.object({ number: v.number(), displayNumber: v.string() }),
  handler: async (ctx, args) => {
    const org = await getOrgBySlug(ctx, args.orgSlug);
    if (!org || !hasServiceDesk(org)) {
      throw new Error("Portal not available");
    }

    const status = await portalRateLimiter.limit(ctx, "portalSubmit", {
      key: `${org._id}:${args.rateLimitKey}`,
    });
    if (!status.ok) {
      throw new Error(
        "Too many submissions. Please wait before submitting again."
      );
    }

    const requestType = await ctx.db.get(args.requestTypeId);
    if (!requestType || requestType.orgId !== org._id) {
      throw new Error("Invalid request type");
    }

    const title = args.title.trim();
    const email = args.requesterEmail.trim().toLowerCase();
    if (!title || !email) {
      throw new Error("Title and email are required");
    }

    const number = await nextRequestNumber(ctx, org._id);
    const createdAt = Date.now();
    const dueAt = requestType.slaHours
      ? createdAt + requestType.slaHours * 3_600_000
      : undefined;

    const requestId = await ctx.db.insert("serviceRequests", {
      orgId: org._id,
      requestTypeId: args.requestTypeId,
      number,
      title,
      description: args.description.trim(),
      status: "new",
      requesterEmail: email,
      requesterName: args.requesterName?.trim() || undefined,
      createdAt,
      dueAt,
    });

    await logRequestEvent(ctx, {
      orgId: org._id,
      requestId,
      type: "created",
    });

    await runAutomations(ctx, {
      type: "request.created",
      orgId: org._id,
      requestId,
    });

    return { number, displayNumber: formatRequestNumber(number) };
  },
});

export const portalTrack = query({
  args: {
    orgSlug: v.string(),
    requesterEmail: v.string(),
    number: v.number(),
  },
  returns: v.union(
    v.object({
      displayNumber: v.string(),
      title: v.string(),
      status: serviceRequestStatusValidator,
      createdAt: v.number(),
      dueAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const org = await getOrgBySlug(ctx, args.orgSlug);
    if (!org || !hasServiceDesk(org)) {
      return null;
    }

    const email = args.requesterEmail.trim().toLowerCase();
    const request = await ctx.db
      .query("serviceRequests")
      .withIndex("by_org_and_number", (q) =>
        q.eq("orgId", org._id).eq("number", args.number)
      )
      .unique();

    if (!request || request.requesterEmail !== email) {
      return null;
    }

    return {
      displayNumber: formatRequestNumber(request.number),
      title: request.title,
      status: request.status,
      createdAt: request.createdAt,
      dueAt: request.dueAt,
    };
  },
});
