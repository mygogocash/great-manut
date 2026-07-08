import { ReactNode } from "react";
import { AuthShell } from "@/components/auth/auth-shell";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
