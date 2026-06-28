"use client";

import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IssueDetailSlotProps } from "@/components/issue-detail/slots";

const NONE = "none";

/** Issue-detail sidebar slot (Track K): assign the issue to an epic in its project. */
export function IssueEpicPanel({ issue }: IssueDetailSlotProps) {
  const epics = useQuery(
    api.epics.listByProject,
    issue.projectId ? { projectId: issue.projectId } : "skip"
  );
  const updateIssue = useMutation(api.issues.update);

  const updateEpic = (value: string) => {
    updateIssue({
      issueId: issue._id,
      epicId: value === NONE ? null : (value as Id<"epics">),
    }).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to update epic");
    });
  };

  if (!issue.projectId) {
    return (
      <section className="mb-5">
        <h3 className="text-xs font-medium text-muted-foreground">Epic</h3>
        <p className="pt-1 text-xs text-muted-foreground/60">
          Add this issue to a project to assign an epic.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-5">
      <div className="flex h-6 items-center justify-between">
        <h3 className="text-xs font-medium text-muted-foreground">Epic</h3>
      </div>
      <Select value={issue.epicId ?? NONE} onValueChange={updateEpic}>
        <SelectTrigger size="sm" className="mt-1 w-full border-none shadow-none">
          <SelectValue placeholder="No epic" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>
            <span className="text-muted-foreground">No epic</span>
          </SelectItem>
          {epics?.map((epic) => (
            <SelectItem key={epic._id} value={epic._id}>
              <span className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: epic.color ?? "#5e6ad2" }}
                />
                {epic.title}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </section>
  );
}
