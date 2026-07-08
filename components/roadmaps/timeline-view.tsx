"use client";

import { useMutation, useQuery } from "convex/react";
import { ChevronRight, Loader2, Map } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DAY_MS } from "@/components/projects/dates";
import { DEFAULT_PROJECT_COLOR } from "@/components/projects/project-meta";
import { readableForeground } from "@/lib/colors";
import { cn } from "@/lib/utils";

const MONTH_MS = DAY_MS * 30;
const TIMELINE_PADDING_DAYS = 14;

type TimelineEpic = {
  _id: Id<"epics">;
  title: string;
  color?: string;
  startDate?: number;
  targetDate?: number;
};

function monthLabel(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function EpicBar({
  epic,
  rangeStart,
  rangeEnd,
  onDragEnd,
}: {
  epic: TimelineEpic;
  rangeStart: number;
  rangeEnd: number;
  onDragEnd: (epicId: Id<"epics">, targetDate: number) => void;
}) {
  const rangeMs = rangeEnd - rangeStart;
  const start = epic.startDate ?? epic.targetDate ?? rangeStart;
  const end = epic.targetDate ?? start + DAY_MS * 14;
  const left = ((start - rangeStart) / rangeMs) * 100;
  const dragging = useRef(false);
  const [previewEnd, setPreviewEnd] = useState<number | null>(null);

  const displayEnd = previewEnd ?? end;
  const barColor = epic.color ?? DEFAULT_PROJECT_COLOR;
  const labelColor = readableForeground(barColor);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) {
      return;
    }
    const track = event.currentTarget.parentElement;
    if (!track) {
      return;
    }
    const rect = track.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const nextEnd = rangeStart + ratio * rangeMs;
    setPreviewEnd(Math.max(nextEnd, start + DAY_MS));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) {
      return;
    }
    dragging.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (previewEnd !== null) {
      onDragEnd(epic._id, previewEnd);
      setPreviewEnd(null);
    }
  };

  return (
    <div className="relative h-8">
      <div
        className="absolute top-1/2 h-6 -translate-y-1/2 rounded-md"
        style={{
          left: `${left}%`,
          width: `${Math.max(((displayEnd - start) / rangeMs) * 100, 2)}%`,
          backgroundColor: barColor,
        }}
      >
        <span
          className="absolute inset-y-0 left-2 flex items-center truncate pr-6 text-[10px] font-medium"
          style={{ color: labelColor }}
        >
          {epic.title}
        </span>
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label={`Drag to change end date for ${epic.title}`}
          className="absolute top-0 right-0 h-full w-2 cursor-ew-resize rounded-r-md"
          style={{
            backgroundColor:
              labelColor === "#ffffff"
                ? "rgba(255,255,255,0.3)"
                : "rgba(0,0,0,0.2)",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>
    </div>
  );
}

/** Horizontal project roadmap timeline with draggable epic end dates. */
export function TimelineView({ project }: { project: Doc<"projects"> }) {
  const params = useParams<{ orgSlug: string }>();
  const epics = useQuery(api.epics.listByProject, { projectId: project._id });
  const updateDates = useMutation(api.epics.updateDates);
  const { rangeStart, rangeEnd, months } = useMemo(() => {
    const dated = [
      project.targetDate,
      project._creationTime,
      ...(epics ?? []).flatMap((epic) => [epic.startDate, epic.targetDate]),
    ].filter((value): value is number => value !== undefined);

    const min =
      dated.length > 0 ? Math.min(...dated) : project._creationTime;
    const max =
      dated.length > 0
        ? Math.max(...dated)
        : project._creationTime + MONTH_MS * 3;

    const start = min - TIMELINE_PADDING_DAYS * DAY_MS;
    const end = max + TIMELINE_PADDING_DAYS * DAY_MS;

    const monthStarts: number[] = [];
    const cursor = new Date(start);
    cursor.setDate(1);
    while (cursor.getTime() <= end) {
      monthStarts.push(cursor.getTime());
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return { rangeStart: start, rangeEnd: end, months: monthStarts };
  }, [epics, project.targetDate, project._creationTime]);

  const handleDragEnd = useCallback(
    (epicId: Id<"epics">, targetDate: number) => {
      updateDates({ epicId, targetDate }).catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Failed to update dates");
      });
    },
    [updateDates]
  );

  const backlog = (epics ?? []).filter((epic) => !epic.startDate && !epic.targetDate);
  const scheduled = (epics ?? []).filter((epic) => epic.startDate || epic.targetDate);

  if (epics === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const rangeMs = rangeEnd - rangeStart;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center border-b px-4 text-sm">
        <div className="flex min-w-0 items-center gap-1.5">
          <Link
            href={`/${params.orgSlug}/projects`}
            className="text-muted-foreground hover:text-foreground"
          >
            Projects
          </Link>
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          <Link
            href={`/${params.orgSlug}/projects/${project._id}`}
            className="flex min-w-0 items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: project.color ?? DEFAULT_PROJECT_COLOR }}
            />
            <span className="truncate">{project.name}</span>
          </Link>
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="flex items-center gap-1.5 font-medium">
            <Map className="size-3.5 text-muted-foreground" />
            Roadmap
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <ScrollArea className="flex-1">
          <div className="min-w-[720px] p-6">
            <div className="relative mb-2 h-8 border-b">
              {months.map((monthStart) => {
                const left = ((monthStart - rangeStart) / rangeMs) * 100;
                return (
                  <div
                    key={monthStart}
                    className="absolute top-0 h-full border-l border-dashed border-border/60 pl-1"
                    style={{ left: `${left}%` }}
                  >
                    <span className="text-[10px] text-muted-foreground">
                      {monthLabel(monthStart)}
                    </span>
                  </div>
                );
              })}
            </div>

            {project.targetDate && (
              <div className="relative mb-4 h-6">
                <div
                  className="absolute top-0 h-full w-px bg-warning"
                  style={{
                    left: `${((project.targetDate - rangeStart) / rangeMs) * 100}%`,
                  }}
                />
                <span
                  className="absolute -top-0.5 text-[10px] text-warning"
                  style={{
                    left: `${((project.targetDate - rangeStart) / rangeMs) * 100}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  Project target
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {scheduled.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Drag epics from the backlog or set dates to populate the timeline.
                </p>
              ) : (
                scheduled.map((epic) => (
                  <EpicBar
                    key={epic._id}
                    epic={epic}
                    rangeStart={rangeStart}
                    rangeEnd={rangeEnd}
                    onDragEnd={handleDragEnd}
                  />
                ))
              )}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <aside className="w-56 shrink-0 border-l">
          <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
            Backlog
          </div>
          <ScrollArea className="h-full max-h-[calc(100vh-12rem)]">
            {backlog.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground">All epics scheduled.</p>
            ) : (
              backlog.map((epic) => (
                <button
                  key={epic._id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 border-b px-3 py-2 text-left text-xs hover:bg-muted/50"
                  )}
                  onClick={() => {
                    const now = Date.now();
                    updateDates({
                      epicId: epic._id,
                      startDate: now,
                      targetDate: now + DAY_MS * 14,
                    }).catch((error: unknown) => {
                      toast.error(
                        error instanceof Error ? error.message : "Failed to schedule epic"
                      );
                    });
                  }}
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: epic.color ?? DEFAULT_PROJECT_COLOR }}
                  />
                  <span className="truncate">{epic.title}</span>
                </button>
              ))
            )}
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
