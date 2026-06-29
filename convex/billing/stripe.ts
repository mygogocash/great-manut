import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, internalMutation } from "../_generated/server";
import { orgAdminMutation } from "../lib/customFunctions";
import { packById } from "../aiCredits";

type StripeConfig = {
  secretKey: string;
  webhookSecret: string;
  businessMonthlyPriceId: string;
  businessAnnualPriceId: string;
  packPriceIds: Record<string, string>;
};

function stripeConfig(): StripeConfig | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  return {
    secretKey,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    businessMonthlyPriceId:
      process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID ?? "",
    businessAnnualPriceId: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID ?? "",
    packPriceIds: {
      starter: process.env.STRIPE_AI_PACK_STARTER_PRICE_ID ?? "",
      standard: process.env.STRIPE_AI_PACK_STANDARD_PRICE_ID ?? "",
      pro: process.env.STRIPE_AI_PACK_PRO_PRICE_ID ?? "",
    },
  };
}

async function stripeRequest(
  secretKey: string,
  path: string,
  body: Record<string, string>
): Promise<Record<string, unknown>> {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  const json = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const message =
      typeof json.error === "object" &&
      json.error &&
      "message" in json.error &&
      typeof (json.error as { message: string }).message === "string"
        ? (json.error as { message: string }).message
        : "Stripe request failed";
    throw new Error(message);
  }
  return json;
}

export const createBusinessCheckout = orgAdminMutation({
  args: {
    period: v.union(v.literal("month"), v.literal("annual")),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  returns: v.union(
    v.object({ url: v.string() }),
    v.object({ stub: v.literal(true), message: v.string() })
  ),
  handler: async (ctx, args) => {
    const config = stripeConfig();
    if (!config) {
      return {
        stub: true as const,
        message:
          "Stripe is not configured. Use demo plan switch in billing settings or set STRIPE_SECRET_KEY.",
      };
    }

    const priceId =
      args.period === "annual"
        ? config.businessAnnualPriceId
        : config.businessMonthlyPriceId;
    if (!priceId) {
      return {
        stub: true as const,
        message: "Business Stripe price IDs are not configured.",
      };
    }

    const session = await stripeRequest(config.secretKey, "/checkout/sessions", {
      mode: "subscription",
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      client_reference_id: ctx.org._id,
      "metadata[orgId]": ctx.org._id,
      "metadata[type]": "business_subscription",
      allow_promotion_codes: "true",
    });

    const url = session.url;
    if (typeof url !== "string") {
      throw new Error("Stripe did not return a checkout URL");
    }
    return { url };
  },
});

export const createAiPackCheckout = orgAdminMutation({
  args: {
    packId: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  returns: v.union(
    v.object({ url: v.string() }),
    v.object({ stub: v.literal(true), message: v.string() })
  ),
  handler: async (ctx, args) => {
    const pack = packById(args.packId);
    if (!pack) {
      throw new Error("Unknown credit pack");
    }

    const config = stripeConfig();
    if (!config) {
      return {
        stub: true as const,
        message:
          "Stripe is not configured. Set STRIPE_SECRET_KEY for credit top-ups.",
      };
    }

    const priceId = config.packPriceIds[pack.id];
    if (!priceId) {
      return {
        stub: true as const,
        message: `Stripe price ID missing for pack ${pack.id}.`,
      };
    }

    const session = await stripeRequest(config.secretKey, "/checkout/sessions", {
      mode: "payment",
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      client_reference_id: ctx.org._id,
      "metadata[orgId]": ctx.org._id,
      "metadata[type]": "ai_credit_pack",
      "metadata[packId]": pack.id,
      "metadata[credits]": String(pack.credits),
    });

    const url = session.url;
    if (typeof url !== "string") {
      throw new Error("Stripe did not return a checkout URL");
    }
    return { url };
  },
});

export const handleCheckoutCompleted = internalMutation({
  args: {
    sessionId: v.string(),
    orgId: v.id("organizations"),
    type: v.string(),
    packId: v.optional(v.string()),
    credits: v.optional(v.number()),
    subscriptionId: v.optional(v.string()),
    customerId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.type === "ai_credit_pack" && args.credits) {
      await ctx.runMutation(internal.aiCredits.grantCredits, {
        orgId: args.orgId,
        credits: args.credits,
        stripeSessionId: args.sessionId,
        packId: args.packId,
      });
      return null;
    }

    if (args.type === "business_subscription") {
      await ctx.db.patch(args.orgId, {
        plan: "business",
        subscriptionStatus: "active",
        stripeSubscriptionId: args.subscriptionId,
        stripeCustomerId: args.customerId,
      });
    }
    return null;
  },
});

export const reportStorageMeter = internalAction({
  args: {
    orgId: v.id("organizations"),
    overageGb: v.number(),
  },
  returns: v.null(),
  handler: async (_ctx, args): Promise<null> => {
    const config = stripeConfig();
    const meterEventName = process.env.STRIPE_STORAGE_METER_EVENT_NAME;
    if (!config || !meterEventName || args.overageGb <= 0) {
      return null;
    }

    await stripeRequest(config.secretKey, "/billing/meter_events", {
      event_name: meterEventName,
      payload: JSON.stringify({
        stripe_customer_id: args.orgId,
        value: String(args.overageGb),
      }),
    });
    return null;
  },
});
