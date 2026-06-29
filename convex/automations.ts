import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";
import {
  orgAdminMutation,
  orgQuery,
} from "./lib/customFunctions";
import {
  parseAction,
  parseTrigger,
  summarizeAction,
  summarizeTrigger,
} from "./lib/automationSchema";

const ruleShape = {
  _id: v.id("automationRules"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  name: v.string(),
  enabled: v.boolean(),
  trigger: v.string(),
  conditions: v.optional(v.string()),
  actions: v.string(),
  createdBy: v.id("users"),
  createdAt: v.number(),
};

const ruleListShape = {
  ...ruleShape,
  triggerSummary: v.string(),
  actionSummary: v.string(),
};

async function getOrgRule(
  ctx: { db: QueryCtx["db"] },
  orgId: Id<"organizations">,
  ruleId: Id<"automationRules">
): Promise<Doc<"automationRules">> {
  const rule = await ctx.db.get(ruleId);
  if (!rule || rule.orgId !== orgId) {
    throw new Error("Rule not found");
  }
  return rule;
}

function validateRuleJson(trigger: string, actions: string): void {
  parseTrigger(trigger);
  parseAction(actions);
}

export const listRules = orgQuery({
  args: {},
  returns: v.array(v.object(ruleListShape)),
  handler: async (ctx) => {
    const rules = await ctx.db
      .query("automationRules")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .order("desc")
      .collect();

    return rules.map((rule) => ({
      ...rule,
      triggerSummary: safeSummarize(() => summarizeTrigger(rule.trigger)),
      actionSummary: safeSummarize(() => summarizeAction(rule.actions)),
    }));
  },
});

function safeSummarize(fn: () => string): string {
  try {
    return fn();
  } catch {
    return "Invalid rule";
  }
}

export const createRule = orgAdminMutation({
  args: {
    name: v.string(),
    trigger: v.string(),
    conditions: v.optional(v.string()),
    actions: v.string(),
    enabled: v.boolean(),
  },
  returns: v.id("automationRules"),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) {
      throw new Error("Rule name is required");
    }

    validateRuleJson(args.trigger, args.actions);

    return await ctx.db.insert("automationRules", {
      orgId: ctx.org._id,
      name,
      trigger: args.trigger,
      conditions: args.conditions,
      actions: args.actions,
      enabled: args.enabled,
      createdBy: ctx.user._id,
      createdAt: Date.now(),
    });
  },
});

export const setEnabled = orgAdminMutation({
  args: {
    ruleId: v.id("automationRules"),
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const rule = await getOrgRule(ctx, ctx.org._id, args.ruleId);
    await ctx.db.patch(rule._id, { enabled: args.enabled });
    return null;
  },
});

export const removeRule = orgAdminMutation({
  args: { ruleId: v.id("automationRules") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const rule = await getOrgRule(ctx, ctx.org._id, args.ruleId);
    await ctx.db.delete(rule._id);
    return null;
  },
});
