"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/** Cosmetic plan gate for AI surfaces. Convex enforces access in mutations. */
export function useAiAccess(): { isLoaded: boolean; hasAccess: boolean } {
  const org = useQuery(api.organizations.current);
  return {
    isLoaded: org !== undefined,
    hasAccess: org ? org.plan === "pro" || org.plan === "enterprise" : false,
  };
}
