import dynamic from "next/dynamic";
import { Cta } from "@/components/marketing/cta";
import { Faq } from "@/components/marketing/faq";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { FeaturesAi } from "@/components/marketing/features-ai";
import { FeaturesIssues } from "@/components/marketing/features-issues";
import { FeaturesKeyboard } from "@/components/marketing/features-keyboard";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { LandingJsonLd } from "@/components/marketing/json-ld";
import { LogoCloud } from "@/components/marketing/logo-cloud";
import { Testimonials } from "@/components/marketing/testimonials";
import { buildPageMetadata } from "@/lib/seo";

// Split @dnd-kit out of the initial landing chunk — board is below-the-fold.
const FeaturesBoard = dynamic(() =>
  import("@/components/marketing/features-board").then((m) => ({
    default: m.FeaturesBoard,
  })),
);

export const metadata = buildPageMetadata({
  title: "Manut — The issue tracker built for speed",
  description:
    "Manut is an issue tracker for product teams — issues, kanban boards, cycles, and an AI agent in one keyboard-first workspace. Free for 3 teammates. No credit card.",
  path: "/",
  openGraphTitle: "Manut — Issue tracker built for speed",
  openGraphDescription:
    "Plan, track, and ship with issues, kanban boards, and cycles. AI agent on Pro. Start free — no credit card.",
});

export default function LandingPage() {
  return (
    <>
      <LandingJsonLd />
      <main>
        <Hero />
        <LogoCloud />
        <FeaturesIssues />
        <FeaturesBoard />
        <FeaturesAi />
        <FeaturesKeyboard />
        <FeatureGrid />
        <Testimonials />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
