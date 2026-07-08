import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { verifyStripeWebhookSignature } from "./billing/verifyStripeWebhook";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response("Stripe webhook not configured", { status: 503 });
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    const body = await request.text();

    const signatureValid = await verifyStripeWebhookSignature({
      payload: body,
      signatureHeader: signature,
      secret: webhookSecret,
    });
    if (!signatureValid) {
      return new Response("Invalid signature", { status: 400 });
    }

    let event: {
      type: string;
      data: { object: Record<string, unknown> };
    };
    try {
      event = JSON.parse(body) as {
        type: string;
        data: { object: Record<string, unknown> };
      };
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orgId = session.metadata
        ? (session.metadata as { orgId?: string }).orgId
        : undefined;
      const type = session.metadata
        ? (session.metadata as { type?: string }).type
        : undefined;
      const packId = session.metadata
        ? (session.metadata as { packId?: string }).packId
        : undefined;
      const creditsRaw = session.metadata
        ? (session.metadata as { credits?: string }).credits
        : undefined;

      if (orgId && type && typeof session.id === "string") {
        await ctx.runMutation(internal.billing.stripe.handleCheckoutCompleted, {
          sessionId: session.id,
          orgId: orgId as import("./_generated/dataModel").Id<"organizations">,
          type,
          packId,
          credits: creditsRaw ? Number(creditsRaw) : undefined,
          subscriptionId:
            typeof session.subscription === "string"
              ? session.subscription
              : undefined,
          customerId:
            typeof session.customer === "string"
              ? session.customer
              : undefined,
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
