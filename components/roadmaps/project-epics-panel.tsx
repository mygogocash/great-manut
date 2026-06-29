"use client";

import { useMutation, useQuery } from "convex/react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { IssueProgressBar } from "@/components/projects/progress-bar";
import { DEFAULT_PROJECT_COLOR } from "@/components/projects/project-meta";
import { cn } from "@/lib/utils";

function epicProgressPercent(doneCount: number, issueCount: number): number {
  if (issueCount <= 0) {
    return 0;
  }
  return Math.round((doneCount / issueCount) * 100);
}

function epicProgressShape(doneCount: number, issueCount: number) {
  const open = Math.max(issueCount - doneCount, 0);
  return {
    total: issueCount,
    backlog: 0,
    todo: open,
    in_progress: 0,
    in_review: 0,
    done: doneCount,
    canceled: 0,
  };
}

function EpicRow({
  epic,
  onRemove,
}: {
  epic: {
    _id: Id<"epics">;
    title: string;
    description?: string;
    color?: string;
    doneCount: number;
    issueCount: number;
  };
  onRemove: (epicId: Id<"epics">) => void;
}) {
  const percent = epicProgressPercent(epic.doneCount, epic.issueCount);

  return (
    <div className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: epic.color ?? DEFAULT_PROJECT_COLOR }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{epic.title}</p>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {epic.doneCount}/{epic.issueCount} done · {percent}%
          </span>
        </div>
        {epic.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {epic.description}
          </p>
        )}
        <IssueProgressBar
          className="mt-2"
          progress={epicProgressShape(epic.doneCount, epic.issueCount)}
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground"
        aria-label={`Remove epic ${epic.title}`}
        onClick={() => onRemove(epic._id)}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

/** Project epics list with create/remove and done-based progress. */
export function ProjectEpicsPanel({
  project,
}: {
  project: Doc<"projects">;
}) {
  const epics = useQuery(api.epics.listByProject, { projectId: project._id });
  const createEpic = useMutation(api.epics.create);
  const removeEpic = useMutation(api.epics.remove);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    setSubmitting(true);
    try {
      await createEpic({
        projectId: project._id,
        title: trimmed,
        description: description.trim() || undefined,
      });
      toast.success("Epic created");
      setOpen(false);
      setTitle("");
      setDescription("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create epic");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = (epicId: Id<"epics">) => {
    removeEpic({ epicId }).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to remove epic");
    });
  };

  return (
    <>
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">Epics</span>
        <Button size="sm" variant="outline" className="h-7" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" />
          New epic
        </Button>
      </div>

      {epics === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : epics.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-sm text-muted-foreground">No epics yet.</p>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" />
            Create epic
          </Button>
        </div>
      ) : (
        <ScrollArea className={cn("max-h-[420px]")}>
          {epics.map((epic) => (
            <EpicRow key={epic._id} epic={epic} onRemove={handleRemove} />
          ))}
        </ScrollArea>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New epic</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="epic-title">Title</Label>
              <Input
                id="epic-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Epic title"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="epic-description">Description</Label>
              <Textarea
                id="epic-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!title.trim() || submitting} onClick={() => void handleCreate()}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
