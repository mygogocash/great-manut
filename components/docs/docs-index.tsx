"use client";

import { useQuery } from "convex/react";
import { BookOpen, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { UpgradePromptDialog } from "@/components/billing/upgrade-prompt";
import { useSuiteFeatureAccess } from "@/components/billing/use-suite-feature-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateSpaceDialog } from "@/components/docs/create-space-dialog";

export function DocsIndex() {
  const params = useParams<{ orgSlug: string }>();
  const spaces = useQuery(api.docs.spacesList, {});
  const { hasAccess: canCreateSpace } = useSuiteFeatureAccess("docs_write");
  const [filter, setFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const openCreate = () => {
    if (!canCreateSpace) {
      setUpgradeOpen(true);
      return;
    }
    setCreateOpen(true);
  };

  const filtered = useMemo(() => {
    if (!spaces) {
      return undefined;
    }
    const q = filter.trim().toLowerCase();
    if (!q) {
      return spaces;
    }
    return spaces.filter(
      (space) =>
        space.name.toLowerCase().includes(q) ||
        space.description?.toLowerCase().includes(q)
    );
  }, [spaces, filter]);

  return (
    <>
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2 text-sm">
          <BookOpen className="size-4" />
          <span className="font-medium">Docs</span>
          {spaces !== undefined && (
            <span className="text-xs text-muted-foreground">
              {spaces.length}
            </span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="size-4" />
          New space
        </Button>
      </header>

      <div className="border-b px-4 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter spaces…"
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {filtered === undefined ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
            <BookOpen className="size-8 opacity-40" />
            <p>No doc spaces yet.</p>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Create space
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((space) => (
              <Link
                key={space._id}
                href={`/${params.orgSlug}/docs/space/${space._id}`}
                className="flex h-12 items-center gap-3 px-4 text-sm hover:bg-accent/50"
              >
                <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                  {space.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{space.name}</div>
                  {space.description && (
                    <div className="truncate text-xs text-muted-foreground">
                      {space.description}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {space.pageCount} pages
                </span>
              </Link>
            ))}
          </div>
        )}
      </ScrollArea>

      <CreateSpaceDialog
        orgSlug={params.orgSlug}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <UpgradePromptDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        kind="docs_write"
      />
    </>
  );
}
