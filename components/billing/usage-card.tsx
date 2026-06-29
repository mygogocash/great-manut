"use client";

import { useQuery } from "convex/react";
import { TriangleAlert } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { formatStorageGb, storageIncludedBytes } from "@/lib/usage-pricing";
import { planForOrg } from "@/lib/plans";
import { cn } from "@/lib/utils";

function UsageRow({
  label,
  used,
  cap,
  formatValue,
}: {
  label: string;
  used: number | null;
  cap: number;
  formatValue: (n: number) => string;
}) {
  const ratio = used !== null ? used / cap : 0;
  const atLimit = used !== null && used >= cap;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        {used === null ? (
          <Skeleton className="h-3 w-16" />
        ) : (
          <span
            className={cn(
              "font-medium tabular-nums",
              atLimit && "text-destructive"
            )}
          >
            {formatValue(used)}
            <span className="font-normal text-muted-foreground">
              {" "}
              / {formatValue(cap)}
            </span>
          </span>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-[width]",
            ratio >= 0.8 && "bg-amber-500",
            ratio >= 1 && "bg-destructive"
          )}
          style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
        />
      </div>
    </div>
  );
}

export function UsageCard({ org }: { org: Doc<"organizations"> }) {
  const plan = planForOrg(org.plan);
  const usage = useQuery(api.usage.getOrgUsage);

  const included = storageIncludedBytes(org.plan);
  const storageUsed = usage?.storageBytesUsed ?? org.storageBytesUsed ?? 0;
  const atStorageCap =
    org.plan === "free" && storageUsed >= included;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium">Usage</h2>
        <p className="text-xs text-muted-foreground">
          Storage and AI for the {org.name} workspace on {plan.name}.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
        <UsageRow
          label="Attachment storage"
          used={usage ? usage.storageBytesUsed : null}
          cap={included}
          formatValue={formatStorageGb}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">AI credits</span>
            {usage === undefined ? (
              <Skeleton className="h-3 w-12" />
            ) : (
              <span className="font-medium tabular-nums">
                {usage.aiCreditBalance.toFixed(1)}
                <span className="font-normal text-muted-foreground">
                  {" "}
                  · {usage.aiMode === "byok" ? "BYOK" : "managed"}
                </span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Top up in AI settings or connect your provider key. Credits never
            expire.
          </p>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Members</span>
          {usage === undefined ? (
            <Skeleton className="h-3 w-8" />
          ) : (
            <span className="font-medium tabular-nums">
              {usage.memberCount} · unlimited
            </span>
          )}
        </div>

        {usage && usage.storageOverageBytes > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Est. storage overage this period: ~$
            {usage.estimatedStorageOverageUsd.toFixed(2)}
          </p>
        )}

        {atStorageCap && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Storage is full on Free. Upgrade to Business for{" "}
              {formatStorageGb(storageIncludedBytes("business"))} and metered
              overage.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
