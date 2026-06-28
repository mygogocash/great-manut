"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowUpRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/shared/user-avatar";
import { IDEA_STATUSES, IdeaStatus, SCORE_OPTIONS } from "./idea-meta";
import { PromoteDialog } from "./promote-dialog";

type IdeaDoc = Doc<"ideas"> & { promotedIssueKey?: string };

function IdeaDetailForm({
  idea,
  onClose,
}: {
  idea: IdeaDoc;
  onClose: () => void;
}) {
  const params = useParams<{ orgSlug: string }>();
  const members = useQuery(api.organizations.listMembers, {});
  const updateIdea = useMutation(api.ideas.update);
  const removeIdea = useMutation(api.ideas.remove);

  const [title, setTitle] = useState(idea.title);
  const [description, setDescription] = useState(idea.description ?? "");
  const [status, setStatus] = useState<IdeaStatus>(idea.status);
  const [impact, setImpact] = useState(idea.impact);
  const [effort, setEffort] = useState(idea.effort);
  const [ownerId, setOwnerId] = useState<string | undefined>(idea.ownerId);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateIdea({
        ideaId: idea._id,
        title,
        description,
        status,
        impact,
        effort,
        ownerId: ownerId ? (ownerId as Id<"users">) : null,
      });
      toast.success("Idea updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update idea"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await removeIdea({ ideaId: idea._id });
      toast.success("Idea deleted");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete idea"
      );
    }
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto py-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-none px-0 text-lg font-medium shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description…"
          className="min-h-24 resize-none"
        />
        <div className="flex flex-wrap gap-2">
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as IdeaStatus)}
          >
            <SelectTrigger size="sm" className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IDEA_STATUSES.map((s) => (
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
              <SelectValue />
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
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCORE_OPTIONS.map((score) => (
                <SelectItem key={score} value={String(score)}>
                  Effort {score}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={ownerId ?? "none"}
            onValueChange={(value) =>
              setOwnerId(value === "none" ? undefined : value)
            }
          >
            <SelectTrigger size="sm" className="w-auto">
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No owner</SelectItem>
              {members?.map((member) => (
                <SelectItem key={member.userId} value={member.userId}>
                  <UserAvatar name={member.name} imageUrl={member.imageUrl} />
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {idea.promotedIssueKey ? (
          <Link
            href={`/${params.orgSlug}/issue/${idea.promotedIssueId}`}
            className="inline-flex w-fit items-center gap-1 rounded border bg-muted/50 px-2 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            {idea.promotedIssueKey}
            <ArrowUpRight className="size-3" />
          </Link>
        ) : null}
      </div>
      <div className="flex items-center justify-between border-t pt-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => void handleDelete()}
        >
          <Trash2 className="size-3.5" />
          Delete
        </Button>
        <div className="flex gap-2">
          {!idea.promotedIssueId ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPromoteOpen(true)}
            >
              Promote to issue
            </Button>
          ) : null}
          <Button
            size="sm"
            disabled={!title.trim() || saving}
            onClick={() => void handleSave()}
          >
            Save
          </Button>
        </div>
      </div>
      <PromoteDialog
        idea={idea}
        open={promoteOpen}
        onOpenChange={setPromoteOpen}
      />
    </>
  );
}

export function IdeaDetailSheet({
  idea,
  open,
  onOpenChange,
}: {
  idea: IdeaDoc | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-sm font-medium text-muted-foreground">
            Idea details
          </SheetTitle>
        </SheetHeader>
        {idea ? (
          <IdeaDetailForm
            key={idea._id}
            idea={idea}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
