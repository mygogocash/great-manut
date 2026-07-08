"use client";

import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AI_CREDIT_PACKS, type AiProvider } from "@/lib/usage-pricing";
import { Textarea } from "@/components/ui/textarea";

export function AiSettingsCard() {
  const settings = useQuery(api.aiCredentials.getSettings);
  const packs = useQuery(api.aiCredits.listPacks);
  const membership = useQuery(api.organizations.myMembership);
  const setAiMode = useMutation(api.aiCredentials.setAiMode);
  const saveCredential = useMutation(api.aiCredentials.saveCredential);
  const removeCredential = useMutation(api.aiCredentials.removeCredential);
  const createPackCheckout = useMutation(api.billing.stripe.createAiPackCheckout);
  const embeddingStats = useQuery(api.agent.embeddings.embeddingStats);
  const requestEmbeddingRebackfill = useMutation(
    api.agent.embeddings.requestEmbeddingRebackfill
  );

  const [provider, setProvider] = useState<AiProvider>("vertex");
  const [apiKey, setApiKey] = useState("");
  const [chatModelId, setChatModelId] = useState("");
  const [saving, setSaving] = useState(false);
  const [rebackfilling, setRebackfilling] = useState(false);

  const isAdmin = membership?.role === "admin";

  if (settings === undefined || membership === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const startPackCheckout = (packId: string) => {
    const base = window.location.origin;
    void createPackCheckout({
      packId,
      successUrl: `${base}${window.location.pathname}?checkout=success`,
      cancelUrl: window.location.href,
    })
      .then((result) => {
        if ("url" in result && typeof result.url === "string") {
          window.location.href = result.url;
          return;
        }
        toast.info(result.message);
      })
      .catch((error: unknown) => {
        toast.error(
          error instanceof Error ? error.message : "Checkout failed"
        );
      });
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-medium">AI mode</h2>
          <p className="text-xs text-muted-foreground">
            Managed top-up uses Manut inference on Google Vertex. BYOK bills
            your provider directly.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={settings.aiMode === "managed" ? "default" : "outline"}
              disabled={!isAdmin}
              onClick={() => {
                void setAiMode({ aiMode: "managed" })
                  .then(() => toast.success("Switched to managed credits"))
                  .catch((e: unknown) =>
                    toast.error(e instanceof Error ? e.message : "Failed")
                  );
              }}
            >
              Managed credits
            </Button>
            <Button
              size="sm"
              variant={settings.aiMode === "byok" ? "default" : "outline"}
              disabled={!isAdmin || !settings.credential}
              onClick={() => {
                void setAiMode({ aiMode: "byok" })
                  .then(() => toast.success("Switched to BYOK"))
                  .catch((e: unknown) =>
                    toast.error(e instanceof Error ? e.message : "Failed")
                  );
              }}
            >
              Bring your own key
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Balance:{" "}
            <span className="font-medium text-foreground">
              {settings.aiCreditBalance.toFixed(1)} credits
            </span>
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-medium">Top up credits</h2>
          <p className="text-xs text-muted-foreground">
            One-time packs — credits never expire.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {(packs ?? AI_CREDIT_PACKS).map((pack) => (
            <div
              key={pack.id}
              className="flex flex-col rounded-lg border bg-card p-3"
            >
              <span className="text-sm font-medium">{pack.credits} credits</span>
              <span className="text-xs text-muted-foreground">
                ${pack.priceUsd}
              </span>
              <Button
                size="sm"
                className="mt-3"
                variant="outline"
                disabled={!isAdmin}
                onClick={() => startPackCheckout(pack.id)}
              >
                Buy
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-medium">Provider credentials (BYOK)</h2>
          <p className="text-xs text-muted-foreground">
            Keys are encrypted server-side and never shown again after save.
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
          {settings.credential && (
            <p className="text-xs text-muted-foreground">
              Saved: {settings.credential.provider}
              {settings.credential.chatModelId
                ? ` · ${settings.credential.chatModelId}`
                : ""}
            </p>
          )}

          <div className="grid gap-2">
            <Label className="text-xs">Provider</Label>
            <Select
              value={provider}
              onValueChange={(v) => setProvider(v as AiProvider)}
              disabled={!isAdmin}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vertex">Google Vertex</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Claude (Anthropic)</SelectItem>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs">
              {provider === "vertex" ? "Service account JSON" : "API key"}
            </Label>
            {provider === "vertex" ? (
              <Textarea
                className="min-h-24 font-mono text-xs"
                placeholder='{"type":"service_account","project_id":"…",…}'
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={!isAdmin}
              />
            ) : (
              <Input
                type="password"
                className="h-8"
                placeholder="sk-…"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={!isAdmin}
              />
            )}
          </div>

          {(provider === "openrouter" ||
            provider === "anthropic" ||
            provider === "vertex") && (
            <div className="grid gap-2">
              <Label className="text-xs">Chat model id (optional)</Label>
              <Input
                className="h-8"
                placeholder={
                  provider === "openrouter"
                    ? "openai/gpt-4o-mini"
                    : provider === "anthropic"
                      ? "claude-3-5-haiku-latest"
                      : "gemini-2.5-flash"
                }
                value={chatModelId}
                onChange={(e) => setChatModelId(e.target.value)}
                disabled={!isAdmin}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!isAdmin || saving || !apiKey.trim()}
              onClick={() => {
                setSaving(true);
                void saveCredential({
                  provider,
                  apiKey,
                  chatModelId: chatModelId.trim() || undefined,
                  embeddingProvider:
                    provider === "vertex" ? "vertex" : "openai",
                })
                  .then(() => {
                    toast.success("API key saved and validated");
                    setApiKey("");
                  })
                  .catch((e: unknown) =>
                    toast.error(e instanceof Error ? e.message : "Save failed")
                  )
                  .finally(() => setSaving(false));
              }}
            >
              {saving ? "Saving…" : "Save key"}
            </Button>
            {settings.credential && isAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void removeCredential()
                    .then(() => toast.success("API key removed"))
                    .catch((e: unknown) =>
                      toast.error(e instanceof Error ? e.message : "Failed")
                    );
                }}
              >
                Remove key
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-medium">Issue embeddings</h2>
          <p className="text-xs text-muted-foreground">
            Semantic duplicate detection uses Vertex embeddings. Re-run after
            switching providers or models.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          {embeddingStats === undefined ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-xs text-muted-foreground">
              {embeddingStats.embedded} / {embeddingStats.total} issues embedded
              {embeddingStats.missing > 0
                ? ` · ${embeddingStats.missing} missing`
                : ""}
            </p>
          )}
          <Button
            size="sm"
            className="mt-3"
            variant="outline"
            disabled={!isAdmin || rebackfilling}
            onClick={() => {
              setRebackfilling(true);
              void requestEmbeddingRebackfill({})
                .then(() =>
                  toast.success(
                    "Re-embed started — runs in the background in batches"
                  )
                )
                .catch((e: unknown) =>
                  toast.error(e instanceof Error ? e.message : "Failed")
                )
                .finally(() => setRebackfilling(false));
            }}
          >
            {rebackfilling ? "Starting…" : "Re-embed all issues"}
          </Button>
        </div>
      </section>
    </div>
  );
}
