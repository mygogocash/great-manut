"use client";

import { DiscoveryPage } from "@/components/discovery/discovery-page";
import { FeatureGate } from "@/components/billing/feature-gate";

/** Product discovery — ideas kanban and impact/effort matrix. */
export function DiscoveryIndexView() {
  return (
    <FeatureGate feature="discovery">
      <DiscoveryPage />
    </FeatureGate>
  );
}
