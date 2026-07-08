/**
 * Single source of truth for usage quotas, COGS, and retail prices.
 * Mirror constants in `convex/lib/usagePricing.ts` for Convex enforcement.
 */

export type OrgPlanId = "free" | "business";

export type AiMode = "managed" | "byok";

export type AiProvider = "openai" | "anthropic" | "openrouter" | "vertex";

export type EmbeddingProvider = "openai" | "openrouter" | "vertex";

/** Bytes included per plan before overage billing (Business only). */
export const STORAGE_INCLUDED_BYTES: Record<OrgPlanId, number> = {
  free: 2 * 1024 * 1024 * 1024,
  business: 10 * 1024 * 1024 * 1024,
};

/** Retail storage overage per GB-month (50% margin on R2 @ $0.015/GB). */
export const STORAGE_OVERAGE_USD_PER_GB_MONTH = 0.03;

/** Internal COGS per GB-month on R2. */
export const STORAGE_COGS_USD_PER_GB_MONTH = 0.015;

/** Blended COGS per managed AI credit. */
export const AI_CREDIT_COGS_USD = 0.008;

/** One-time starter grant for new orgs (managed mode). */
export const AI_STARTER_CREDITS = 50;

/** Billable AI credit weights per event type. */
export const AI_CREDIT_WEIGHTS = {
  chatMessage: 1,
  issueEmbedding: 0.1,
  semanticSearch: 0.2,
  triageSuggestion: 0.5,
  duplicateDetection: 0.2,
} as const;

export type AiCreditPackId = "starter" | "standard" | "pro";

export type AiCreditPack = {
  id: AiCreditPackId;
  credits: number;
  priceUsd: number;
  label: string;
};

export const AI_CREDIT_PACKS: AiCreditPack[] = [
  { id: "starter", credits: 200, priceUsd: 4, label: "Starter" },
  { id: "standard", credits: 1000, priceUsd: 16, label: "Standard" },
  { id: "pro", credits: 5000, priceUsd: 75, label: "Pro" },
];

export const BUSINESS_PLAN = {
  monthlyPriceUsd: 10,
  annualPriceUsd: 100,
  annualMonthlyEquivalentUsd: 8.33,
} as const;

export function bytesToGb(bytes: number): number {
  return bytes / (1024 * 1024 * 1024);
}

export function formatStorageGb(bytes: number): string {
  const gb = bytesToGb(bytes);
  if (gb < 0.01 && bytes > 0) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${gb.toFixed(gb >= 10 ? 0 : 1)} GB`;
}

export function storageIncludedBytes(plan: OrgPlanId): number {
  return STORAGE_INCLUDED_BYTES[plan];
}

export function storageOverageBytes(plan: OrgPlanId, usedBytes: number): number {
  const included = storageIncludedBytes(plan);
  if (plan !== "business" || usedBytes <= included) {
    return 0;
  }
  return usedBytes - included;
}

export function estimatedStorageOverageUsd(
  plan: OrgPlanId,
  usedBytes: number
): number {
  const overageGb = bytesToGb(storageOverageBytes(plan, usedBytes));
  return overageGb * STORAGE_OVERAGE_USD_PER_GB_MONTH;
}
