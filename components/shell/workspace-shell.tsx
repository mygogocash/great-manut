"use client";

import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef } from "react";
import { api } from "@/convex/_generated/api";
import { PostHogAuthSync } from "@/components/analytics/posthog-auth-sync";
import { PlanLimitListener } from "@/components/billing/upgrade-prompt";
import { CommandProvider } from "@/components/commands/command-provider";
import { AppSidebar } from "./app-sidebar";

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="flex h-dvh items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

/**
 * Authenticated workspace shell.
 *
 * 1. Activates the org that matches the URL slug.
 * 2. Waits for user + org docs before rendering org-scoped queries.
 */
export function WorkspaceShell({
  orgSlug,
  children,
}: {
  orgSlug: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const activateBySlug = useMutation(api.organizations.activateBySlug);
  const activationAttempted = useRef(false);

  const currentUser = useQuery(api.users.current);
  const currentOrg = useQuery(api.organizations.current);
  // Only fetch the full workspace list when the active org doesn't already
  // match the slug — avoids a live subscription on every page load.
  const alreadyActive = currentOrg?.slug === orgSlug;
  const workspaces = useQuery(
    api.organizations.listMine,
    alreadyActive ? "skip" : undefined,
  );

  useEffect(() => {
    if (
      activationAttempted.current ||
      currentUser === undefined ||
      currentUser === null
    ) {
      return;
    }

    if (alreadyActive) {
      return;
    }

    if (workspaces === undefined) {
      return;
    }

    const belongs = workspaces.some((entry) => entry.org.slug === orgSlug);
    if (!belongs) {
      router.replace("/onboarding");
      return;
    }

    activationAttempted.current = true;
    void activateBySlug({ slug: orgSlug }).catch(() => {
      activationAttempted.current = false;
      router.replace("/onboarding");
    });
  }, [
    activateBySlug,
    alreadyActive,
    currentUser,
    orgSlug,
    router,
    workspaces,
  ]);

  const workspacesReady = alreadyActive || workspaces !== undefined;
  if (currentUser === undefined || currentOrg === undefined || !workspacesReady) {
    return <FullScreenLoader label="Loading workspace…" />;
  }

  if (currentUser === null) {
    return <FullScreenLoader label="Signing in…" />;
  }

  if (currentOrg === null || currentOrg.slug !== orgSlug) {
    return <FullScreenLoader label="Switching workspace…" />;
  }

  return (
    <CommandProvider>
      <PostHogAuthSync />
      <PlanLimitListener />
      <div className="flex h-dvh overflow-hidden">
        <AppSidebar />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </CommandProvider>
  );
}
