"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/** Cosmetic AI access — Convex enforces credits / BYOK in mutations. */
export function useAiAccess(): { isLoaded: boolean; hasAccess: boolean } {
  const org = useQuery(api.organizations.current);
  const balance = useQuery(
    api.aiCredits.getBalance,
    org ? {} : "skip"
  );

  if (org === undefined) {
    return { isLoaded: false, hasAccess: false };
  }
  if (!org) {
    return { isLoaded: true, hasAccess: false };
  }
  if (balance === undefined) {
    return { isLoaded: false, hasAccess: false };
  }

  const hasAccess =
    balance.aiMode === "byok" || balance.balance > 0;

  return { isLoaded: true, hasAccess };
}
