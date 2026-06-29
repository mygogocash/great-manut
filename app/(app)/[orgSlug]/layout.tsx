"use client";

import { useParams } from "next/navigation";
import { ReactNode } from "react";
import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { SurfaceThemeProvider } from "@/components/theme/surface-theme-provider";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  return (
    <SurfaceThemeProvider surface="app">
      <WorkspaceShell orgSlug={orgSlug}>{children}</WorkspaceShell>
    </SurfaceThemeProvider>
  );
}
