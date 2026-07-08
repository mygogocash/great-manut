"use client";

import { useMutation, useQuery } from "convex/react";
import { Headphones, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { FeatureGate } from "@/components/billing/feature-gate";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDayWithYear } from "@/components/projects/dates";
import { cn } from "@/lib/utils";
import {
  serviceRequestStatusClass,
  serviceRequestStatusLabel,
  type ServiceQueueFilter,
} from "./service-desk-meta";

const QUEUE_TABS: { value: ServiceQueueFilter; label: string }[] = [
  { value: "unassigned", label: "Unassigned" },
  { value: "mine", label: "Mine" },
  { value: "all_open", label: "All open" },
];

function QueueTable({
  queue,
  orgSlug,
}: {
  queue: ServiceQueueFilter;
  orgSlug: string;
}) {
  const requests = useQuery(api.serviceDesk.listQueue, { queue });

  if (requests === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
        <Headphones className="size-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No requests in this queue.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2 p-4 md:hidden">
        {requests.map((request) => (
          <li key={request._id}>
            <Link
              href={`/${orgSlug}/service/${request._id}`}
              className="block rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {request.displayNumber}
                </span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0 text-[10px] font-normal",
                    serviceRequestStatusClass(request.status)
                  )}
                >
                  {serviceRequestStatusLabel(request.status)}
                </Badge>
              </div>
              <p className="mt-1.5 line-clamp-2 text-sm font-medium">{request.title}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {request.requestTypeName} ·{" "}
                {request.requesterName ?? request.requesterEmail}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <ScrollArea className="hidden flex-1 md:flex">
        <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-24">Request</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Requester</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Due</TableHead>
            <TableHead className="hidden lg:table-cell">Assignee</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request._id} className="h-9">
              <TableCell className="font-mono text-xs tabular-nums">
                <Link
                  href={`/${orgSlug}/service/${request._id}`}
                  className="hover:text-foreground hover:underline"
                >
                  {request.displayNumber}
                </Link>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {request.requestTypeName}
              </TableCell>
              <TableCell className="max-w-[240px] truncate text-sm">
                <Link
                  href={`/${orgSlug}/service/${request._id}`}
                  className="hover:underline"
                >
                  {request.title}
                </Link>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {request.requesterName ?? request.requesterEmail}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn("text-[10px] font-normal", serviceRequestStatusClass(request.status))}
                >
                  {serviceRequestStatusLabel(request.status)}
                </Badge>
              </TableCell>
              <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                {request.dueAt ? formatDayWithYear(request.dueAt) : "—"}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {request.assigneeName ? (
                  <div className="flex items-center gap-1.5">
                    <UserAvatar
                      name={request.assigneeName}
                      imageUrl={request.assigneeImageUrl}
                    />
                    <span className="truncate text-xs">{request.assigneeName}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </ScrollArea>
    </>
  );
}

/** Agent queue — unassigned, mine, and all open service requests. */
export function ServiceDeskQueueView() {
  const params = useParams<{ orgSlug: string }>();
  const ensureDefaults = useMutation(api.serviceDesk.ensureDefaults);

  useEffect(() => {
    void ensureDefaults({});
  }, [ensureDefaults]);

  return (
    <FeatureGate feature="service_desk">
      <>
        <header className="flex h-12 shrink-0 items-center border-b px-4">
          <div className="flex items-center gap-2 text-sm">
            <Headphones className="size-4 text-muted-foreground" />
            <span className="font-medium">Service desk</span>
          </div>
        </header>

        <Tabs defaultValue="unassigned" className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="border-b px-4 py-2">
            <TabsList variant="line" className="h-8 bg-transparent p-0">
              {QUEUE_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="h-7 px-3 text-xs">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {QUEUE_TABS.map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              className="mt-0 flex min-h-0 flex-1 flex-col"
            >
              <QueueTable queue={tab.value} orgSlug={params.orgSlug} />
            </TabsContent>
          ))}
        </Tabs>
      </>
    </FeatureGate>
  );
}
