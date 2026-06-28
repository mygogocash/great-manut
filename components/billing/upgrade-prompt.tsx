"use client";

import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast, useSonner } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ENTERPRISE_PLAN,
  PRO_PLAN,
  type PlanDefinition,
} from "@/lib/plans";
import {
  FEATURE_GATE_COPY,
  matchUpgradePromptMessage,
  PLAN_LIMIT_COPY,
  type UpgradePromptKind,
} from "./plan-limit-error";

function copyForKind(kind: UpgradePromptKind): {
  title: string;
  description: string;
  targetPlan: PlanDefinition;
} {
  if (kind === "issues" || kind === "projects" || kind === "seats") {
    return {
      ...PLAN_LIMIT_COPY[kind],
      targetPlan: PRO_PLAN,
    };
  }
  const feature = FEATURE_GATE_COPY[kind];
  return {
    title: feature.title,
    description: feature.description,
    targetPlan:
      feature.targetPlan === "enterprise" ? ENTERPRISE_PLAN : PRO_PLAN,
  };
}

export function UpgradePromptDialog({
  open,
  onOpenChange,
  kind,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: UpgradePromptKind;
}) {
  const membership = useQuery(api.organizations.myMembership);
  const updatePlan = useMutation(api.organizations.updatePlan);
  const isAdmin = membership?.role === "admin";
  const { title, description, targetPlan } = copyForKind(kind);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex size-8 items-center justify-center rounded-md bg-primary/15">
            <Sparkles className="size-4 text-primary" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-1.5 rounded-md border bg-muted/40 p-3">
          {targetPlan.highlights.slice(0, 4).map((highlight) => (
            <li
              key={highlight}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Check className="size-3.5 shrink-0 text-primary" />
              {highlight}
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pricing">
              Compare plans
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
          {isAdmin ? (
            <Button
              size="sm"
              onClick={() => {
                void updatePlan({ plan: targetPlan.plan })
                  .then(() => {
                    toast.success(`Welcome to Manut ${targetPlan.name}`);
                    onOpenChange(false);
                  })
                  .catch((error: unknown) => {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to upgrade"
                    );
                  });
              }}
            >
              Upgrade to {targetPlan.name} · ${targetPlan.monthlyPrice}/mo
            </Button>
          ) : (
            <Button size="sm" disabled>
              Ask an admin to upgrade
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const seenToastIds = new Set<string | number>();

export function PlanLimitListener() {
  const { toasts } = useSonner();
  const pendingKindRef = useRef<UpgradePromptKind | null>(null);
  const [kind, setKind] = useState<UpgradePromptKind | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    for (const t of toasts) {
      if (seenToastIds.has(t.id)) {
        continue;
      }
      seenToastIds.add(t.id);
      const title = typeof t.title === "string" ? t.title : "";
      const description =
        typeof t.description === "string" ? t.description : "";
      const match =
        matchUpgradePromptMessage(title) ??
        matchUpgradePromptMessage(description);
      if (match) {
        pendingKindRef.current = match;
      }
    }
    if (pendingKindRef.current === null) {
      return;
    }
    const timer = window.setTimeout(() => {
      if (pendingKindRef.current !== null) {
        setKind(pendingKindRef.current);
        setOpen(true);
        pendingKindRef.current = null;
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  if (kind === null) {
    return null;
  }

  return (
    <UpgradePromptDialog open={open} onOpenChange={setOpen} kind={kind} />
  );
}
