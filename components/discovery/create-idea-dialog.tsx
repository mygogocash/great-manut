"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IdeaStatus, KANBAN_STATUSES, SCORE_OPTIONS } from "./idea-meta";

export function CreateIdeaDialog({
  open,
  onOpenChange,
  defaultStatus = "new",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: IdeaStatus;
}) {
  const createIdea = useMutation(api.ideas.create);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IdeaStatus>(defaultStatus);
  const [impact, setImpact] = useState<number>(3);
  const [effort, setEffort] = useState<number>(3);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle("");
    setDescription("");
    setStatus(defaultStatus);
    setImpact(3);
    setEffort(3);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      await createIdea({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        impact,
        effort,
      });
      toast.success("Idea created");
      onOpenChange(false);
      reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create idea"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium text-muted-foreground">
            New idea
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            autoFocus
            placeholder="Idea title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-none px-0 text-lg font-medium shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <Textarea
            placeholder="Describe the opportunity…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-20 resize-none border-none px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as IdeaStatus)}
            >
              <SelectTrigger size="sm" className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KANBAN_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(impact)}
              onValueChange={(value) => setImpact(Number(value))}
            >
              <SelectTrigger size="sm" className="w-auto">
                <SelectValue placeholder="Impact" />
              </SelectTrigger>
              <SelectContent>
                {SCORE_OPTIONS.map((score) => (
                  <SelectItem key={score} value={String(score)}>
                    Impact {score}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(effort)}
              onValueChange={(value) => setEffort(Number(value))}
            >
              <SelectTrigger size="sm" className="w-auto">
                <SelectValue placeholder="Effort" />
              </SelectTrigger>
              <SelectContent>
                {SCORE_OPTIONS.map((score) => (
                  <SelectItem key={score} value={String(score)}>
                    Effort {score}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!title.trim() || submitting}
            onClick={() => void handleSubmit()}
          >
            Create idea
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CreateIdeaInline({
  defaultStatus,
  onClose,
}: {
  defaultStatus: IdeaStatus;
  onClose: () => void;
}) {
  const createIdea = useMutation(api.ideas.create);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      await createIdea({ title: title.trim(), status: defaultStatus });
      toast.success("Idea created");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create idea"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-card p-2 shadow-xs">
      <Input
        autoFocus
        placeholder="Idea title…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            void handleSubmit();
          }
          if (e.key === "Escape") {
            onClose();
          }
        }}
        className="h-8 text-sm"
      />
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="sm" className="h-7" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          className="h-7"
          disabled={!title.trim() || submitting}
          onClick={() => void handleSubmit()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
