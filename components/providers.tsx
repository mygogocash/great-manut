"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { PostHogPageView } from "@/components/analytics/posthog-pageview";
import { TooltipProvider } from "@/components/ui/tooltip";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <ConvexAuthNextjsProvider client={convex}>
        {/* PostHogAuthSync is mounted only in the app layout to avoid
            opening Convex subscriptions on public marketing pages. */}
        <PostHogPageView />
        <TooltipProvider>{children}</TooltipProvider>
      </ConvexAuthNextjsProvider>
    </ThemeProvider>
  );
}
