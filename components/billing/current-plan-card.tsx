"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, planForOrg } from "@/lib/plans";

function statusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" {
  if (status === "active") {
    return "default";
  }
  if (status === "past_due" || status === "unpaid" || status === "incomplete") {
    return "destructive";
  }
  return "secondary";
}

export function CurrentPlanCard({ org }: { org: Doc<"organizations"> }) {
  const membership = useQuery(api.organizations.myMembership);
  const isAdmin = membership?.role === "admin";
  const plan = planForOrg(org.plan);
  const isPaid = plan.monthlyPrice > 0;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium">Plan</h2>
        <p className="text-xs text-muted-foreground">
          The subscription for the {org.name} workspace.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{plan.name}</span>
              {org.subscriptionStatus && (
                <Badge
                  variant={statusBadgeVariant(org.subscriptionStatus)}
                  className="h-4 rounded-full px-1.5 text-[10px] capitalize"
                >
                  {org.subscriptionStatus.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{plan.tagline}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold tracking-tight">
              {formatPrice(plan.monthlyPrice)}
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                / month
              </span>
            </div>
            {plan.priceNote && (
              <p className="text-[11px] text-muted-foreground">
                {plan.priceNote}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t pt-3">
          {isPaid ? (
            isAdmin ? (
              <p className="text-xs text-muted-foreground">
                Plan changes are managed from the upgrade section below.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Only workspace admins can manage the subscription.
              </p>
            )
          ) : (
            <Button size="sm" asChild>
              <Link href="/pricing">
                Compare plans
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
