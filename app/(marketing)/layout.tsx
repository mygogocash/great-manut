import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { SurfaceThemeProvider } from "@/components/theme/surface-theme-provider";
import {
  marketingOpenGraphDefaults,
  marketingTwitterDefaults,
} from "@/lib/seo";
import { marketingUrl } from "@/lib/site-urls";

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
    <SurfaceThemeProvider surface="marketing">
      <div className="flex min-h-dvh flex-col">
        <MarketingHeader />
        <div className="flex-1">{children}</div>
      </div>
    </SurfaceThemeProvider>
  );
}
