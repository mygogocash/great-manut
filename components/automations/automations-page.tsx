"use client";

import { useMutation, useQuery } from "convex/react";
import { Loader2, Plus, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FeatureGate } from "@/components/billing/feature-gate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDayWithYear } from "@/components/projects/dates";

const TRIGGERS = [
  { value: "issue.created", label: "Issue created" },
  { value: "issue.status_changed", label: "Issue status changed" },
  { value: "request.created", label: "Service request created" },
] as const;

const ACTIONS = [
  { value: "issue.set_status", label: "Set issue status" },
  { value: "issue.set_assignee", label: "Set assignee" },
  { value: "issue.add_label", label: "Add label" },
  { value: "issue.comment", label: "Add comment" },
] as const;

type TriggerValue = (typeof TRIGGERS)[number]["value"];
type ActionValue = (typeof ACTIONS)[number]["value"];

function defaultTriggerJson(trigger: TriggerValue): string {
  return JSON.stringify({ type: trigger });
}

function defaultActionJson(action: ActionValue): string {
  switch (action) {
    case "issue.set_status":
      return JSON.stringify({ type: action, status: "done" });
    case "issue.set_assignee":
      return JSON.stringify({ type: action, assigneeId: null });
    case "issue.add_label":
      return JSON.stringify({ type: action, labelName: "automated" });
    case "issue.comment":
      return JSON.stringify({ type: action, body: "Updated by automation." });
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

/** Automations settings — list rules and create new ones. */
export function AutomationsPage() {
  const rules = useQuery(api.automations.listRules);
  const createRule = useMutation(api.automations.createRule);
  const setEnabled = useMutation(api.automations.setEnabled);
  const removeRule = useMutation(api.automations.removeRule);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<TriggerValue>("issue.status_changed");
  const [action, setAction] = useState<ActionValue>("issue.comment");
  const [conditions, setConditions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setSubmitting(true);
    try {
      await createRule({
        name: trimmed,
        trigger: defaultTriggerJson(trigger),
        conditions: conditions.trim() || undefined,
        actions: defaultActionJson(action),
        enabled: true,
      });
      toast.success("Rule created");
      setOpen(false);
      setName("");
      setConditions("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create rule");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRule = (ruleId: Id<"automationRules">, enabled: boolean) => {
    setEnabled({ ruleId, enabled }).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to update rule");
    });
  };

  const deleteRule = (ruleId: Id<"automationRules">) => {
    removeRule({ ruleId }).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete rule");
    });
  };

  return (
    <FeatureGate feature="automations">
      <>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold">Automations</h1>
            <p className="text-xs text-muted-foreground">
              Trigger actions when issues or service requests change.
            </p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Create rule
          </Button>
        </div>

        {rules === undefined ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : rules.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
            <Zap className="size-8 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium">No automation rules</p>
              <p className="text-xs text-muted-foreground">
                Create a rule to automate repetitive workflows.
              </p>
            </div>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Create rule
            </Button>
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {rules.map((rule) => (
              <div
                key={rule._id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{rule.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {rule.triggerSummary} → {rule.actionSummary} ·{" "}
                    {formatDayWithYear(rule.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(checked) => toggleRule(rule._id, checked)}
                    aria-label={`Toggle ${rule.name}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground"
                    aria-label={`Delete ${rule.name}`}
                    onClick={() => deleteRule(rule._id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create automation rule</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rule-name">Name</Label>
                <Input
                  id="rule-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="When issue is done, comment"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Trigger</Label>
                <Select
                  value={trigger}
                  onValueChange={(value) => setTrigger(value as TriggerValue)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGERS.map((entry) => (
                      <SelectItem key={entry.value} value={entry.value}>
                        {entry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Action</Label>
                <Select
                  value={action}
                  onValueChange={(value) => setAction(value as ActionValue)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map((entry) => (
                      <SelectItem key={entry.value} value={entry.value}>
                        {entry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rule-conditions">Conditions (JSON, optional)</Label>
                <Textarea
                  id="rule-conditions"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder='{"status":"done"}'
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button disabled={!name.trim() || submitting} onClick={() => void handleCreate()}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : "Create rule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    </FeatureGate>
  );
}
