"use client";

import { useParams } from "next/navigation";
import { ReactNode } from "react";
import { WorkspaceShell } from "@/components/shell/workspace-shell";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  return <WorkspaceShell orgSlug={orgSlug}>{children}</WorkspaceShell>;
}
