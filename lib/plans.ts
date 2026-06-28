/**
 * Plan definitions and display helpers for Manut billing UI.
 *
 * `convex/lib/limits.ts` is the authoritative enforcement of free-tier caps;
 * the numbers here mirror it for display purposes.
 */

/** Convex `organizations.plan` values. */
export type OrgPlan = "free" | "pro" | "enterprise";

export type BillingPeriod = "month" | "annual";

/** Display mirror of `FREE_PLAN_LIMITS` in convex/lib/limits.ts. */
export const FREE_PLAN_DISPLAY_LIMITS = {
  seats: 3,
  projects: 2,
  issues: 100,
} as const;

export type PlanDefinition = {
  plan: OrgPlan;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  priceNote?: string;
  maxSeats: number | null;
  highlights: string[];
  highlightsLeadIn?: string;
  popular?: boolean;
};

export const FREE_PLAN: PlanDefinition = {
  plan: "free",
  name: "Free",
  tagline: "For small teams getting started with Plan — issues, boards, and cycles.",
  monthlyPrice: 0,
  annualMonthlyPrice: 0,
  maxSeats: FREE_PLAN_DISPLAY_LIMITS.seats,
  highlights: [
    `Up to ${FREE_PLAN_DISPLAY_LIMITS.seats} members`,
    `${FREE_PLAN_DISPLAY_LIMITS.projects} projects`,
    `${FREE_PLAN_DISPLAY_LIMITS.issues} issues`,
    "Plan: issues, boards, cycles, and search",
    "Knowledge: read shared doc spaces",
    "Realtime collaboration",
  ],
};

export const PRO_PLAN: PlanDefinition = {
  plan: "pro",
  name: "Pro",
  tagline: "For growing teams — Knowledge, Discovery, and AI alongside Plan.",
  monthlyPrice: 20,
  annualMonthlyPrice: 16,
  priceNote: "+$10 per seat after the first · up to 10 members",
  maxSeats: 10,
  highlightsLeadIn: "Everything in Free, plus:",
  highlights: [
    "Up to 10 members (seat-based)",
    "Unlimited projects and issues",
    "Knowledge: create doc spaces and wikis",
    "Discovery: ideas board and promote-to-issue",
    "AI agent with workspace context",
    "50 AI messages per user per day",
  ],
  popular: true,
};

export const ENTERPRISE_PLAN: PlanDefinition = {
  plan: "enterprise",
  name: "Enterprise",
  tagline: "Full suite — Service desk and Automations at unlimited scale.",
  monthlyPrice: 99,
  annualMonthlyPrice: 79,
  priceNote: "Flat rate · unlimited members",
  maxSeats: null,
  highlightsLeadIn: "Everything in Pro, plus:",
  highlights: [
    "Unlimited members",
    "Service: customer portal and agent queues",
    "Automations for issues and requests",
    "Unlimited AI usage",
    "Priority support",
  ],
};

export const PLANS: PlanDefinition[] = [FREE_PLAN, PRO_PLAN, ENTERPRISE_PLAN];

const PLANS_BY_ORG_PLAN: Record<OrgPlan, PlanDefinition> = {
  free: FREE_PLAN,
  pro: PRO_PLAN,
  enterprise: ENTERPRISE_PLAN,
};

export function planForOrg(plan: OrgPlan): PlanDefinition {
  return PLANS_BY_ORG_PLAN[plan];
}

export function priceForPeriod(
  plan: PlanDefinition,
  period: BillingPeriod
): number {
  return period === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice;
}

export function formatPrice(amount: number): string {
  return `$${amount}`;
}

export type ComparisonValue = string | boolean;

export type ComparisonRow = {
  label: string;
  values: [ComparisonValue, ComparisonValue, ComparisonValue];
};

export type ComparisonSection = {
  title: string;
  rows: ComparisonRow[];
};

export const COMPARISON_SECTIONS: ComparisonSection[] = [
  {
    title: "Plan",
    rows: [
      {
        label: "Members",
        values: [
          `Up to ${FREE_PLAN_DISPLAY_LIMITS.seats}`,
          "Up to 10",
          "Unlimited",
        ],
      },
      {
        label: "Projects",
        values: [
          `${FREE_PLAN_DISPLAY_LIMITS.projects}`,
          "Unlimited",
          "Unlimited",
        ],
      },
      {
        label: "Issues",
        values: [
          `${FREE_PLAN_DISPLAY_LIMITS.issues}`,
          "Unlimited",
          "Unlimited",
        ],
      },
      { label: "Teams and cycles", values: ["Unlimited", "Unlimited", "Unlimited"] },
      { label: "Kanban boards and list views", values: [true, true, true] },
      { label: "Saved views and full-text search", values: [true, true, true] },
      { label: "Comments, mentions and activity", values: [true, true, true] },
    ],
  },
  {
    title: "Knowledge",
    rows: [
      { label: "Docs — read spaces", values: [true, true, true] },
      { label: "Docs — create spaces", values: [false, true, true] },
      { label: "Product Discovery", values: [false, true, true] },
    ],
  },
  {
    title: "Service",
    rows: [
      { label: "Service desk portal", values: [false, false, true] },
      { label: "Agent queues and SLAs", values: [false, false, true] },
    ],
  },
  {
    title: "AI",
    rows: [
      { label: "AI agent", values: [false, true, true] },
      {
        label: "AI messages",
        values: [false, "50 / user / day", "Unlimited"],
      },
      { label: "Triage assist", values: [false, true, true] },
      { label: "Duplicate detection", values: [false, true, true] },
      { label: "Standup and cycle reports", values: [false, true, true] },
    ],
  },
  {
    title: "Automations",
    rows: [
      { label: "Issue and request automations", values: [false, false, true] },
    ],
  },
  {
    title: "Support",
    rows: [
      { label: "Community support", values: [true, true, true] },
      { label: "Priority support", values: [false, false, true] },
    ],
  },
];
