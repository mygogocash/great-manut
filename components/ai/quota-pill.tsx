"use client";

import { cn } from "@/lib/utils";

export type AiQuota = {
  hasAccess: boolean;
  aiMode: "managed" | "byok";
  unlimited: boolean;
  balance: number;
};

/** Credit balance indicator for managed mode; hidden for BYOK. */
export function QuotaPill({ quota }: { quota: AiQuota | undefined }) {
  if (!quota || !quota.hasAccess || quota.unlimited) {
    return null;
  }
  const exhausted = quota.balance <= 0;
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground",
        exhausted && "border-destructive/40 text-destructive"
      )}
    >
      {quota.balance.toFixed(1)} credits
    </span>
  );
}
