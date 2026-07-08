"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useMemo } from "react";
import { Streamdown } from "streamdown";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type Segment =
  | { type: "text"; value: string }
  | { type: "issueKey"; raw: string; teamKey: string; number: number };

function splitWithIssueKeys(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  const regex = /[A-Z]{2,}-\d+/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    const raw = match[0];
    const dash = raw.lastIndexOf("-");
    const teamKey = raw.slice(0, dash);
    const number = Number.parseInt(raw.slice(dash + 1), 10);
    if (number > 0) {
      segments.push({ type: "issueKey", raw, teamKey, number });
    } else {
      segments.push({ type: "text", value: raw });
    }
    lastIndex = match.index + raw.length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }
  return segments;
}

/** Safely render markdown doc bodies with clickable issue keys. */
export function RenderDocBody({
  body,
  orgSlug,
  className,
}: {
  body: string;
  orgSlug: string;
  className?: string;
}) {
  const segments = useMemo(() => splitWithIssueKeys(body), [body]);
  const keys = useMemo(
    () =>
      segments
        .filter((s): s is Segment & { type: "issueKey" } => s.type === "issueKey")
        .map((s) => ({ teamKey: s.teamKey, number: s.number })),
    [segments]
  );

  const resolved = useQuery(
    api.docs.resolveIssueKeys,
    keys.length > 0 ? { keys } : "skip"
  );

  const issueMap = useMemo(() => {
    const map = new Map<string, Id<"issues">>();
    if (resolved) {
      for (const item of resolved) {
        if (item.issueId) {
          map.set(`${item.teamKey}-${item.number}`, item.issueId);
        }
      }
    }
    return map;
  }, [resolved]);

  if (!body.trim()) {
    return (
      <p className="text-sm text-muted-foreground">No content yet.</p>
    );
  }

  const hasIssueKeys = segments.some((s) => s.type === "issueKey");
  if (!hasIssueKeys) {
    return (
      <Streamdown
        shikiTheme={["github-light", "github-dark"]}
        className={className ?? "prose prose-sm dark:prose-invert max-w-none"}
      >
        {body}
      </Streamdown>
    );
  }

  return (
    <div className={className ?? "prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed"}>
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          if (!segment.value) {
            return null;
          }
          return (
            <Streamdown
              key={index}
              shikiTheme={["github-light", "github-dark"]}
              className="inline [&_p]:inline [&_p]:m-0"
            >
              {segment.value}
            </Streamdown>
          );
        }
        const issueId = issueMap.get(`${segment.teamKey}-${segment.number}`);
        if (issueId) {
          return (
            <Link
              key={index}
              href={`/${orgSlug}/issue/${issueId}`}
              className="font-medium text-primary hover:underline"
            >
              {segment.raw}
            </Link>
          );
        }
        return <span key={index}>{segment.raw}</span>;
      })}
    </div>
  );
}
