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
  ENTERPRISE_PLAN,
  PRO_PLAN,
  PlanDefinition,
  formatPrice,
  priceForPeriod,
} from "@/lib/plans";
import { cn } from "@/lib/utils";
import { BillingPeriodToggle } from "./billing-period-toggle";

export function UpgradeOptions({ org }: { org: Doc<"organizations"> }) {
  const [period, setPeriod] = useState<BillingPeriod>("month");

  const upgrades: PlanDefinition[] =
    org.plan === "free"
      ? [PRO_PLAN, ENTERPRISE_PLAN]
      : org.plan === "pro"
        ? [ENTERPRISE_PLAN]
        : [];

  if (upgrades.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">Upgrade</h2>
          <p className="text-xs text-muted-foreground">
            Unlock the AI agent and remove workspace limits.
          </p>
        </div>
        <BillingPeriodToggle period={period} onPeriodChange={setPeriod} />
      </div>

      <div
        className={cn(
          "grid gap-3",
          upgrades.length > 1 && "sm:grid-cols-2"
        )}
      >
        {upgrades.map((plan) => (
          <UpgradeCard key={plan.plan} plan={plan} period={period} />
        ))}
      </div>
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
  const isAdmin = membership?.role === "admin";

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border bg-card p-4",
        plan.popular && "border-primary/40"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{plan.name}</span>
        {plan.popular && (
          <Badge className="h-4 rounded-full px-1.5 text-[10px]">
            Popular
          </Badge>
        )}
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
        {plan.highlights.slice(0, 3).map((highlight) => (
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
        <Button
          size="sm"
          variant={plan.popular ? "default" : "outline"}
          className="w-full"
          onClick={() => {
            void updatePlan({ plan: plan.plan })
              .then(() => toast.success(`Welcome to ${plan.name}`))
              .catch((error: unknown) => {
                toast.error(
                  error instanceof Error ? error.message : "Failed to upgrade"
                );
              });
          }}
        >
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
