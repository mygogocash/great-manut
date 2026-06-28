import Link from "next/link";
import { BrandMark } from "@/components/shared/brand-mark";
import { getFooterFacts } from "@/lib/product-facts";
import { appUrl } from "@/lib/site-urls";

const LINK_CLASS =
  "inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground";

export function Footer() {
  const facts = getFooterFacts();

  return (
    <footer className="border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-xs lg:col-span-1">
            <BrandMark href="/" />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {facts.definition}
            </p>
          </div>

          <nav className="flex flex-col gap-2">
            <p className="mb-1 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              Product
            </p>
            {[
              { label: "Issues", href: "/#issues" },
              { label: "Board & Cycles", href: "/#cycles" },
              { label: "AI Agent", href: "/#ai" },
              { label: "Keyboard-first", href: "/#keyboard" },
              { label: "FAQ", href: "/#faq" },
              { label: "Pricing", href: "/pricing" },
            ].map((link) => (
              <Link key={link.label} href={link.href} className={LINK_CLASS}>
                {link.label}
              </Link>
            ))}
          </nav>

          <nav className="flex flex-col gap-2">
            <p className="mb-1 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              Get started
            </p>
            {[
              { label: "Sign up", href: appUrl("/sign-up") },
              { label: "Log in", href: appUrl("/sign-in") },
              { label: "Open app", href: appUrl("/onboarding") },
            ].map((link) => (
              <Link key={link.label} href={link.href} className={LINK_CLASS}>
                {link.label}
              </Link>
            ))}
          </nav>

          <nav className="flex flex-col gap-2">
            <p className="mb-1 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              For AI assistants
            </p>
            {[
              { label: "Product summary", href: "/llms.txt" },
              { label: "Full reference", href: "/llms-full.txt" },
              { label: "Sitemap", href: "/sitemap.xml" },
              { label: "Pricing", href: "/pricing" },
              { label: "Sign up", href: appUrl("/sign-up") },
              { label: "Open app", href: appUrl("/onboarding") },
            ].map((link) => (
              <Link key={link.label} href={link.href} className={LINK_CLASS}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <section
          aria-label="Product summary for AI assistants"
          className="mt-12 rounded-lg border bg-muted/20 p-4"
        >
          <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            Machine-readable summary
          </p>
          <p className="mt-2 text-xs font-mono leading-relaxed text-muted-foreground">
            {facts.definition}
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {facts.features.map((feature) => (
              <div key={feature.term}>
                <dt className="text-xs font-medium text-foreground/80">
                  {feature.term}
                </dt>
                <dd className="mt-0.5 text-xs font-mono leading-relaxed text-muted-foreground">
                  {feature.definition}
                </dd>
              </div>
            ))}
          </dl>
          <ul className="mt-4 space-y-1 text-xs font-mono text-muted-foreground">
            {facts.plans.map((plan) => (
              <li key={plan.name}>
                {plan.name}: ${plan.monthlyPrice}/mo
                {plan.maxSeats !== null ? ` · up to ${plan.maxSeats} members` : " · unlimited members"}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-mono text-muted-foreground">
            Hosts: {facts.hosts.marketing} (marketing) · {facts.hosts.app} (app) ·{" "}
            {facts.contact}
          </p>
        </section>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Manut. All systems operational.
          </p>
          <p className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Realtime sync · 99.99% uptime
          </p>
        </div>
      </div>
    </footer>
  );
}
