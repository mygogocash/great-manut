"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

/**
 * Public surfaces (marketing, auth, customer portal) default to light; the
 * authenticated workspace defaults to dark. Each surface persists its own
 * choice under a distinct storageKey so toggling one never flips the other.
 * All surfaces remain system-aware and user-overridable via <ThemeToggle/>.
 *
 * next-themes is mounted once per route group (exactly one renders per page),
 * which keeps the anti-flash inline script flash-free without a cookie.
 */
type Surface = "marketing" | "auth" | "portal" | "app";

const SURFACE_THEME: Record<
  Surface,
  { defaultTheme: string; storageKey: string }
> = {
  marketing: { defaultTheme: "light", storageKey: "manut-theme-public" },
  auth: { defaultTheme: "light", storageKey: "manut-theme-public" },
  portal: { defaultTheme: "light", storageKey: "manut-theme-portal" },
  app: { defaultTheme: "dark", storageKey: "manut-theme-app" },
};

export function SurfaceThemeProvider({
  surface,
  children,
}: {
  surface: Surface;
  children: ReactNode;
}) {
  const { defaultTheme, storageKey } = SURFACE_THEME[surface];
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      storageKey={storageKey}
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
