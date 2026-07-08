import { formatStorageGb, storageIncludedBytes } from "@/lib/usage-pricing";

export type UpgradePromptKind =
  | "issues"
  | "projects"
  | "seats"
  | "docs_write"
  | "discovery"
  | "service_desk"
  | "automations"
  | "storage"
  | "ai_credits";

export const PLAN_LIMIT_COPY: Record<
  "issues" | "projects" | "seats" | "storage" | "ai_credits",
  { title: string; description: string }
> = {
  storage: {
    title: "Storage limit reached",
    description: `Free workspaces include ${formatStorageGb(storageIncludedBytes("free"))} of attachments. Upgrade to Business for ${formatStorageGb(storageIncludedBytes("business"))} and metered overage.`,
  },
  ai_credits: {
    title: "AI credits needed",
    description:
      "Top up prepaid AI credits or connect your provider credentials (Google Vertex, OpenAI, Claude, OpenRouter) in AI settings.",
  },
  issues: {
    title: "Unlimited issues",
    description: "All plans include unlimited issues.",
  },
  projects: {
    title: "Unlimited projects",
    description: "All plans include unlimited projects.",
  },
  seats: {
    title: "Unlimited members",
    description: "All plans include unlimited workspace members.",
  },
};

export const FEATURE_GATE_COPY: Record<
  "docs_write" | "discovery" | "service_desk" | "automations",
  { title: string; description: string }
> = {
  docs_write: {
    title: "Docs included",
    description: "Create doc spaces on every plan.",
  },
  discovery: {
    title: "Discovery included",
    description: "Product Discovery is included on Free and Business.",
  },
  service_desk: {
    title: "Service desk included",
    description: "Customer portal and agent queues are on every plan.",
  },
  automations: {
    title: "Automations included",
    description: "Issue and request automations are on every plan.",
  },
};

export function matchUpgradePromptMessage(message: string): UpgradePromptKind | null {
  const lower = message.toLowerCase();
  if (lower.includes("storage") || lower.includes("gb")) {
    return "storage";
  }
  if (lower.includes("credit") || lower.includes("byok")) {
    return "ai_credits";
  }
  if (lower.includes("issue")) {
    return "issues";
  }
  if (lower.includes("project")) {
    return "projects";
  }
  if (lower.includes("member") || lower.includes("seat")) {
    return "seats";
  }
  if (lower.includes("doc")) {
    return "docs_write";
  }
  if (lower.includes("discovery") || lower.includes("idea")) {
    return "discovery";
  }
  if (lower.includes("service desk") || lower.includes("portal")) {
    return "service_desk";
  }
  if (lower.includes("automation")) {
    return "automations";
  }
  return null;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}
