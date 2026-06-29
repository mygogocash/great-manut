"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BillingPeriod,
  BUSINESS_PLAN_DEF,
  PlanDefinition,
  formatPrice,
  priceForPeriod,
} from "@/lib/plans";
import { BillingPeriodToggle } from "./billing-period-toggle";

export function UpgradeOptions({ org }: { org: Doc<"organizations"> }) {
  const [period, setPeriod] = useState<BillingPeriod>("month");

  if (org.plan !== "free") {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">Upgrade</h2>
          <p className="text-xs text-muted-foreground">
            More storage with metered overage — AI stays top-up or BYOK.
          </p>
        </div>
        <BillingPeriodToggle period={period} onPeriodChange={setPeriod} />
      </div>

      <UpgradeCard plan={BUSINESS_PLAN_DEF} period={period} />
    </section>
  );
}

function UpgradeCard({
  plan,
  period,
}: {
  plan: PlanDefinition;
  period: BillingPeriod;
}) {
  const membership = useQuery(api.organizations.myMembership);
  const updatePlan = useMutation(api.organizations.updatePlan);
  const createCheckout = useMutation(api.billing.stripe.createBusinessCheckout);
  const isAdmin = membership?.role === "admin";

  const startCheckout = () => {
    const base = window.location.origin;
    void createCheckout({
      period,
      successUrl: `${base}/settings/billing?checkout=success`,
      cancelUrl: `${base}/settings/billing`,
    })
      .then((result) => {
        if ("url" in result && typeof result.url === "string") {
          window.location.href = result.url;
          return;
        }
        void updatePlan({ plan: "business" })
          .then(() => toast.success(`Welcome to ${plan.name} (demo)`))
          .catch((error: unknown) => {
            toast.error(
              error instanceof Error ? error.message : "Failed to upgrade"
            );
          });
      })
      .catch((error: unknown) => {
        toast.error(
          error instanceof Error ? error.message : "Checkout failed"
        );
      });
  };

  return (
    <div className="flex flex-col rounded-lg border border-primary/40 bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{plan.name}</span>
        <Badge className="h-4 rounded-full px-1.5 text-[10px]">Popular</Badge>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tracking-tight">
          {formatPrice(priceForPeriod(plan, period))}
        </span>
        <span className="text-xs text-muted-foreground">
          / month{period === "annual" && ", billed annually"}
        </span>
      </div>
      {plan.priceNote && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {plan.priceNote}
        </p>
      )}

      <ul className="mt-3 flex flex-col gap-1.5">
        {plan.highlights.slice(0, 4).map((highlight) => (
          <li
            key={highlight}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Check className="size-3.5 shrink-0 text-primary" />
            {highlight}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex-1" />
      {isAdmin ? (
        <Button size="sm" className="w-full" onClick={startCheckout}>
          Upgrade to {plan.name}
        </Button>
      ) : (
        <Button size="sm" variant="outline" className="w-full" disabled>
          Ask an admin to upgrade
        </Button>
      )}
    </div>
  );
}
