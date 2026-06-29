# Usage-based billing spec (Free + Business)

**Status:** Implemented 2026-06-28  
**Replaces:** `docs/specs/2026-06-28-stripe-billing-coupons-spec.md` (3-tier seat model)

## Summary

Two plans with **unlimited seats** and **full suite access** on both tiers:

| Plan | Price | Storage | AI |
|------|-------|---------|-----|
| **Free** | $0 | 2 GB included | Managed top-up or BYOK (50 starter credits once) |
| **Business** | $10/mo or $100/yr | 10 GB included, $0.03/GB overage | Same as Free — not bundled |

AI is **never** subscription-bundled. Orgs use **managed prepaid credits** (Manut `OPENAI_API_KEY`) or **BYOK** (OpenAI, Anthropic, OpenRouter).

## Pricing constants

Source: `lib/usage-pricing.ts`

### Storage

- Free: 2 GB hard cap (uploads blocked at quota)
- Business: 10 GB included; overage billed at **$0.03/GB/month** via Stripe meter `manut_storage_gb`
- COGS target: R2 $0.015/GB/month

### AI credit packs (one-time Stripe Checkout)

| Pack | Credits | Price |
|------|---------|-------|
| Starter | 200 | $4 |
| Standard | 1,000 | $16 |
| Pro | 5,000 | $75 |

Credits never expire. COGS ~$0.008/credit (50% margin at pack pricing).

### Credit weights

| Event | Credits |
|-------|---------|
| AI chat message | 1 |
| Issue embedding | 0.1 |
| Semantic search / duplicate detection | 0.2 |

BYOK path: no credit deduction; provider bills customer directly.

## Schema

### `organizations`

- `plan`: `free | business` (migrate `pro` / `enterprise` → `business`)
- `storageBytesUsed`: number (denormalized from attachments)
- `aiMode`: `managed | byok` (default `managed`)
- `aiCreditBalance`: number (decimals for 0.1 embed weights)
- `stripeCustomerId`, `stripeSubscriptionId` (optional)

### `orgAiCredentials` (BYOK)

- `orgId`, `provider`, `encryptedApiKey`, optional model ids, `lastValidatedAt`
- Admin write only; keys never returned to client (masked prefix only)

### `attachments`

- `by_org` index for aggregation
- Optional `r2Key` for R2 migration (Convex `_storage` fallback)

### `aiCreditGrants`

- Idempotent Stripe `checkout.session.completed` grants by `stripeSessionId`

## Convex modules

| Module | Role |
|--------|------|
| `convex/lib/usageLimits.ts` | Storage quota + managed credit balance |
| `convex/lib/usagePricing.ts` | Convex mirror of pricing constants |
| `convex/aiCredentials.ts` | BYOK CRUD + encrypt/decrypt |
| `convex/aiCredits.ts` | Balance, deduct, grant from webhook |
| `convex/usage.ts` | `getOrgUsage` for billing UI |
| `convex/billing/stripe.ts` | Checkout + webhook handlers |
| `convex/agent/resolveProvider.ts` | `resolveOrgAiProvider(orgId)` |

## Stripe catalog

| Object | Config |
|--------|--------|
| Product: Manut Business | $10/mo + $100/yr recurring |
| Meter: `manut_storage_gb` | Business overage $0.03/GB |
| Product: Manut AI Credits | One-time pack prices |
| Checkout | `subscription` for Business; `payment` for packs |

**No AI meter on subscription.**

Env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs for packs and Business plans.

When Stripe keys are missing, Checkout mutations return a structured stub error; demo `updatePlan` remains for dev.

## BYOK security

- Encrypt with `AI_CREDENTIALS_SECRET` (Convex env) before `db.insert`
- Decrypt only in `"use node"` actions (`chat`, `embeddings`, `resolveProvider`)
- Validate key on save with provider test call
- Claude chat: OpenAI-compatible OpenRouter path or Anthropic API validate + `@ai-sdk/openai` for OpenAI; Anthropic inference via OpenRouter-compatible fetch wrapper

## R2 migration

- `wrangler.toml`: `[[r2_buckets]]` binding `MANUT_ATTACHMENTS`
- `lib/r2-storage.ts`: abstraction for upload URL / download proxy
- Attachments: prefer `r2Key` when set; else Convex `_storage`

## Migration

- One-time internal mutation: `pro` / `enterprise` → `business`
- New orgs: `aiCreditBalance: 50`, `aiMode: managed`, `storageBytesUsed: 0`

## Verification

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Manual: pricing page, billing settings (storage bar, AI balance, BYOK form), upload at quota, AI chat at zero balance.
