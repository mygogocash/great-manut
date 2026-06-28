/** Service request status — matches `serviceRequestStatusValidator` in convex/schema. */
export type ServiceRequestStatus =
  | "new"
  | "waiting"
  | "in_progress"
  | "resolved"
  | "closed";

export type ServiceQueueFilter = "unassigned" | "mine" | "all_open";

export const SERVICE_REQUEST_STATUSES: {
  value: ServiceRequestStatus;
  label: string;
}[] = [
  { value: "new", label: "New" },
  { value: "waiting", label: "Waiting" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export function serviceRequestStatusLabel(status: ServiceRequestStatus): string {
  return (
    SERVICE_REQUEST_STATUSES.find((entry) => entry.value === status)?.label ??
    status
  );
}

export function serviceRequestStatusClass(status: ServiceRequestStatus): string {
  switch (status) {
    case "new":
      return "bg-blue-500/15 text-blue-600 dark:text-blue-400";
    case "waiting":
      return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400";
    case "in_progress":
      return "bg-purple-500/15 text-purple-600 dark:text-purple-400";
    case "resolved":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
    case "closed":
      return "bg-muted text-muted-foreground";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function formatRequestNumber(number: number): string {
  return `REQ-${number}`;
}

export function parseRequestNumber(input: string): number | null {
  const trimmed = input.trim().toUpperCase();
  const match = /^REQ-(\d+)$/.exec(trimmed);
  if (match) {
    return Number.parseInt(match[1], 10);
  }
  const digits = /^\d+$/.exec(trimmed);
  if (digits) {
    return Number.parseInt(trimmed, 10);
  }
  return null;
}

