"use client";

import { Menu, SquarePen } from "lucide-react";
import { OrganizationSwitcher } from "@/components/auth/user-menu";
import { useCommands } from "@/components/commands/command-provider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function MobileWorkspaceHeader({
  onOpenSidebar,
}: {
  onOpenSidebar: () => void;
}) {
  const { openCreateIssue } = useCommands();

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3 md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="min-h-11 min-w-11 shrink-0"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>
      <div className="min-w-0 flex-1">
        <OrganizationSwitcher />
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 shrink-0"
            onClick={openCreateIssue}
            aria-label="New issue"
          >
            <SquarePen className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>New issue (C)</TooltipContent>
      </Tooltip>
    </header>
  );
}
