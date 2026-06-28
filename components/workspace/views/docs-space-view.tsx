"use client";

import { SpaceLayout } from "@/components/docs/space-layout";
import { Id } from "@/convex/_generated/dataModel";

export function DocsSpaceView({ spaceId }: { spaceId: string }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <SpaceLayout spaceId={spaceId as Id<"docSpaces">} />
    </div>
  );
}
