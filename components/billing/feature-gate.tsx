"use client";

import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { PRO_PLAN } from "@/lib/plans";

export type GatedFeature = "automations" | "service_desk";

const FEATURE_COPY: Record<
  GatedFeature,
  { title: string; description: string }
> = {
  automations: {
    title: "Automations",
    description:
      "Create rules that react to issue and service request changes automatically.",
  },
  service_desk: {
    title: "Service desk",
    description:
      "Run a customer portal and agent queue for support requests.",
  },
};

function hasFeatureAccess(plan: "free" | "pro" | "enterprise" | undefined): boolean {
  return plan === "pro" || plan === "enterprise";
}

/** Cosmetic plan gate for suite features. Convex enforces access in mutations. */
export function FeatureGate({
  feature,
  children,
}: {
  feature: GatedFeature;
  children: ReactNode;
}) {
  const org = useQuery(api.organizations.current);
  const copy = FEATURE_COPY[feature];

  if (org === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!hasFeatureAccess(org?.plan)) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 p-8 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-md bg-primary/15">
          <Sparkles className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-semibold">{copy.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Available on {PRO_PLAN.name} ({PRO_PLAN.tagline.toLowerCase()}).
        </p>
        <Button size="sm" className="mx-auto" asChild>
          <Link href="/pricing">
            View plans
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
