"use client";

import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { AiAgentPage } from "@/components/ai/ai-agent-page";
import { parseWorkspaceRoute } from "@/lib/workspace-routes";
import { CyclesIndexView } from "./views/cycles-index";
import { ProjectsIndexView } from "./views/projects-index";
import { SearchIndexView } from "./views/search-index";
import { TeamBoardView } from "./views/team-board";
import { TeamIssuesView } from "./views/team-issues";
import { WorkspaceHomeView } from "./views/workspace-home";

/**
 * Single client router for all sidebar workspace routes.
 *
 * Keeping these views on one page module avoids a ~1s RSC round-trip through
 * Cloudflare Workers on every sidebar click.
 */
export function WorkspaceRouteView() {
  const params = useParams<{ orgSlug: string; section?: string[] }>();
  const route = parseWorkspaceRoute(params.section);

  switch (route.kind) {
    case "home":
      return <WorkspaceHomeView />;
    case "projects":
      return <ProjectsIndexView />;
    case "cycles":
      return <CyclesIndexView />;
    case "ai":
      return <AiAgentPage />;
    case "search":
      return <SearchIndexView />;
    case "team":
      return <TeamIssuesView teamId={route.teamId as Id<"teams">} />;
    case "team-board":
      return <TeamBoardView teamId={route.teamId as Id<"teams">} />;
    case "unknown":
      return (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Page not found.
        </div>
      );
    default: {
      const _exhaustive: never = route;
      return _exhaustive;
    }
  }
}
