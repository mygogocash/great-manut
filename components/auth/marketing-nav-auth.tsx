"use client";

import Link from "next/link";
import { Authenticated, Unauthenticated } from "convex/react";
import { Button } from "@/components/ui/button";
import { appUrl } from "@/lib/site-urls";

export function MarketingNavAuth({
  layout = "inline",
}: {
  layout?: "inline" | "stacked";
}) {
  const stacked = layout === "stacked";

  return (
    <div className={stacked ? "flex flex-col gap-2" : "flex items-center gap-2"}>
      <Unauthenticated>
        <Button
          variant="ghost"
          size={stacked ? "default" : "sm"}
          className={stacked ? "min-h-11 w-full justify-center" : undefined}
          asChild
        >
          <Link href={appUrl("/sign-in")}>Log in</Link>
        </Button>
        <Button
          size={stacked ? "default" : "sm"}
          className={stacked ? "min-h-11 w-full justify-center" : undefined}
          asChild
        >
          <Link href={appUrl("/sign-up")}>Sign up</Link>
        </Button>
      </Unauthenticated>
      <Authenticated>
        <Button
          size={stacked ? "default" : "sm"}
          className={stacked ? "min-h-11 w-full justify-center" : undefined}
          asChild
        >
          <Link href={appUrl("/onboarding")}>Open app</Link>
        </Button>
      </Authenticated>
    </div>
  );
}
