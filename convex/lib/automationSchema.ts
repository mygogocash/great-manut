import { issueStatusValidator } from "../schema";

/** Parsed trigger — validated from JSON stored on automationRules.trigger */
export type AutomationTrigger = {
  type: "issue.created" | "issue.status_changed" | "request.created";
  status?: string;
};

/** Parsed action — validated from JSON stored on automationRules.actions */
export type AutomationAction = {
  type:
    | "issue.set_status"
    | "issue.set_assignee"
    | "issue.add_label"
    | "issue.comment";
  status?: string;
  assigneeId?: string | null;
  labelId?: string;
  labelName?: string;
  body?: string;
};

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Invalid JSON in automation rule");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertTrigger(value: unknown): AutomationTrigger {
  if (!isRecord(value) || typeof value.type !== "string") {
    throw new Error("Invalid automation trigger");
  }
  switch (value.type) {
    case "issue.created":
      return { type: "issue.created" };
    case "issue.status_changed": {
      if (typeof value.status !== "string") {
        throw new Error("Invalid automation trigger");
      }
      return { type: "issue.status_changed", status: value.status };
    }
    case "request.created":
      return { type: "request.created" };
    default:
      throw new Error("Invalid automation trigger");
  }
}

function assertAction(value: unknown): AutomationAction {
  if (!isRecord(value) || typeof value.type !== "string") {
    throw new Error("Invalid automation action");
  }
  switch (value.type) {
    case "issue.set_status": {
      if (typeof value.status !== "string") {
        throw new Error("Invalid automation action");
      }
      return { type: "issue.set_status", status: value.status };
    }
    case "issue.set_assignee":
      return {
        type: "issue.set_assignee",
        assigneeId:
          value.assigneeId === null || typeof value.assigneeId === "string"
            ? (value.assigneeId as string | null)
            : undefined,
      };
    case "issue.add_label": {
      if (typeof value.labelId === "string") {
        return { type: "issue.add_label", labelId: value.labelId };
      }
      if (typeof value.labelName === "string") {
        return { type: "issue.add_label", labelName: value.labelName };
      }
      throw new Error("Invalid automation action");
    }
    case "issue.comment": {
      if (typeof value.body !== "string") {
        throw new Error("Invalid automation action");
      }
      return { type: "issue.comment", body: value.body };
    }
    default:
      throw new Error("Invalid automation action");
  }
}

export function parseTrigger(raw: string): AutomationTrigger {
  return assertTrigger(parseJson(raw));
}

export function parseAction(raw: string): AutomationAction {
  return assertAction(parseJson(raw));
}

export function summarizeTrigger(raw: string): string {
  const trigger = parseTrigger(raw);
  switch (trigger.type) {
    case "issue.created":
      return "Issue created";
    case "issue.status_changed":
      return `Status → ${trigger.status?.replace("_", " ")}`;
    case "request.created":
      return "Request created";
    default:
      throw new Error("Unknown automation trigger");
  }
}

export function summarizeAction(raw: string): string {
  const action = parseAction(raw);
  switch (action.type) {
    case "issue.set_status":
      return `Set status to ${action.status?.replace("_", " ")}`;
    case "issue.set_assignee":
      return "Set assignee";
    case "issue.add_label":
      return action.labelName ? `Add label "${action.labelName}"` : "Add label";
    case "issue.comment":
      return `Comment: "${action.body?.slice(0, 40) ?? ""}"`;
    default:
      throw new Error("Unknown automation action");
  }
}

/** Re-export for rule builder validation in automations.ts */
export { issueStatusValidator };
