"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.current);

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 rounded-full">
          <UserAvatar name={user.name} imageUrl={user.imageUrl} className="size-8" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            void signOut().then(() => router.push("/"));
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OrganizationSwitcher({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const currentOrg = useQuery(api.organizations.current);
  const workspaces = useQuery(api.organizations.listMine);
  const setActive = useMutation(api.organizations.setActive);

  if (!currentOrg || !workspaces) {
    return (
      <Button
        variant="ghost"
        size={compact ? "icon" : "sm"}
        className={compact ? "min-h-11 min-w-11" : "max-w-44 justify-start px-2"}
        disabled
      >
        {compact ? (
          <span className="text-xs">…</span>
        ) : (
          <span className="truncate text-sm">Loading…</span>
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className={
            compact
              ? "min-h-11 min-w-11"
              : "max-w-44 justify-between gap-1 px-2"
          }
          aria-label={compact ? `Switch workspace (${currentOrg.name})` : undefined}
        >
          {compact ? (
            <span className="flex size-7 items-center justify-center rounded bg-primary/15 text-xs font-semibold text-primary">
              {currentOrg.name.slice(0, 1).toUpperCase()}
            </span>
          ) : (
            <>
              <span className="truncate text-sm font-medium">{currentOrg.name}</span>
              <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {workspaces.map((entry) => (
          <DropdownMenuItem
            key={entry.orgId}
            onClick={() => {
              void setActive({ orgId: entry.orgId }).then(() => {
                router.push(`/${entry.org.slug}`);
              });
            }}
          >
            <span className="truncate">{entry.org.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/onboarding")}>
          Manage workspaces
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
