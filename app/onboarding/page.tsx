import { OnboardingPanel } from "@/components/auth/onboarding-panel";
import { AuthedAnalytics } from "@/components/analytics/authed-analytics";
import { CONTENT_PX } from "@/lib/responsive";

export default function OnboardingPage() {
  return (
    <main
      className={`flex min-h-dvh w-full flex-col items-center justify-center py-10 ${CONTENT_PX}`}
    >
      <AuthedAnalytics />
      <div className="w-full max-w-md">
        <OnboardingPanel />
      </div>
    </main>
  );
}
