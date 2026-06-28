"use client";

import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreateIdeaInline } from "./create-idea-dialog";
import { IdeaCard, IdeaCardContent } from "./idea-card";
import { IdeaStatus, KANBAN_STATUSES } from "./idea-meta";

export const IDEA_COLUMN_PREFIX = "idea-column:";

type IdeaDoc = Doc<"ideas"> & { promotedIssueKey?: string };
type Columns = Record<IdeaStatus, Id<"ideas">[]>;

const STATUS_SET = new Set<string>(KANBAN_STATUSES.map((s) => s.value));

function emptyColumns(): Columns {
  return {
    new: [],
    shortlisted: [],
    planned: [],
    shipped: [],
    dropped: [],
  };
}

function statusFromDroppableId(id: UniqueIdentifier): IdeaStatus | null {
  if (typeof id !== "string" || !id.startsWith(IDEA_COLUMN_PREFIX)) {
    return null;
  }
  const status = id.slice(IDEA_COLUMN_PREFIX.length);
  return STATUS_SET.has(status) ? (status as IdeaStatus) : null;
}

function findContainer(
  columns: Columns,
  id: UniqueIdentifier
): IdeaStatus | null {
  for (const { value } of KANBAN_STATUSES) {
    if (columns[value].includes(id as Id<"ideas">)) {
      return value;
    }
  }
  return null;
}

function IdeaColumn({
  status,
  label,
  ideas,
  onOpenIdea,
}: {
  status: IdeaStatus;
  label: string;
  ideas: IdeaDoc[];
  onOpenIdea: (idea: IdeaDoc) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${IDEA_COLUMN_PREFIX}${status}`,
    data: { type: "column", status },
  });
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <div className="flex max-h-full w-72 shrink-0 flex-col rounded-lg bg-muted/40">
      <div className="flex h-10 shrink-0 items-center gap-2 px-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{ideas.length}</span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-6 text-muted-foreground"
          onClick={() => setComposerOpen(true)}
          aria-label={`New ${label} idea`}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      <SortableContext
        items={ideas.map((idea) => idea._id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-16 flex-1 flex-col gap-2 overflow-y-auto rounded-b-lg p-2 pt-0 transition-colors",
            isOver && "bg-accent/40"
          )}
        >
          {composerOpen ? (
            <CreateIdeaInline
              defaultStatus={status}
              onClose={() => setComposerOpen(false)}
            />
          ) : null}
          {ideas.map((idea) => (
            <IdeaCard
              key={idea._id}
              idea={idea}
              onOpen={() => onOpenIdea(idea)}
            />
          ))}
          {ideas.length === 0 && !composerOpen ? (
            <button
              onClick={() => setComposerOpen(true)}
              className="flex h-14 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground/70 transition-colors hover:border-muted-foreground/40 hover:text-muted-foreground"
            >
              Drop ideas here or click to add
            </button>
          ) : null}
        </div>
      </SortableContext>
    </div>
  );
}

export function IdeasBoard({
  ideas,
  onOpenIdea,
}: {
  ideas: IdeaDoc[];
  onOpenIdea: (idea: IdeaDoc) => void;
}) {
  const updateIdea = useMutation(api.ideas.update).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.ideas.list, {});
      if (!current || args.status === undefined) {
        return;
      }
      localStore.setQuery(
        api.ideas.list,
        {},
        current.map((idea) =>
          idea._id === args.ideaId ? { ...idea, status: args.status! } : idea
        )
      );
    }
  );

  const ideaById = useMemo(
    () => new Map(ideas.map((idea) => [idea._id, idea])),
    [ideas]
  );

  const columns = useMemo(() => {
    const next = emptyColumns();
    for (const idea of ideas) {
      if (idea.status === "dropped") {
        continue;
      }
      next[idea.status].push(idea._id);
    }
    return next;
  }, [ideas]);

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const activeIdea = activeId ? ideaById.get(activeId as Id<"ideas">) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeContainer = findContainer(columns, active.id);
    let overContainer = findContainer(columns, over.id);
    if (!overContainer) {
      overContainer = statusFromDroppableId(over.id);
    }
    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    try {
      await updateIdea({
        ideaId: active.id as Id<"ideas">,
        status: overContainer,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to move idea"
      );
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(event: DragStartEvent) => setActiveId(event.active.id)}
      onDragEnd={(event) => void handleDragEnd(event)}
    >
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-4">
        {KANBAN_STATUSES.map(({ value, label }) => (
          <IdeaColumn
            key={value}
            status={value}
            label={label}
            ideas={columns[value]
              .map((id) => ideaById.get(id))
              .filter((idea): idea is IdeaDoc => idea !== undefined)}
            onOpenIdea={onOpenIdea}
          />
        ))}
      </div>
      <DragOverlay>
        {activeIdea ? <IdeaCardContent idea={activeIdea} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
