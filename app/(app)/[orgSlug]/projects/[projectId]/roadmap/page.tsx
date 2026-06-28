"use client";

import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TimelineView } from "@/components/roadmaps/timeline-view";

/** Project roadmap — horizontal epic timeline. */
export default function ProjectRoadmapPage() {
  const params = useParams<{ orgSlug: string; projectId: string }>();
  const projectId = params.projectId as Id<"projects">;
  const project = useQuery(api.projects.get, { projectId });

  if (project === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Project not found.
      </div>
    );
  }

  return <TimelineView project={project} />;
}
