"use client";

import { OrganizationSwitcher, UserMenu } from "@/components/auth/user-menu";
import { useQuery } from "convex/react";
import {
  Bot,
  Box,
  BookOpen,
  ChevronDown,
  Headphones,
  Lightbulb,
  Plus,
  RefreshCcw,
  Search,
  SquarePen,
} from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCommands } from "@/components/commands/command-provider";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { FastNavLink } from "@/components/shell/fast-nav-link";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

export type AppSidebarVariant = "full" | "icon-rail" | "sheet-content";

function NavLink({
  href,
  icon,
  children,
  exact = false,
  iconOnly = false,
  onNavigate,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  exact?: boolean;
  iconOnly?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  const link = (
    <FastNavLink href={href} icon={icon} active={active} onClick={onNavigate}>
      {iconOnly ? null : children}
    </FastNavLink>
  );

  if (!iconOnly) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex justify-center">{link}</div>
      </TooltipTrigger>
      <TooltipContent side="right">{children}</TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar({
  variant = "full",
  onNavigate,
}: {
  variant?: AppSidebarVariant;
  onNavigate?: () => void;
}) {
  const params = useParams<{ orgSlug: string }>();
  const teams = useQuery(api.teams.list);
  const { openCreateIssue, openPalette } = useCommands();
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const base = `/${params.orgSlug}`;
  const iconOnly = variant === "icon-rail";

  const asideClass = cn(
    "flex shrink-0 flex-col border-r bg-sidebar",
    variant === "full" && "w-60",
    variant === "icon-rail" && "w-14",
    variant === "sheet-content" && "h-full w-full border-0",
  );

  return (
    <aside className={asideClass}>
      <div
        className={cn(
          "flex items-center gap-2 p-3",
          iconOnly ? "flex-col justify-center px-2" : "justify-between",
        )}
      >
        {!iconOnly ? (
          <OrganizationSwitcher />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <OrganizationSwitcher compact />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Switch workspace</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(iconOnly ? "min-h-11 min-w-11" : "size-7")}
              onClick={() => {
                openCreateIssue();
                onNavigate?.();
              }}
              aria-label="New issue"
            >
              <SquarePen className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">New issue (C)</TooltipContent>
        </Tooltip>
      </div>

      <div className={cn("pb-2", iconOnly ? "px-2" : "px-3")}>
        {iconOnly ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="min-h-11 min-w-11"
                onClick={openPalette}
                aria-label="Search"
              >
                <Search className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Search (⌘K)</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={openPalette}
            className="flex h-7 w-full items-center gap-2 rounded-md border bg-background px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="size-3.5" />
            Search…
            <kbd className="ml-auto rounded border bg-muted px-1 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      <ScrollArea className={cn("flex-1", iconOnly ? "px-2" : "px-3")}>
        <nav className="flex flex-col gap-0.5 pb-2">
          <NavLink
            href={base}
            exact
            icon={<Box className="size-4" />}
            iconOnly={iconOnly}
            onNavigate={onNavigate}
          >
            Workspace
          </NavLink>
          <NavLink
            href={`${base}/projects`}
            icon={<Box className="size-4" />}
            iconOnly={iconOnly}
            onNavigate={onNavigate}
          >
            Projects
          </NavLink>
          <NavLink
            href={`${base}/cycles`}
            icon={<RefreshCcw className="size-4" />}
            iconOnly={iconOnly}
            onNavigate={onNavigate}
          >
            Cycles
          </NavLink>
          <NavLink
            href={`${base}/docs`}
            icon={<BookOpen className="size-4" />}
            iconOnly={iconOnly}
            onNavigate={onNavigate}
          >
            Docs
          </NavLink>
          <NavLink
            href={`${base}/ai`}
            icon={<Bot className="size-4" />}
            iconOnly={iconOnly}
            onNavigate={onNavigate}
          >
            AI Agent
          </NavLink>
          <NavLink
            href={`${base}/discovery`}
            icon={<Lightbulb className="size-4" />}
            iconOnly={iconOnly}
            onNavigate={onNavigate}
          >
            Discovery
          </NavLink>
          <NavLink
            href={`${base}/service`}
            icon={<Headphones className="size-4" />}
            iconOnly={iconOnly}
            onNavigate={onNavigate}
          >
            Service
          </NavLink>
        </nav>

        {!iconOnly ? (
          <Collapsible defaultOpen className="pb-4">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex items-center gap-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                Your teams
                <ChevronDown className="size-3" />
              </CollapsibleTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="size-5"
                onClick={() => setCreateTeamOpen(true)}
                aria-label="Create team"
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
            <CollapsibleContent className="flex flex-col gap-0.5 pt-1">
              {teams?.map((team) => (
                <NavLink
                  key={team._id}
                  href={`${base}/team/${team._id}`}
                  icon={
                    <span className="flex size-4 items-center justify-center rounded bg-primary/15 text-[9px] font-semibold text-primary">
                      {team.key.slice(0, 2)}
                    </span>
                  }
                  onNavigate={onNavigate}
                >
                  {team.name}
                </NavLink>
              ))}
              {teams?.length === 0 && (
                <button
                  onClick={() => setCreateTeamOpen(true)}
                  className="flex h-7 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Plus className="size-4" />
                  Create your first team
                </button>
              )}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <div className="flex flex-col gap-0.5 pb-4">
            {teams?.map((team) => (
              <NavLink
                key={team._id}
                href={`${base}/team/${team._id}`}
                icon={
                  <span className="flex size-4 items-center justify-center rounded bg-primary/15 text-[9px] font-semibold text-primary">
                    {team.key.slice(0, 2)}
                  </span>
                }
                iconOnly
                onNavigate={onNavigate}
              >
                {team.name}
              </NavLink>
            ))}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-11 min-w-11"
                  onClick={() => setCreateTeamOpen(true)}
                  aria-label="Create team"
                >
                  <Plus className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Create team</TooltipContent>
            </Tooltip>
          </div>
        )}
      </ScrollArea>

      <div
        className={cn(
          "flex items-center border-t p-3",
          iconOnly ? "flex-col gap-2" : "justify-between",
        )}
      >
        <UserMenu />
        <ThemeToggle />
      </div>

      <CreateTeamDialog open={createTeamOpen} onOpenChange={setCreateTeamOpen} />
    </aside>
  );
}
