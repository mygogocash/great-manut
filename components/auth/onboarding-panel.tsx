"use client";

import { useMutation, useQuery } from "convex/react";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { captureEvent } from "@/lib/posthog/client";
import { PostHogEvents } from "@/lib/posthog/events";

export function OnboardingPanel() {
  const router = useRouter();
  const workspaces = useQuery(api.organizations.listMine);
  const pendingInvites = useQuery(api.organizations.listPendingForMe);
  const createWorkspace = useMutation(api.organizations.create);
  const setActive = useMutation(api.organizations.setActive);
  const acceptInvitation = useMutation(api.organizations.acceptInvitation);

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || creating) {
      return;
    }
    setCreating(true);
    try {
      const { slug } = await createWorkspace({ name: name.trim() });
      captureEvent(PostHogEvents.workspaceCreated, {
        workspace_name: name.trim(),
        workspace_slug: slug,
      });
      toast.success("Workspace created");
      router.push(`/${slug}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create workspace"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleOpen = async (orgId: Id<"organizations">, slug: string) => {
    try {
      await setActive({ orgId });
      router.push(`/${slug}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to open workspace"
      );
    }
  };

  const handleAccept = async (token: string, slug: string) => {
    try {
      await acceptInvitation({ token });
      captureEvent(PostHogEvents.workspaceJoined, {
        workspace_slug: slug,
        source: "invitation",
      });
      toast.success("Invitation accepted");
      router.push(`/${slug}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to accept invitation"
      );
    }
  };

  if (workspaces === undefined || pendingInvites === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-lg flex-col gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Choose your workspace
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a workspace, accept an invitation, or create a new one.
        </p>
      </div>

      {pendingInvites.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Pending invitations</h2>
          <div className="flex flex-col gap-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.invitationId}
                className="flex items-center justify-between rounded-lg border bg-card p-3"
              >
                <div>
                  <p className="text-sm font-medium">{invite.orgName}</p>
                  <p className="text-xs text-muted-foreground">
                    Join as {invite.role === "admin" ? "admin" : "member"}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => void handleAccept(invite.token, invite.orgSlug)}
                >
                  Accept
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {workspaces.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Your workspaces</h2>
          <div className="flex flex-col gap-2">
            {workspaces.map((entry) => (
              <button
                key={entry.orgId}
                type="button"
                onClick={() => void handleOpen(entry.orgId, entry.org.slug)}
                className="flex items-center justify-between rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent"
              >
                <div>
                  <p className="text-sm font-medium">{entry.org.name}</p>
                  <p className="text-xs text-muted-foreground">
                    /{entry.org.slug}
                  </p>
                </div>
                <span className="text-xs capitalize text-muted-foreground">
                  {entry.role}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-medium">Create a workspace</h2>
        <form onSubmit={(event) => void handleCreate(event)} className="flex flex-col gap-3">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Acme Engineering"
              required
            />
          </div>
          <Button type="submit" disabled={creating || !name.trim()}>
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Create workspace
          </Button>
        </form>
      </section>
    </div>
  );
}
