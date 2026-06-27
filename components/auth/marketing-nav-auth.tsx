"use client";

import Link from "next/link";
import { Authenticated, Unauthenticated } from "convex/react";
import { Button } from "@/components/ui/button";

export function MarketingNavAuth() {
  return (
    <>
      <Unauthenticated>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sign-in">Log in</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/sign-up">Sign up</Link>
        </Button>
      </Unauthenticated>
      <Authenticated>
        <Button size="sm" asChild>
          <Link href="/onboarding">Open app</Link>
        </Button>
      </Authenticated>
    </>
  );
}
