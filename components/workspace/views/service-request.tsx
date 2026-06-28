"use client";

import { Id } from "@/convex/_generated/dataModel";
import { ServiceRequestDetail } from "@/components/service-desk/request-detail";

/** Service request detail — single request agent view. */
export function ServiceRequestView({
  requestId,
}: {
  requestId: Id<"serviceRequests">;
}) {
  return <ServiceRequestDetail requestId={requestId} />;
}
