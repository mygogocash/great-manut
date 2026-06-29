import { AiSettingsCard } from "@/components/billing/ai-settings-card";

export default function AiSettingsPage() {
  return (
    <div className="flex flex-col gap-2 p-4 lg:p-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">AI</h1>
        <p className="text-sm text-muted-foreground">
          Managed credit top-ups or bring your own provider key.
        </p>
      </div>
      <AiSettingsCard />
    </div>
  );
}
