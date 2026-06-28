"use client";

import { useMutation } from "convex/react";
import { ChevronRight, FileText, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type TreeNode = Doc<"docPages"> & { children: TreeNode[] };

function TreeNodeItem({
  node,
  spaceId,
  currentPageId,
  depth,
}: {
  node: TreeNode;
  spaceId: Id<"docSpaces">;
  currentPageId?: Id<"docPages">;
  depth: number;
}) {
  const params = useParams<{ orgSlug: string }>();
  const router = useRouter();
  const hasChildren = node.children.length > 0;
  const active = currentPageId === node._id;
  const createPage = useMutation(api.docs.pagesCreate);
  const [creating, setCreating] = useState(false);

  const navigate = () => {
    router.push(`/${params.orgSlug}/docs/page/${node._id}`);
  };

  const handleNewSubpage = async () => {
    setCreating(true);
    try {
      const pageId = await createPage({
        spaceId,
        title: "Untitled",
        parentPageId: node._id,
      });
      router.push(`/${params.orgSlug}/docs/page/${pageId}`);
    } finally {
      setCreating(false);
    }
  };

  if (!hasChildren) {
    return (
      <button
        type="button"
        onClick={navigate}
        className={cn(
          "flex h-7 w-full items-center gap-1.5 rounded-md px-2 text-left text-sm hover:bg-accent",
          active && "bg-accent font-medium text-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{node.title}</span>
      </button>
    );
  }

  return (
    <Collapsible defaultOpen>
      <div
        className="flex items-center"
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        <CollapsibleTrigger className="flex size-6 shrink-0 items-center justify-center rounded hover:bg-accent">
          <ChevronRight className="size-3.5 transition-transform [[data-state=open]>&]:rotate-90" />
        </CollapsibleTrigger>
        <button
          type="button"
          onClick={navigate}
          className={cn(
            "flex h-7 flex-1 items-center gap-1.5 rounded-md px-2 text-left text-sm hover:bg-accent",
            active && "bg-accent font-medium text-foreground"
          )}
        >
          <FileText className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{node.title}</span>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 shrink-0"
          disabled={creating}
          onClick={handleNewSubpage}
          aria-label="New subpage"
        >
          <Plus className="size-3" />
        </Button>
      </div>
      <CollapsibleContent>
        {node.children.map((child) => (
          <TreeNodeItem
            key={child._id}
            node={child}
            spaceId={spaceId}
            currentPageId={currentPageId}
            depth={depth + 1}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PageTree({
  tree,
  spaceId,
  currentPageId,
  onNewPage,
}: {
  tree: TreeNode[];
  spaceId: Id<"docSpaces">;
  currentPageId?: Id<"docPages">;
  onNewPage: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 p-2">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-muted-foreground">Pages</span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={onNewPage}
          aria-label="New page"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>
      {tree.length === 0 ? (
        <p className="px-2 text-xs text-muted-foreground">No pages yet.</p>
      ) : (
        tree.map((node) => (
          <TreeNodeItem
            key={node._id}
            node={node}
            spaceId={spaceId}
            currentPageId={currentPageId}
            depth={0}
          />
        ))
      )}
    </div>
  );
}
