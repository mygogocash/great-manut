/**
 * Plan definitions and display helpers for Manut billing UI.
 *
 * Enforcement: `convex/lib/usageLimits.ts` (storage + AI credits).
 * Pricing constants: `lib/usage-pricing.ts`.
 */

import {
  AI_CREDIT_PACKS,
  BUSINESS_PLAN as BUSINESS_PRICING,
  STORAGE_INCLUDED_BYTES,
  STORAGE_OVERAGE_USD_PER_GB_MONTH,
  formatStorageGb,
} from "@/lib/usage-pricing";

/** Convex `organizations.plan` values. */
export type OrgPlan = "free" | "business";

export type BillingPeriod = "month" | "annual";

export type PlanDefinition = {
  plan: OrgPlan;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  priceNote?: string;
  highlights: string[];
  highlightsLeadIn?: string;
  popular?: boolean;
};

const freeStorage = formatStorageGb(STORAGE_INCLUDED_BYTES.free);
const businessStorage = formatStorageGb(STORAGE_INCLUDED_BYTES.business);

export const FREE_PLAN: PlanDefinition = {
  plan: "free",
  name: "Free",
  tagline:
    "Unlimited teammates. Full suite. AI via credit top-up or your own API key.",
  monthlyPrice: 0,
  annualMonthlyPrice: 0,
  highlights: [
    "Unlimited members, projects, and issues",
    `${freeStorage} attachment storage`,
    "Docs, Discovery, Service desk, Automations",
    "AI: top-up packs or BYOK (OpenAI, Claude, OpenRouter)",
    "50 starter AI credits once",
  ],
};

export const BUSINESS_PLAN_DEF: PlanDefinition = {
  plan: "business",
  name: "Business",
  tagline: `$${BUSINESS_PRICING.monthlyPriceUsd}/mo for more storage — same AI model as Free.`,
  monthlyPrice: BUSINESS_PRICING.monthlyPriceUsd,
  annualMonthlyPrice: BUSINESS_PRICING.annualMonthlyEquivalentUsd,
  priceNote: `$${BUSINESS_PRICING.annualPriceUsd}/year · 2 months free`,
  highlightsLeadIn: "Everything in Free, plus:",
  highlights: [
    `${businessStorage} storage included`,
    `$${STORAGE_OVERAGE_USD_PER_GB_MONTH}/GB/mo overage`,
    "Stripe metered storage billing",
    "Same AI: top-up or BYOK (not bundled)",
  ],
  popular: true,
};

export const PLANS: PlanDefinition[] = [FREE_PLAN, BUSINESS_PLAN_DEF];

const PLANS_BY_ORG_PLAN: Record<OrgPlan, PlanDefinition> = {
  free: FREE_PLAN,
  business: BUSINESS_PLAN_DEF,
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
  values: [ComparisonValue, ComparisonValue];
};

export type ComparisonSection = {
  title: string;
  rows: ComparisonRow[];
};

export const COMPARISON_SECTIONS: ComparisonSection[] = [
  {
    title: "Workspace",
    rows: [
      { label: "Members", values: ["Unlimited", "Unlimited"] },
      { label: "Projects & issues", values: ["Unlimited", "Unlimited"] },
      { label: "Storage included", values: [freeStorage, businessStorage] },
      {
        label: "Storage overage",
        values: [false, `$${STORAGE_OVERAGE_USD_PER_GB_MONTH}/GB/mo`],
      },
      { label: "All suite modules", values: [true, true] },
    ],
  },
  {
    title: "AI",
    rows: [
      { label: "Managed credit top-up", values: [true, true] },
      {
        label: "Credit packs",
        values: [
          `$${AI_CREDIT_PACKS[0].priceUsd}–$${AI_CREDIT_PACKS[2].priceUsd}`,
          `$${AI_CREDIT_PACKS[0].priceUsd}–$${AI_CREDIT_PACKS[2].priceUsd}`,
        ],
      },
      { label: "BYOK (OpenAI, Claude, OpenRouter)", values: [true, true] },
      { label: "AI bundled in subscription", values: [false, false] },
    ],
  },
];

/** @deprecated Legacy export — use BUSINESS_PLAN_DEF */
export const BUSINESS_PLAN = BUSINESS_PLAN_DEF;
