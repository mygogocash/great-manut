"use client";

import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SpaceLayout } from "@/components/docs/space-layout";

export function DocsPageView({ pageId }: { pageId: string }) {
  const data = useQuery(api.docs.pagesGet, {
    pageId: pageId as Id<"docPages">,
  });

  if (data === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <SpaceLayout
        spaceId={data.space._id}
        pageId={pageId as Id<"docPages">}
      />
    </div>
  );
}
