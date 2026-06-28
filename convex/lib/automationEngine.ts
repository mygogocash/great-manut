import { Id } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";
import { logActivity } from "./activity";
import { parseAction, parseTrigger, type AutomationTrigger } from "./automationSchema";
import { hasAutomations } from "./limits";

const MAX_RULES_PER_EVENT = 5;

export type AutomationEvent =
  | {
      type: "issue.created";
      orgId: Id<"organizations">;
      issueId: Id<"issues">;
      actorId: Id<"users">;
    }
  | {
      type: "issue.status_changed";
      orgId: Id<"organizations">;
      issueId: Id<"issues">;
      actorId: Id<"users">;
      newStatus: string;
    }
  | {
      type: "request.created";
      orgId: Id<"organizations">;
      requestId: Id<"serviceRequests">;
    };

function triggerMatches(
  trigger: AutomationTrigger,
  event: AutomationEvent
): boolean {
  if (trigger.type !== event.type) {
    return false;
  }
  if (
    event.type === "issue.status_changed" &&
    trigger.type === "issue.status_changed"
  ) {
    return trigger.status === event.newStatus;
  }
  return true;
}

async function resolveLabelId(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
  action: ReturnType<typeof parseAction>
): Promise<Id<"labels"> | null> {
  if (action.type !== "issue.add_label") {
    return null;
  }
  if (action.labelId) {
    return action.labelId as Id<"labels">;
  }
  if (!action.labelName) {
    return null;
  }
  const labels = await ctx.db
    .query("labels")
    .withIndex("by_org", (q) => q.eq("orgId", orgId))
    .collect();
  const existing = labels.find(
    (label) => label.name.toLowerCase() === action.labelName!.toLowerCase()
  );
  if (existing) {
    return existing._id;
  }
  return await ctx.db.insert("labels", {
    orgId,
    name: action.labelName,
    color: "#5e6ad2",
  });
}

export async function runAutomations(
  ctx: MutationCtx,
  event: AutomationEvent
): Promise<void> {
  const org = await ctx.db.get(event.orgId);
  if (!org || !hasAutomations(org)) {
    return;
  }

  const rules = await ctx.db
    .query("automationRules")
    .withIndex("by_org", (q) => q.eq("orgId", event.orgId))
    .collect();

  let fired = 0;
  for (const rule of rules) {
    if (!rule.enabled || fired >= MAX_RULES_PER_EVENT) {
      continue;
    }

    let trigger: AutomationTrigger;
    try {
      trigger = parseTrigger(rule.trigger);
    } catch {
      continue;
    }

    if (!triggerMatches(trigger, event)) {
      continue;
    }

    let action;
    try {
      action = parseAction(rule.actions);
    } catch {
      continue;
    }

    if (event.type === "request.created") {
      continue;
    }

    const issue = await ctx.db.get(event.issueId);
    if (!issue || issue.orgId !== event.orgId) {
      continue;
    }

    switch (action.type) {
      case "issue.set_status": {
        if (!action.status || issue.status === action.status) {
          break;
        }
        await ctx.db.patch(issue._id, {
          status: action.status as typeof issue.status,
        });
        await logActivity(ctx, {
          orgId: event.orgId,
          issueId: issue._id,
          actorId: event.actorId,
          type: "status_changed",
          field: "status",
          oldValue: issue.status,
          newValue: action.status,
        });
        break;
      }
      case "issue.set_assignee": {
        if (!action.assigneeId) {
          break;
        }
        const assigneeId = action.assigneeId as Id<"users">;
        if (issue.assigneeId === assigneeId) {
          break;
        }
        await ctx.db.patch(issue._id, { assigneeId });
        await logActivity(ctx, {
          orgId: event.orgId,
          issueId: issue._id,
          actorId: event.actorId,
          type: "assignee_changed",
          field: "assignee",
          oldValue: issue.assigneeId,
          newValue: assigneeId,
        });
        break;
      }
      case "issue.add_label": {
        const labelId = await resolveLabelId(ctx, event.orgId, action);
        if (!labelId) {
          break;
        }
        const label = await ctx.db.get(labelId);
        if (!label || label.orgId !== event.orgId) {
          break;
        }
        const existing = await ctx.db
          .query("issueLabels")
          .withIndex("by_issue", (q) => q.eq("issueId", issue._id))
          .collect();
        if (existing.some((link) => link.labelId === labelId)) {
          break;
        }
        await ctx.db.insert("issueLabels", { issueId: issue._id, labelId });
        break;
      }
      case "issue.comment": {
        const body = action.body?.trim();
        if (!body) {
          break;
        }
        await ctx.db.insert("comments", {
          orgId: event.orgId,
          issueId: issue._id,
          authorId: event.actorId,
          body,
          mentions: [],
          isAutomation: true,
        });
        await logActivity(ctx, {
          orgId: event.orgId,
          issueId: issue._id,
          actorId: event.actorId,
          type: "commented",
        });
        break;
      }
      default:
        break;
    }

    fired += 1;
  }
}
