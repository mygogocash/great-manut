"use client";

import { useMutation, useQuery } from "convex/react";
import { ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageTree } from "@/components/docs/page-tree";
import { PageView } from "@/components/docs/page-view";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const space = useQuery(api.docs.spacesGet, { spaceId });
  const tree = useQuery(api.docs.pagesListTree, { spaceId });
  const createPage = useMutation(api.docs.pagesCreate);

  const handleNewPage = async () => {
    const newPageId = await createPage({
      spaceId,
      title: "Untitled",
    });
    router.push(`/${params.orgSlug}/docs/page/${newPageId}`);
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

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-10 shrink-0 items-center gap-1 border-b px-4 text-sm">
        <Link
          href={`/${params.orgSlug}/docs`}
          className="text-muted-foreground hover:text-foreground"
        >
          Docs
        </Link>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <Link
          href={`/${params.orgSlug}/docs/space/${spaceId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          {space.name}
        </Link>
        {ancestors.map((ancestor) => (
          <span key={ancestor.id} className="flex items-center gap-1">
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <Link
              href={`/${params.orgSlug}/docs/page/${ancestor.id}`}
              className="text-muted-foreground hover:text-foreground"
            >
              {ancestor.title}
            </Link>
          </span>
        ))}
        {pageId && (
          <>
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <span className="font-medium">Current</span>
          </>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 shrink-0 border-r bg-muted/20">
          <ScrollArea className="h-full">
            <PageTree
              tree={tree}
              spaceId={spaceId}
              currentPageId={pageId}
              onNewPage={handleNewPage}
            />
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
