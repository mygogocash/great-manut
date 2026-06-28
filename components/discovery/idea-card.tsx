"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowUpRight } from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type IdeaDoc = Doc<"ideas"> & { promotedIssueKey?: string };

export function IdeaCardContent({
  idea,
  overlay = false,
}: {
  idea: IdeaDoc;
  overlay?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-md border bg-card p-3 text-left shadow-xs transition-colors",
        overlay
          ? "border-primary/40 shadow-lg"
          : "hover:border-muted-foreground/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium leading-snug">
          {idea.title}
        </p>
        {idea.promotedIssueKey ? (
          <span className="inline-flex shrink-0 items-center gap-0.5 rounded border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {idea.promotedIssueKey}
            <ArrowUpRight className="size-2.5" />
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>Impact {idea.impact}</span>
        <span>·</span>
        <span>Effort {idea.effort}</span>
      </div>
    </div>
  );
}

export function IdeaCard({
  idea,
  onOpen,
}: {
  idea: IdeaDoc;
  onOpen: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: idea._id, data: { type: "idea-card" } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className={cn(
        "cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "opacity-40"
      )}
    >
      <IdeaCardContent idea={idea} />
    </div>
  );
}
