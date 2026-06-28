"use client";

import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { StatusIcon } from "@/components/shared/status-icon";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  BOARD_COLUMNS,
  type MockIssue,
} from "@/components/marketing/mock-data";
import { MockFrame, MockWindowBar } from "@/components/marketing/mock-window";
import { cn } from "@/lib/utils";
import type { IssueStatus } from "@/components/shared/issue-meta";

const COLUMN_PREFIX = "column:";

type ColumnState = Record<IssueStatus, MockIssue[]>;

function buildInitialColumns(): ColumnState {
  const columns = {} as ColumnState;
  for (const column of BOARD_COLUMNS) {
    columns[column.status] = [...column.issues];
  }
  return columns;
}

function findColumnForIssue(
  columns: ColumnState,
  issueId: string,
): IssueStatus | null {
  for (const status of Object.keys(columns) as IssueStatus[]) {
    if (columns[status].some((issue) => issue.id === issueId)) {
      return status;
    }
  }
  return null;
}

type MockBoardProps = {
  className?: string;
  selectedIssueId?: string | null;
  onSelectIssue?: (issueId: string | null) => void;
};

/** Kanban board mock with drag-and-drop and selectable cards. */
export function MockBoard({
  className,
  selectedIssueId = null,
  onSelectIssue,
}: MockBoardProps) {
  const [columns, setColumns] = useState<ColumnState>(buildInitialColumns);
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const issueById = useMemo(() => {
    const map = new Map<string, MockIssue>();
    for (const issues of Object.values(columns)) {
      for (const issue of issues) {
        map.set(issue.id, issue);
      }
    }
    return map;
  }, [columns]);

  const activeIssue = activeIssueId ? issueById.get(activeIssueId) : undefined;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveIssueId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveIssueId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    setColumns((prev) => {
      const sourceCol = findColumnForIssue(prev, activeId);
      if (!sourceCol) {
        return prev;
      }

      let destCol = sourceCol;
      if (overId.startsWith(COLUMN_PREFIX)) {
        destCol = overId.slice(COLUMN_PREFIX.length) as IssueStatus;
      } else {
        const overCol = findColumnForIssue(prev, overId);
        if (overCol) {
          destCol = overCol;
        }
      }

      if (sourceCol === destCol && !overId.startsWith(COLUMN_PREFIX)) {
        const items = [...prev[sourceCol]];
        const oldIndex = items.findIndex((issue) => issue.id === activeId);
        const newIndex = items.findIndex((issue) => issue.id === overId);
        if (oldIndex === -1 || newIndex === -1) {
          return prev;
        }
        return { ...prev, [sourceCol]: arrayMove(items, oldIndex, newIndex) };
      }

      const sourceItems = [...prev[sourceCol]];
      const fromIndex = sourceItems.findIndex((issue) => issue.id === activeId);
      if (fromIndex === -1) {
        return prev;
      }

      const [item] = sourceItems.splice(fromIndex, 1);
      const updated = { ...item, status: destCol };
      const destItems =
        sourceCol === destCol ? sourceItems : [...prev[destCol]];

      const toIndex = overId.startsWith(COLUMN_PREFIX)
        ? destItems.length
        : destItems.findIndex((issue) => issue.id === overId);
      destItems.splice(toIndex >= 0 ? toIndex : destItems.length, 0, updated);

      return {
        ...prev,
        [sourceCol]: sourceItems,
        [destCol]: destItems,
      };
    });
  };

  const handleDragCancel = () => {
    setActiveIssueId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <MockFrame className={className}>
        <MockWindowBar title="Engineering · Board" />
        <div className="grid grid-cols-2 gap-3 bg-muted/20 p-3 lg:grid-cols-4">
          {BOARD_COLUMNS.map((column, columnIndex) => (
            <MockBoardColumn
              key={column.status}
              status={column.status}
              label={column.label}
              issues={columns[column.status]}
              hiddenOnMobile={columnIndex >= 2}
              selectedIssueId={selectedIssueId}
              onSelectIssue={onSelectIssue}
            />
          ))}
        </div>
      </MockFrame>
      <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
        {activeIssue ? (
          <MockBoardCard issue={activeIssue} dragging overlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function MockBoardColumn({
  status,
  label,
  issues,
  hiddenOnMobile,
  selectedIssueId,
  onSelectIssue,
}: {
  status: IssueStatus;
  label: string;
  issues: MockIssue[];
  hiddenOnMobile?: boolean;
  selectedIssueId?: string | null;
  onSelectIssue?: (issueId: string | null) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${COLUMN_PREFIX}${status}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "space-y-2 rounded-lg transition-colors",
        hiddenOnMobile && "hidden lg:block",
        isOver && "bg-primary/5 ring-1 ring-primary/20",
      )}
    >
      <div className="flex items-center gap-1.5 px-1">
        <StatusIcon status={status} className="size-3.5" />
        <span className="text-xs font-medium">{label}</span>
        <span className="text-[11px] text-muted-foreground">{issues.length}</span>
      </div>
      <SortableContext
        items={issues.map((issue) => issue.id)}
        strategy={verticalListSortingStrategy}
      >
        {issues.map((issue) => (
          <SortableMockBoardCard
            key={issue.id}
            issue={issue}
            selected={selectedIssueId === issue.id}
            onSelect={() =>
              onSelectIssue?.(selectedIssueId === issue.id ? null : issue.id)
            }
          />
        ))}
      </SortableContext>
      <button
        type="button"
        className="flex h-7 w-full items-center justify-center rounded-lg border border-dashed text-[11px] text-muted-foreground/60 transition-colors hover:border-muted-foreground/40 hover:bg-muted/40 hover:text-muted-foreground"
      >
        + Add issue
      </button>
    </div>
  );
}

function SortableMockBoardCard({
  issue,
  selected,
  onSelect,
}: {
  issue: MockIssue;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={cn(isDragging && "opacity-40")}
    >
      <MockBoardCard issue={issue} selected={selected} />
    </div>
  );
}

function MockBoardCard({
  issue,
  dragging,
  overlay,
  selected,
}: {
  issue: MockIssue;
  dragging?: boolean;
  overlay?: boolean;
  selected?: boolean;
}) {
  return (
    <div
      className={cn(
        "cursor-grab space-y-2 rounded-lg border bg-card p-2.5 transition-[box-shadow,transform,border-color] active:cursor-grabbing",
        "hover:border-ring/50 hover:shadow-md hover:shadow-black/10",
        dragging && "-rotate-2 border-ring shadow-lg shadow-black/20",
        overlay && "rotate-2 shadow-xl shadow-black/25",
        selected && "border-primary ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-muted-foreground">
          {issue.id}
        </span>
        {issue.assignee ? (
          <UserAvatar name={issue.assignee} className="size-4" />
        ) : null}
      </div>
      <p className="line-clamp-2 text-xs leading-snug font-medium">
        {issue.title}
      </p>
      <div className="flex items-center gap-1.5">
        <PriorityIcon priority={issue.priority} className="size-3" />
        {issue.label ? (
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: issue.label.color }}
          />
        ) : null}
        <span className="text-[10px] text-muted-foreground">Cycle 14</span>
      </div>
    </div>
  );
}
