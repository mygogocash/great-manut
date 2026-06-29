/** Convex mirror of `lib/usage-pricing.ts` — keep in sync. */
export const STORAGE_INCLUDED_BYTES = {
  free: 2 * 1024 * 1024 * 1024,
  business: 10 * 1024 * 1024 * 1024,
} as const;

export const STORAGE_OVERAGE_USD_PER_GB_MONTH = 0.03;
export const AI_STARTER_CREDITS = 50;

export const AI_CREDIT_WEIGHTS = {
  chatMessage: 1,
  issueEmbedding: 0.1,
  semanticSearch: 0.2,
} as const;

export type AiCreditEvent = keyof typeof AI_CREDIT_WEIGHTS;

export const AI_CREDIT_PACKS = [
  { id: "starter", credits: 200, priceUsd: 4 },
  { id: "standard", credits: 1000, priceUsd: 16 },
  { id: "pro", credits: 5000, priceUsd: 75 },
] as const;

export type AiCreditPackId = (typeof AI_CREDIT_PACKS)[number]["id"];

export function storageIncludedBytes(
  plan: "free" | "business"
): number {
  return STORAGE_INCLUDED_BYTES[plan];
}

export function creditsForEvent(event: AiCreditEvent): number {
  return AI_CREDIT_WEIGHTS[event];
}
