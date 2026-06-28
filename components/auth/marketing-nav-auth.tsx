"use client";

import Link from "next/link";
import { Authenticated, Unauthenticated } from "convex/react";
import { Button } from "@/components/ui/button";
import { appUrl } from "@/lib/site-urls";

export function MarketingNavAuth() {
  return (
    <>
      <Unauthenticated>
        <Button variant="ghost" size="sm" asChild>
          <Link href={appUrl("/sign-in")}>Log in</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href={appUrl("/sign-up")}>Sign up</Link>
        </Button>
      </Unauthenticated>
      <Authenticated>
        <Button size="sm" asChild>
          <Link href={appUrl("/onboarding")}>Open app</Link>
        </Button>
      </Authenticated>
    </>
  );
}
