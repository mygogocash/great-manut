"use client";

import { useQuery } from "convex/react";
import { LayoutGrid, Loader2, Plus, ScatterChart } from "lucide-react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreateIdeaDialog } from "./create-idea-dialog";
import { IdeaDetailSheet } from "./idea-detail-sheet";
import { IdeasBoard } from "./ideas-board";
import { IdeasMatrix } from "./ideas-matrix";

type IdeaDoc = Doc<"ideas"> & { promotedIssueKey?: string };
type ViewMode = "board" | "matrix";

export function DiscoveryPage() {
  const ideas = useQuery(api.ideas.list);
  const [view, setView] = useState<ViewMode>("board");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<IdeaDoc | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openIdea = (idea: IdeaDoc) => {
    setSelectedIdea(idea);
    setDetailOpen(true);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-12 shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-sm font-medium">Discovery</span>
          {ideas !== undefined ? (
            <span className="text-xs text-muted-foreground">{ideas.length}</span>
          ) : null}
          <div className="flex items-center rounded-md border p-0.5">
            <Button
              size="sm"
              variant={view === "board" ? "secondary" : "ghost"}
              className={cn("h-7 gap-1.5 px-2")}
              onClick={() => setView("board")}
            >
              <LayoutGrid className="size-3.5" />
              Board
            </Button>
            <Button
              size="sm"
              variant={view === "matrix" ? "secondary" : "ghost"}
              className={cn("h-7 gap-1.5 px-2")}
              onClick={() => setView("matrix")}
            >
              <ScatterChart className="size-3.5" />
              Matrix
            </Button>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New idea
        </Button>
      </header>

      {ideas === undefined ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : ideas.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <ScatterChart className="size-8 text-muted-foreground/50" />
          <div>
            <p className="text-sm font-medium">No ideas yet</p>
            <p className="text-xs text-muted-foreground">
              Capture product opportunities and prioritize before delivery.
            </p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Create idea
          </Button>
        </div>
      ) : view === "board" ? (
        <IdeasBoard ideas={ideas} onOpenIdea={openIdea} />
      ) : (
        <IdeasMatrix ideas={ideas} onOpenIdea={openIdea} />
      )}

      <CreateIdeaDialog open={createOpen} onOpenChange={setCreateOpen} />
      <IdeaDetailSheet
        idea={selectedIdea}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setSelectedIdea(null);
          }
        }}
      />
    </div>
  );
}
