"use client";

import { useMutation } from "convex/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type IdeaDoc = Doc<"ideas"> & { promotedIssueKey?: string };

const PADDING = 48;
const MIN_SCORE = 1;
const MAX_SCORE = 5;

function scoreFromPosition(
  clientX: number,
  clientY: number,
  rect: DOMRect
): { impact: number; effort: number } {
  const innerWidth = rect.width - PADDING * 2;
  const innerHeight = rect.height - PADDING * 2;
  const x = Math.min(Math.max(clientX - rect.left - PADDING, 0), innerWidth);
  const y = Math.min(Math.max(clientY - rect.top - PADDING, 0), innerHeight);
  const effort = Math.round(
    MIN_SCORE + (x / innerWidth) * (MAX_SCORE - MIN_SCORE)
  );
  const impact = Math.round(
    MAX_SCORE - (y / innerHeight) * (MAX_SCORE - MIN_SCORE)
  );
  return {
    impact: Math.min(MAX_SCORE, Math.max(MIN_SCORE, impact)),
    effort: Math.min(MAX_SCORE, Math.max(MIN_SCORE, effort)),
  };
}

function positionFromScores(
  impact: number,
  effort: number,
  width: number,
  height: number
) {
  const innerWidth = width - PADDING * 2;
  const innerHeight = height - PADDING * 2;
  const x =
    PADDING + ((effort - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * innerWidth;
  const y =
    PADDING + ((MAX_SCORE - impact) / (MAX_SCORE - MIN_SCORE)) * innerHeight;
  return { x, y };
}

function MatrixDot({
  idea,
  containerSize,
  onSelect,
  onDragEnd,
}: {
  idea: IdeaDoc;
  containerSize: { width: number; height: number };
  onSelect: () => void;
  onDragEnd: (impact: number, effort: number) => void;
}) {
  const { x, y } = positionFromScores(
    idea.impact,
    idea.effort,
    containerSize.width,
    containerSize.height
  );
  const dragging = useRef(false);

  return (
    <button
      type="button"
      aria-label={idea.title}
      onClick={onSelect}
      onPointerDown={(event) => {
        dragging.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
          return;
        }
        dragging.current = true;
        const rect = event.currentTarget.parentElement!.getBoundingClientRect();
        const scores = scoreFromPosition(event.clientX, event.clientY, rect);
        onDragEnd(scores.impact, scores.effort);
      }}
      onPointerUp={(event) => {
        event.currentTarget.releasePointerCapture(event.pointerId);
        if (dragging.current) {
          dragging.current = false;
        }
      }}
      className={cn(
        "absolute z-10 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary shadow-sm transition-transform hover:scale-110",
        idea.promotedIssueKey && "ring-2 ring-primary/30"
      )}
      style={{ left: x, top: y }}
      title={`${idea.title} · Impact ${idea.impact} · Effort ${idea.effort}`}
    />
  );
}

export function IdeasMatrix({
  ideas,
  onOpenIdea,
}: {
  ideas: IdeaDoc[];
  onOpenIdea: (idea: IdeaDoc) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 640, height: 480 });
  const updateIdea = useMutation(api.ideas.update);

  const measure = useCallback(() => {
    if (!containerRef.current) {
      return;
    }
    setSize({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });
  }, []);

  const visibleIdeas = ideas.filter((idea) => idea.status !== "dropped");

  const handleDragEnd = async (
    idea: IdeaDoc,
    impact: number,
    effort: number
  ) => {
    if (idea.impact === impact && idea.effort === effort) {
      return;
    }
    try {
      await updateIdea({ ideaId: idea._id, impact, effort });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update scores"
      );
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4">
      <div
        ref={(node) => {
          containerRef.current = node;
          if (node) {
            measure();
          }
        }}
        className="relative min-h-[480px] flex-1 rounded-lg border bg-muted/20"
      >
        <div className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-2">
          <div className="border-b border-r border-dashed p-3 text-xs text-muted-foreground">
            High impact · Low effort
          </div>
          <div className="border-b border-dashed p-3 text-right text-xs text-muted-foreground">
            High impact · High effort
          </div>
          <div className="border-r border-dashed p-3 text-xs text-muted-foreground">
            Low impact · Low effort
          </div>
          <div className="p-3 text-right text-xs text-muted-foreground">
            Low impact · High effort
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
          Effort →
        </div>
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground">
          Impact →
        </div>
        {visibleIdeas.map((idea) => (
          <MatrixDot
            key={idea._id}
            idea={idea}
            containerSize={size}
            onSelect={() => onOpenIdea(idea)}
            onDragEnd={(impact, effort) =>
              void handleDragEnd(idea, impact, effort)
            }
          />
        ))}
      </div>
    </div>
  );
}
