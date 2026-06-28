"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { FeatureUpgradeCta } from "./feature-upgrade-cta";
import {
  useSuiteFeatureAccess,
  type SuiteFeature,
} from "./use-suite-feature-access";

/** Cosmetic plan gate for suite features. Convex enforces access in mutations. */
export function FeatureGate({
  feature,
  children,
}: {
  feature: SuiteFeature;
  children: ReactNode;
}) {
  const { isLoaded, hasAccess } = useSuiteFeatureAccess(feature);

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasAccess) {
    return <FeatureUpgradeCta feature={feature} />;
  }

  return children;
}
