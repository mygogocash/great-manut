"use client";

import { useQuery } from "convex/react";
import {
  BookOpen,
  FolderKanban,
  Loader2,
  Search,
  SearchX,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PriorityIcon } from "@/components/shared/priority-icon";
import { StatusIcon } from "@/components/shared/status-icon";
import { ProjectStatusIcon } from "@/components/projects/project-status-icon";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const ALL_TEAMS = "all";
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

type SearchTab = "all" | "issues" | "docs" | "projects";

type ProjectStatus =
  | "backlog"
  | "planned"
  | "in_progress"
  | "paused"
  | "completed"
  | "canceled";

type SearchResultItem =
  | {
      kind: "issue";
      id: string;
      href: string;
      title: string;
      subtitle: string;
      issue: {
        priority: "none" | "urgent" | "high" | "medium" | "low";
        status:
          | "backlog"
          | "todo"
          | "in_progress"
          | "in_review"
          | "done"
          | "canceled";
        teamKey: string;
        number: number;
      };
    }
  | {
      kind: "doc";
      id: string;
      href: string;
      title: string;
      subtitle: string;
    }
  | {
      kind: "project";
      id: string;
      href: string;
      title: string;
      subtitle: string;
      status: ProjectStatus;
    };

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/** Workspace-wide unified search across issues, docs, and projects. */
export function SearchIndexView() {
  const params = useParams<{ orgSlug: string }>();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>(ALL_TEAMS);
  const [tab, setTab] = useState<SearchTab>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_MS);
  const searchActive = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const [prevResultKey, setPrevResultKey] = useState("");
  const resultKey = `${debouncedQuery}:${tab}:${teamFilter}`;
  if (resultKey !== prevResultKey) {
    setPrevResultKey(resultKey);
    setSelectedIndex(0);
  }

  const teams = useQuery(api.teams.list);
  const issueResults = useQuery(
    api.search.issues,
    searchActive && (tab === "all" || tab === "issues")
      ? {
          query: debouncedQuery,
          ...(teamFilter !== ALL_TEAMS
            ? { teamId: teamFilter as Id<"teams"> }
            : {}),
        }
      : "skip",
  );
  const docResults = useQuery(
    api.docs.search,
    searchActive && (tab === "all" || tab === "docs")
      ? { query: debouncedQuery }
      : "skip",
  );
  const projectResultsQuery = useQuery(
    api.search.projects,
    searchActive && (tab === "all" || tab === "projects")
      ? { query: debouncedQuery }
      : "skip",
  );

  const visibleResults = useMemo((): SearchResultItem[] => {
    const base = `/${params.orgSlug}`;
    const issues: SearchResultItem[] =
      issueResults?.map((issue) => ({
        kind: "issue",
        id: issue._id,
        href: `${base}/issue/${issue._id}`,
        title: issue.title,
        subtitle: `${issue.teamKey} · ${issue.teamName}`,
        issue: {
          priority: issue.priority,
          status: issue.status,
          teamKey: issue.teamKey,
          number: issue.number,
        },
      })) ?? [];

    const docs: SearchResultItem[] =
      docResults?.map((doc) => ({
        kind: "doc",
        id: doc.pageId,
        href: `${base}/docs/page/${doc.pageId}`,
        title: doc.title,
        subtitle: doc.spaceName,
      })) ?? [];

    const projects: SearchResultItem[] =
      projectResultsQuery?.map((project) => ({
        kind: "project",
        id: project.projectId,
        href: `${base}/projects/${project.projectId}`,
        title: project.name,
        subtitle:
          project.description?.trim() ||
          project.status.replaceAll("_", " "),
        status: project.status,
      })) ?? [];

    switch (tab) {
      case "issues":
        return issues;
      case "docs":
        return docs;
      case "projects":
        return projects;
      default:
        return [...issues, ...docs, ...projects];
    }
  }, [docResults, issueResults, params.orgSlug, projectResultsQuery, tab]);

  const effectiveIndex = Math.min(
    selectedIndex,
    Math.max(visibleResults.length - 1, 0),
  );

  const searching =
    searchActive &&
    (((tab === "all" || tab === "issues") && issueResults === undefined) ||
      ((tab === "all" || tab === "docs") && docResults === undefined) ||
      ((tab === "all" || tab === "projects") &&
        projectResultsQuery === undefined));
  const waitingForDebounce =
    query.trim().length >= MIN_QUERY_LENGTH &&
    query.trim() !== debouncedQuery;

  const openResult = useCallback(
    (item: SearchResultItem) => {
      router.push(item.href);
    },
    [router],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!visibleResults.length) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) =>
        Math.min(index + 1, visibleResults.length - 1),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = visibleResults[effectiveIndex];
      if (item) {
        openResult(item);
      }
    }
  };

  const showTeamFilter = tab === "all" || tab === "issues";

  return (
    <>
      <header className="flex h-12 shrink-0 items-center border-b px-4">
        <span className="text-sm font-medium">Search</span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-6 pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <InputGroup className="h-9 flex-1">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                autoFocus
                placeholder="Search issues, docs, and projects…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
              />
            </InputGroup>
            {showTeamFilter ? (
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger size="sm" className="w-full gap-1.5 sm:w-36">
                  <SelectValue placeholder="All teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_TEAMS}>All teams</SelectItem>
                  {teams?.map((team) => (
                    <SelectItem key={team._id} value={team._id}>
                      {team.key} · {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as SearchTab)}
          >
            <TabsList className="h-7">
              <TabsTrigger value="all" className="h-6 px-2 text-xs">
                All
              </TabsTrigger>
              <TabsTrigger value="issues" className="h-6 px-2 text-xs">
                Issues
              </TabsTrigger>
              <TabsTrigger value="docs" className="h-6 px-2 text-xs">
                Docs
              </TabsTrigger>
              <TabsTrigger value="projects" className="h-6 px-2 text-xs">
                Projects
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1">
          <div className="mx-auto w-full max-w-2xl px-4 pb-8">
            {debouncedQuery.length < MIN_QUERY_LENGTH ? (
              <div className="flex flex-col items-center gap-2 py-24 text-center">
                <Search className="size-6 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Search across issues, documentation, and projects.
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Type at least {MIN_QUERY_LENGTH} characters. Use{" "}
                  <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">
                    ↑
                  </kbd>{" "}
                  <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">
                    ↓
                  </kbd>{" "}
                  to navigate,{" "}
                  <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">
                    Enter
                  </kbd>{" "}
                  to open.
                </p>
              </div>
            ) : searching || waitingForDebounce ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : visibleResults.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-24 text-center">
                <SearchX className="size-6 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No results for “{debouncedQuery}”.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                <p className="px-1 pb-2 text-xs text-muted-foreground">
                  {visibleResults.length}{" "}
                  {visibleResults.length === 1 ? "result" : "results"}
                </p>
                {visibleResults.map((item, index) => (
                  <SearchResultRow
                    key={`${item.kind}-${item.id}`}
                    item={item}
                    selected={index === effectiveIndex}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onNavigate={() => openResult(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}

function SearchResultRow({
  item,
  selected,
  onMouseEnter,
  onNavigate,
}: {
  item: SearchResultItem;
  selected: boolean;
  onMouseEnter: () => void;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      prefetch={false}
      onMouseEnter={onMouseEnter}
      onClick={(event) => {
        event.preventDefault();
        onNavigate();
      }}
      className={cn(
        "group flex h-10 items-center gap-3 border-b px-2 text-sm transition-colors hover:bg-accent/50",
        selected && "bg-accent/50",
      )}
    >
      {item.kind === "issue" ? (
        <>
          <PriorityIcon priority={item.issue.priority} />
          <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">
            {item.issue.teamKey}-{item.issue.number}
          </span>
          <StatusIcon status={item.issue.status} />
        </>
      ) : item.kind === "doc" ? (
        <BookOpen className="size-4 shrink-0 text-muted-foreground" />
      ) : (
        <>
          <FolderKanban className="size-4 shrink-0 text-muted-foreground" />
          <ProjectStatusIcon status={item.status} />
        </>
      )}
      <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
      <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
        {item.subtitle}
      </span>
    </Link>
  );
}
