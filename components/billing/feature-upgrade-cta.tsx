"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { SuiteFeature } from "./use-suite-feature-access";

const FEATURE_COPY: Record<
  SuiteFeature,
  { title: string; description: string }
> = {
  docs_write: {
    title: "Docs",
    description: "Create and browse wiki spaces on every plan.",
  },
  discovery: {
    title: "Product Discovery",
    description: "Capture and prioritize ideas on every plan.",
  },
  service_desk: {
    title: "Service desk",
    description: "Customer portal and agent queues on every plan.",
  },
  automations: {
    title: "Automations",
    description: "Rule-based workflows on every plan.",
  },
};

export function FeatureUpgradeCta({ feature }: { feature: SuiteFeature }) {
  const copy = FEATURE_COPY[feature];

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl border bg-primary/10">
          <Sparkles className="size-6 text-primary" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">{copy.title}</h2>
          <p className="text-sm text-muted-foreground">{copy.description}</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/pricing">View plans</Link>
        </Button>
      </div>
    </div>
  );
}
