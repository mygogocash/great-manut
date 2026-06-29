"use client";

import { RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { CYCLE_BARS } from "@/components/marketing/mock-data";
import { cn } from "@/lib/utils";

type MockCycleProps = {
  className?: string;
  highlighted?: boolean;
  activeDay?: number | null;
  onActiveDayChange?: (day: number | null) => void;
};

/**
 * Compact cycle progress card with a scrubbable burnup chart.
 */
export function MockCycle({
  className,
  highlighted = false,
  activeDay: activeDayProp,
  onActiveDayChange,
}: MockCycleProps) {
  const [internalDay, setInternalDay] = useState<number | null>(null);
  const activeDay = activeDayProp ?? internalDay;
  const setActiveDay = onActiveDayChange ?? setInternalDay;

  const scope = 38;
  const dayIndex =
    activeDay ?? CYCLE_BARS.length - 1;
  const completed = CYCLE_BARS[dayIndex] ?? CYCLE_BARS[CYCLE_BARS.length - 1];
  const percent = Math.round((completed / scope) * 100);
  const max = Math.max(...CYCLE_BARS);

  const dayLabel = useMemo(() => {
    const start = new Date(2026, 5, 2);
    const date = new Date(start);
    date.setDate(start.getDate() + dayIndex);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, [dayIndex]);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm transition-[box-shadow,border-color]",
        highlighted && "border-primary/40 shadow-md shadow-primary/5",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <RefreshCcw className="size-3.5 text-muted-foreground" />
        <span className="text-sm font-medium">Cycle 14</span>
        <span className="text-xs text-muted-foreground">Jun 2 – Jun 16</span>
        <span className="ml-auto font-mono text-xs text-success">
          {percent}%
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-success transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-foreground/30" />
          Scope {scope}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-warning" />
          Started 7
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-success" />
          Completed {completed}
        </span>
      </div>
      <div
        className="mt-4 flex h-12 items-end gap-1"
        role="group"
        aria-label="Cycle burnup chart"
        onMouseLeave={() => setActiveDay(null)}
      >
        {CYCLE_BARS.map((value, index) => {
          const isActive = index === dayIndex;
          return (
            <button
              key={index}
              type="button"
              aria-label={`Day ${index + 1}: ${value} completed`}
              aria-pressed={isActive}
              className={cn(
                "flex-1 rounded-sm transition-[height,background-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-success"
                  : "bg-foreground/10 hover:bg-success/40",
                isActive && "scale-y-105",
              )}
              style={{ height: `${Math.max(8, (value / max) * 100)}%` }}
              onMouseEnter={() => setActiveDay(index)}
              onFocus={() => setActiveDay(index)}
              onBlur={() => setActiveDay(null)}
            />
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        {activeDay !== null ? (
          <>
            <span className="font-medium text-foreground">{dayLabel}</span>
            {" · "}
            {completed} issues completed
          </>
        ) : (
          "Hover the chart to scrub progress · unfinished issues roll into Cycle 15"
        )}
      </p>
    </div>
  );
}
