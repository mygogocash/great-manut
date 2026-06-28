"use client";

import {
  BookOpen,
  Headphones,
  Lightbulb,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ENTERPRISE_PLAN,
  PRO_PLAN,
  type OrgPlan,
} from "@/lib/plans";
import type { SuiteFeature } from "./use-suite-feature-access";

type FeatureCopy = {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
  targetPlan: OrgPlan;
};

const FEATURE_COPY: Record<SuiteFeature, FeatureCopy> = {
  docs_write: {
    icon: BookOpen,
    title: "Create doc spaces on Pro",
    description:
      "Browse and read shared wikis on Free. Upgrade to Pro to create spaces and publish team knowledge.",
    bullets: [
      "Unlimited doc spaces and pages",
      "Version history and inline comments",
      "Issue key links from specs to delivery",
    ],
    targetPlan: "pro",
  },
  discovery: {
    icon: Lightbulb,
    title: "Product Discovery on Pro",
    description:
      "Capture ideas, score impact vs effort, and promote the best ones into delivery work.",
    bullets: [
      "Kanban and impact/effort matrix views",
      "Promote ideas to issues with traceability",
      "Link ideas to projects and teams",
    ],
    targetPlan: "pro",
  },
  service_desk: {
    icon: Headphones,
    title: "Service desk on Enterprise",
    description:
      "Run a customer portal, agent queues, and SLA tracking alongside your product backlog.",
    bullets: [
      "Public request portal per workspace",
      "Unassigned, mine, and all-open queues",
      "Convert requests into dev issues",
    ],
    targetPlan: "enterprise",
  },
  automations: {
    icon: Zap,
    title: "Automations on Enterprise",
    description:
      "Trigger actions when issues or service requests change — no manual busywork.",
    bullets: [
      "Rules for status changes and new requests",
      "Assign, label, comment, and update issues",
      "Admin-controlled enable/disable per rule",
    ],
    targetPlan: "enterprise",
  },
};

export function FeatureUpgradeCta({ feature }: { feature: SuiteFeature }) {
  const copy = FEATURE_COPY[feature];
  const plan =
    copy.targetPlan === "enterprise" ? ENTERPRISE_PLAN : PRO_PLAN;
  const Icon = copy.icon;

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl border bg-primary/10">
          <Icon className="size-6 text-primary" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold">{copy.title}</h2>
          <p className="text-sm text-muted-foreground">{copy.description}</p>
        </div>
        <div className="flex w-full flex-col gap-3 rounded-lg border bg-card p-4 text-left">
          {copy.bullets.map((bullet) => (
            <div key={bullet} className="flex items-start gap-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground">{bullet}</p>
            </div>
          ))}
        </div>
        <Button asChild size="sm">
          <Link href="/pricing">
            Upgrade to {plan.name} · from ${plan.monthlyPrice}/mo
          </Link>
        </Button>
      </div>
    </div>
  );
}
