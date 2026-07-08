import { ReactNode } from "react";
import { SurfaceThemeProvider } from "@/components/theme/surface-theme-provider";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <SurfaceThemeProvider surface="portal">{children}</SurfaceThemeProvider>;
}
