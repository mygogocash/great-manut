import { ReactNode } from "react";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { SurfaceThemeProvider } from "@/components/theme/surface-theme-provider";

/**
 * Public chrome for the sign-in / sign-up / onboarding pages: provides the
 * light-default theme for these surfaces plus a corner theme toggle so
 * unauthenticated visitors can switch.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <SurfaceThemeProvider surface="auth">
      <div className="relative">
        <div className="absolute right-4 top-4 z-10">
          <ThemeToggle />
        </div>
        {children}
      </div>
    </SurfaceThemeProvider>
  );
}
