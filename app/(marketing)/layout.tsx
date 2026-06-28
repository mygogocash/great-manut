import type { Metadata } from "next";
import { MarketingNavAuth } from "@/components/auth/marketing-nav-auth";
import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import {
  marketingOpenGraphDefaults,
  marketingTwitterDefaults,
} from "@/lib/seo";
import { marketingUrl } from "@/lib/site-urls";
import Link from "next/link";

export const metadata: Metadata = {
  openGraph: {
    ...marketingOpenGraphDefaults,
    url: marketingUrl("/"),
  },
  twitter: marketingTwitterDefaults,
  alternates: {
    types: {
      "text/plain": [{ url: "/llms.txt", title: "llms.txt" }],
    },
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
          <BrandMark href="/" />
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
            <MarketingNavAuth />
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
