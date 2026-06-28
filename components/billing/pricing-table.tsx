"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BillingPeriod,
  PLANS,
  PlanDefinition,
  formatPrice,
  priceForPeriod,
} from "@/lib/plans";
import { cn } from "@/lib/utils";
import { BillingPeriodToggle } from "./billing-period-toggle";

export function PricingTable() {
  const [period, setPeriod] = useState<BillingPeriod>("month");

  return (
    <div className="flex flex-col items-center gap-8">
      <BillingPeriodToggle period={period} onPeriodChange={setPeriod} />
      <div className="grid w-full gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard key={plan.plan} plan={plan} period={period} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  period,
}: {
  plan: PlanDefinition;
  period: BillingPeriod;
}) {
  const price = priceForPeriod(plan, period);

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-card p-6",
        plan.popular &&
          "border-primary/40 shadow-[0_0_60px_-16px] shadow-primary/25"
      )}
    >
      {plan.popular && (
        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2.5">
          Most popular
        </Badge>
      )}

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{plan.name}</h3>
      </div>
      <p className="mt-1 min-h-8 text-xs text-muted-foreground">
        {plan.tagline}
      </p>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tracking-tight">
          {formatPrice(price)}
        </span>
        <span className="text-sm text-muted-foreground">/ month</span>
      </div>
      <p className="mt-1 min-h-4 text-xs text-muted-foreground">
        {price > 0 && period === "annual"
          ? `Billed annually${plan.priceNote ? ` · ${plan.priceNote}` : ""}`
          : (plan.priceNote ?? (price === 0 ? "Free forever" : ""))}
      </p>

      <div className="mt-5">
        <PlanCta plan={plan} />
      </div>

      <ul className="mt-6 flex flex-col gap-2 border-t pt-5">
        {plan.highlightsLeadIn && (
          <li className="text-xs font-medium text-foreground">
            {plan.highlightsLeadIn}
          </li>
        )}
        {plan.highlights.map((highlight) => (
          <li
            key={highlight}
            className="flex items-start gap-2 text-xs text-muted-foreground"
          >
            <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {highlight}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanCta({ plan }: { plan: PlanDefinition }) {
  return (
    <>
      <Unauthenticated>
        <Button variant={plan.popular ? "default" : "outline"} size="lg" className="w-full" asChild>
          <Link href="/sign-up">
            {plan.monthlyPrice === 0
              ? "Start for free"
              : `Start with ${plan.name}`}
          </Link>
        </Button>
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedPlanCta plan={plan} />
      </Authenticated>
    </>
  );
}

function AuthenticatedPlanCta({ plan }: { plan: PlanDefinition }) {
  const org = useQuery(api.organizations.current);
  const workspaces = useQuery(api.organizations.listMine);
  const updatePlan = useMutation(api.organizations.updatePlan);

  const membership = org
    ? workspaces?.find((entry) => entry.orgId === org._id)
    : undefined;

  const variant = plan.popular ? "default" : "outline";

  if (org === undefined || workspaces === undefined) {
    return (
      <Button variant={variant} size="lg" className="w-full" disabled>
        &nbsp;
      </Button>
    );
  }

  if (org === null) {
    return (
      <Button variant={variant} size="lg" className="w-full" asChild>
        <Link href="/onboarding">Choose a workspace</Link>
      </Button>
    );
  }

  if (org.plan === plan.plan) {
    return (
      <Button variant="outline" size="lg" className="w-full" disabled>
        Current plan
      </Button>
    );
  }

  const isAdmin = membership?.role === "admin";
  if (!isAdmin) {
    return (
      <Button variant="outline" size="lg" className="w-full" disabled>
        Ask an admin to change plans
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size="lg"
      className="w-full"
      onClick={() => {
        void updatePlan({ plan: plan.plan })
          .then(() => toast.success(`Switched to ${plan.name}`))
          .catch((error: unknown) => {
            toast.error(
              error instanceof Error ? error.message : "Failed to update plan"
            );
          });
      }}
    >
      {org.plan === "free" && plan.monthlyPrice > 0
        ? `Upgrade to ${plan.name}`
        : plan.monthlyPrice === 0
          ? "Switch to Free"
          : `Switch to ${plan.name}`}
    </Button>
  );
}
