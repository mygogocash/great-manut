"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FeatureGate } from "@/components/billing/feature-gate";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatDayWithYear } from "@/components/projects/dates";
import {
  SecondaryPanelAside,
  SecondaryPanelSheet,
  SecondaryPanelTrigger,
  useSecondaryPanel,
} from "@/components/shell/secondary-panel";
import { CONTENT_PX } from "@/lib/responsive";
import { cn } from "@/lib/utils";
import {
  SERVICE_REQUEST_STATUSES,
  serviceRequestStatusLabel,
  type ServiceRequestStatus,
} from "./service-desk-meta";

const UNASSIGNED = "unassigned";

function statusBadgeClass(status: ServiceRequestStatus): string {
  switch (status) {
    case "new":
      return "bg-blue-500/15 text-blue-400";
    case "waiting":
      return "bg-amber-500/15 text-amber-400";
    case "in_progress":
      return "bg-violet-500/15 text-violet-400";
    case "resolved":
      return "bg-emerald-500/15 text-emerald-400";
    case "closed":
      return "bg-muted text-muted-foreground";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

/** Service request detail — assign, status, convert to issue. */
export function ServiceRequestDetail({
  requestId,
}: {
  requestId: Id<"serviceRequests">;
}) {
  const params = useParams<{ orgSlug: string }>();
  const router = useRouter();
  const request = useQuery(api.serviceDesk.get, { requestId });
  const members = useQuery(api.organizations.listMembers);
  const teams = useQuery(api.teams.list);
  const assign = useMutation(api.serviceDesk.assign);
  const updateStatus = useMutation(api.serviceDesk.updateStatus);
  const convertToIssue = useMutation(api.serviceDesk.convertToIssue);

  const [convertOpen, setConvertOpen] = useState(false);
  const [teamId, setTeamId] = useState<Id<"teams"> | "">("");
  const [converting, setConverting] = useState(false);
  const { open: propertiesOpen, setOpen: setPropertiesOpen } = useSecondaryPanel();

  const handleAssign = (value: string) => {
    assign({
      requestId,
      assigneeId: value === UNASSIGNED ? null : (value as Id<"users">),
    }).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to assign");
    });
  };

  const handleStatus = (status: ServiceRequestStatus) => {
    updateStatus({ requestId, status }).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    });
  };

  const handleConvert = async () => {
    if (!teamId) {
      return;
    }
    setConverting(true);
    try {
      const { issueId, issueKey } = await convertToIssue({ requestId, teamId });
      toast.success(`Created ${issueKey}`);
      setConvertOpen(false);
      router.push(`/${params.orgSlug}/issue/${issueId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to convert");
    } finally {
      setConverting(false);
    }
  };

  const propertiesPanel = request ? (
    <div className="flex flex-col gap-3">
      <PropertyRow label="Status">
        <Select value={request.status} onValueChange={handleStatus}>
          <SelectTrigger size="sm" className="w-36 border-none shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_REQUEST_STATUSES.map((entry) => (
              <SelectItem key={entry.value} value={entry.value}>
                {entry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PropertyRow>

      <PropertyRow label="Assignee">
        <Select
          value={request.assigneeId ?? UNASSIGNED}
          onValueChange={handleAssign}
        >
          <SelectTrigger size="sm" className="w-36 border-none shadow-none">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>
              <span className="text-muted-foreground">Unassigned</span>
            </SelectItem>
            {members?.map((member) => (
              <SelectItem key={member.userId} value={member.userId}>
                <div className="flex items-center gap-1.5">
                  <UserAvatar name={member.name} imageUrl={member.imageUrl} />
                  {member.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PropertyRow>

      <PropertyRow label="Due">
        <span className="text-xs">
          {request.dueAt ? formatDayWithYear(request.dueAt) : "—"}
        </span>
      </PropertyRow>

      <PropertyRow label="Requester">
        <span className="truncate text-xs">{request.requesterEmail}</span>
      </PropertyRow>
    </div>
  ) : null;

  return (
    <FeatureGate feature="service_desk">
      {request === undefined ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : request === null ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Request not found.
        </div>
      ) : (
        <>
          <header className="flex h-12 shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
              <Button variant="ghost" size="icon" className="min-h-11 min-w-11 shrink-0" asChild>
                <Link href={`/${params.orgSlug}/service`}>
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {request.displayNumber}
              </span>
              <span className="truncate font-medium">{request.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <SecondaryPanelTrigger
                label="Properties"
                onClick={() => setPropertiesOpen(true)}
              />
              {!request.linkedIssueId && (
                <Button size="sm" variant="outline" onClick={() => setConvertOpen(true)}>
                  Convert to issue
                </Button>
              )}
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <ScrollArea className="flex-1">
              <div className={cn("mx-auto flex max-w-3xl flex-col gap-4 py-8", CONTENT_PX)}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn("text-[10px] font-normal", statusBadgeClass(request.status))}
                  >
                    {serviceRequestStatusLabel(request.status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {request.requestTypeName}
                  </span>
                </div>

                <div>
                  <h1 className="text-xl font-semibold">{request.title}</h1>
                  <p className="mt-1 text-xs text-muted-foreground">
                    From {request.requesterName ?? request.requesterEmail} ·{" "}
                    {formatDayWithYear(request.createdAt)}
                  </p>
                </div>

                <Separator />

                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {request.description}
                </div>

                {request.linkedIssueKey && request.linkedIssueId && (
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Linked issue</p>
                    <Link
                      href={`/${params.orgSlug}/issue/${request.linkedIssueId}`}
                      className="mt-1 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                    >
                      {request.linkedIssueKey}
                      <ExternalLink className="size-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </ScrollArea>

            <SecondaryPanelAside title="Properties">
              {propertiesPanel}
            </SecondaryPanelAside>
          </div>

          <SecondaryPanelSheet
            title="Properties"
            open={propertiesOpen}
            onOpenChange={setPropertiesOpen}
          >
            {propertiesPanel}
          </SecondaryPanelSheet>

          <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Convert to issue</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Create a dev issue from this request and link it back here.
              </p>
              <Select
                value={teamId}
                onValueChange={(value) => setTeamId(value as Id<"teams">)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams?.map((team) => (
                    <SelectItem key={team._id} value={team._id}>
                      {team.name} ({team.key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConvertOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={!teamId || converting} onClick={() => void handleConvert()}>
                  {converting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Create issue"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </FeatureGate>
  );
}
