import { cn } from "@/lib/utils";
import { completionPercent, IssueProgress } from "./project-meta";

/**
 * Segmented issue-progress bar: done (success) → in review (info) →
 * in progress (warning) over a muted track. Canceled issues are excluded.
 */
export function IssueProgressBar({
  progress,
  className,
  showPercent = false,
}: {
  progress: IssueProgress;
  className?: string;
  showPercent?: boolean;
}) {
  const denominator = progress.total - progress.canceled;
  const widthOf = (count: number) =>
    denominator > 0 ? (count / denominator) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="bg-success"
          style={{ width: `${widthOf(progress.done)}%` }}
        />
        <div
          className="bg-info"
          style={{ width: `${widthOf(progress.in_review)}%` }}
        />
        <div
          className="bg-warning"
          style={{ width: `${widthOf(progress.in_progress)}%` }}
        />
      </div>
      {showPercent && (
        <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {completionPercent(progress)}%
        </span>
      )}
    </div>
  );
}
