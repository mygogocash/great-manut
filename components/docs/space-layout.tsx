"use client";

import { useMutation, useQuery } from "convex/react";
import { ChevronRight, Loader2, PanelLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageTree } from "@/components/docs/page-tree";
import { PageView } from "@/components/docs/page-view";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function findAncestors(
  tree: Array<{ _id: Id<"docPages">; title: string; parentPageId?: Id<"docPages">; children: unknown[] }>,
  pageId: Id<"docPages">,
  ancestors: Array<{ id: Id<"docPages">; title: string }> = []
): Array<{ id: Id<"docPages">; title: string }> | null {
  for (const node of tree) {
    if (node._id === pageId) {
      return ancestors;
    }
    const found = findAncestors(
      node.children as typeof tree,
      pageId,
      [...ancestors, { id: node._id, title: node.title }]
    );
    if (found) {
      return found;
    }
  }
  return null;
}

export function SpaceLayout({
  spaceId,
  pageId,
}: {
  spaceId: Id<"docSpaces">;
  pageId?: Id<"docPages">;
}) {
  const params = useParams<{ orgSlug: string }>();
  const router = useRouter();
  const [treeOpen, setTreeOpen] = useState(false);
  const space = useQuery(api.docs.spacesGet, { spaceId });
  const tree = useQuery(api.docs.pagesListTree, { spaceId });
  const createPage = useMutation(api.docs.pagesCreate);

  const handleNewPage = async () => {
    const newPageId = await createPage({
      spaceId,
      title: "Untitled",
    });
    router.push(`/${params.orgSlug}/docs/page/${newPageId}`);
    setTreeOpen(false);
  };

  if (space === undefined || tree === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ancestors =
    pageId && tree ? findAncestors(tree, pageId) ?? [] : [];

  const pageTree = (
    <PageTree
      tree={tree}
      spaceId={spaceId}
      currentPageId={pageId}
      onNewPage={handleNewPage}
    />
  );

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-10 shrink-0 items-center gap-1 border-b px-4 text-sm">
        <Sheet open={treeOpen} onOpenChange={setTreeOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11 shrink-0 lg:hidden"
              aria-label="Open page tree"
            >
              <PanelLeft className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle>{space.name}</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100dvh-4rem)]">
              {pageTree}
            </ScrollArea>
          </SheetContent>
        </Sheet>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap">
          <Link
            href={`/${params.orgSlug}/docs`}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            Docs
          </Link>
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          <Link
            href={`/${params.orgSlug}/docs/space/${spaceId}`}
            className="max-w-32 shrink-0 truncate text-muted-foreground hover:text-foreground"
          >
            {space.name}
          </Link>
          {ancestors.map((ancestor) => (
            <span key={ancestor.id} className="flex shrink-0 items-center gap-1">
              <ChevronRight className="size-3.5 text-muted-foreground" />
              <Link
                href={`/${params.orgSlug}/docs/page/${ancestor.id}`}
                className="max-w-32 truncate text-muted-foreground hover:text-foreground"
              >
                {ancestor.title}
              </Link>
            </span>
          ))}
          {pageId && (
            <>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate font-medium">Current</span>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-56 shrink-0 border-r bg-muted/20 lg:block">
          <ScrollArea className="h-full">
            {pageTree}
          </ScrollArea>
        </aside>
        <main className="flex flex-1 flex-col overflow-hidden">
          {pageId ? (
            <PageView pageId={pageId} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <p>Select a page from the tree or create a new one.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
