"use client";

import { useQuery } from "convex/react";
import { BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { IssueDetailSlotProps } from "@/components/issue-detail/slots";

export function LinkedDocsPanel({ issue }: IssueDetailSlotProps) {
  const params = useParams<{ orgSlug: string }>();
  const linked = useQuery(api.docs.pagesListByIssueId, { issueId: issue._id });

  if (linked === undefined) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Linked docs
        </span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">
        Linked docs
      </span>
      {linked.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No linked documentation.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {linked.map((doc) => (
            <Link
              key={doc.pageId}
              href={`/${params.orgSlug}/docs/page/${doc.pageId}`}
              className="flex h-7 items-center gap-2 rounded-md px-2 text-xs hover:bg-accent"
            >
              <BookOpen className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate font-medium">{doc.title}</span>
              <span className="ml-auto truncate text-muted-foreground">
                {doc.spaceName}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
