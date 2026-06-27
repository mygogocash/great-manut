"use client";

import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef } from "react";
import { api } from "@/convex/_generated/api";
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
  const workspaces = useQuery(api.organizations.listMine);

  useEffect(() => {
    if (
      activationAttempted.current ||
      currentUser === undefined ||
      currentUser === null ||
      workspaces === undefined
    ) {
      return;
    }

    const belongs = workspaces.some((entry) => entry.org.slug === orgSlug);
    if (!belongs) {
      router.replace("/onboarding");
      return;
    }

    if (currentOrg?.slug === orgSlug) {
      return;
    }

    activationAttempted.current = true;
    void activateBySlug({ slug: orgSlug }).catch(() => {
      activationAttempted.current = false;
      router.replace("/onboarding");
    });
  }, [
    activateBySlug,
    currentOrg?.slug,
    currentUser,
    orgSlug,
    router,
    workspaces,
  ]);

  if (currentUser === undefined || currentOrg === undefined || workspaces === undefined) {
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
