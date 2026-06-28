import { OnboardingPanel } from "@/components/auth/onboarding-panel";
import { AuthedAnalytics } from "@/components/analytics/authed-analytics";

export default function OnboardingPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <AuthedAnalytics />
      <OnboardingPanel />
    </main>
  );
}
