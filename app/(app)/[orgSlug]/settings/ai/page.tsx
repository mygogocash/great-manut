import { AiSettingsCard } from "@/components/billing/ai-settings-card";

export default function AiSettingsPage() {
  return (
    <>
      <div>
        <h1 className="text-base font-semibold">AI</h1>
        <p className="text-xs text-muted-foreground">
          Managed credit top-ups or bring your own provider key.
        </p>
      </div>
      <AiSettingsCard />
    </>
  );
}
