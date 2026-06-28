"use client";

import { useMutation, useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
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

type IdeaDoc = Doc<"ideas"> & { promotedIssueKey?: string };

const NO_PROJECT = "no-project";
const NO_CYCLE = "no-cycle";

function PromoteForm({
  idea,
  onClose,
}: {
  idea: IdeaDoc;
  onClose: () => void;
}) {
  const params = useParams<{ orgSlug: string }>();
  const router = useRouter();
  const teams = useQuery(api.teams.list, {});
  const projects = useQuery(api.projects.list, {});
  const promote = useMutation(api.ideas.promote);

  const [teamId, setTeamId] = useState<Id<"teams"> | undefined>(
    idea.teamId ?? teams?.[0]?._id
  );
  const [projectId, setProjectId] = useState<Id<"projects"> | undefined>(
    idea.projectId
  );
  const [cycleId, setCycleId] = useState<Id<"cycles"> | undefined>(undefined);
  const [title, setTitle] = useState(idea.title);
  const [submitting, setSubmitting] = useState(false);

  const resolvedTeamId = teamId ?? teams?.[0]?._id;
  const cycles = useQuery(
    api.cycles.listByTeam,
    resolvedTeamId ? { teamId: resolvedTeamId } : "skip"
  );

  const handlePromote = async () => {
    if (!resolvedTeamId) {
      toast.error("Select a team");
      return;
    }
    setSubmitting(true);
    try {
      const issueId = await promote({
        ideaId: idea._id,
        teamId: resolvedTeamId,
        title,
        projectId,
        cycleId,
      });
      toast.success("Idea promoted to issue");
      onClose();
      router.push(`/${params.orgSlug}/issue/${issueId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to promote idea"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Issue title"
          className="text-sm"
        />
        <Select
          value={resolvedTeamId}
          onValueChange={(value) => {
            setTeamId(value as Id<"teams">);
            setCycleId(undefined);
          }}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            {teams?.map((team) => (
              <SelectItem key={team._id} value={team._id}>
                {team.name} ({team.key})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={projectId ?? NO_PROJECT}
          onValueChange={(value) =>
            setProjectId(
              value === NO_PROJECT ? undefined : (value as Id<"projects">)
            )
          }
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Project (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PROJECT}>No project</SelectItem>
            {projects?.map((project) => (
              <SelectItem key={project._id} value={project._id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={cycleId ?? NO_CYCLE}
          onValueChange={(value) =>
            setCycleId(
              value === NO_CYCLE ? undefined : (value as Id<"cycles">)
            )
          }
          disabled={!resolvedTeamId}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Cycle (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_CYCLE}>No cycle</SelectItem>
            {cycles?.map((cycle) => (
              <SelectItem key={cycle._id} value={cycle._id}>
                Cycle {cycle.number}
                {cycle.name ? ` · ${cycle.name}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!resolvedTeamId || !title.trim() || submitting}
          onClick={() => void handlePromote()}
        >
          Promote
        </Button>
      </div>
    </>
  );
}

export function PromoteDialog({
  idea,
  open,
  onOpenChange,
}: {
  idea: IdeaDoc;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium text-muted-foreground">
            Promote to issue
          </DialogTitle>
        </DialogHeader>
        {open ? (
          <PromoteForm idea={idea} onClose={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
