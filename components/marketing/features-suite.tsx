import {
  BookOpen,
  Bot,
  Headphones,
  Kanban,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { Section, SectionHeading } from "@/components/marketing/section";

const PILLARS: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
}[] = [
  {
    icon: Kanban,
    eyebrow: "Plan",
    title: "Issues, boards, and cycles",
    description:
      "Track delivery work the way fast teams expect — kanban boards, saved views, cycles, and keyboard-first navigation.",
  },
  {
    icon: BookOpen,
    eyebrow: "Knowledge",
    title: "Docs and Discovery",
    description:
      "Runbooks and specs live next to the backlog. Capture ideas on a discovery board and promote the best into issues.",
  },
  {
    icon: Headphones,
    eyebrow: "Service",
    title: "Customer service desk",
    description:
      "A public portal for requests, agent queues with SLAs, and one-click conversion into dev issues on Enterprise.",
  },
  {
    icon: Bot,
    eyebrow: "AI",
    title: "Workspace-aware agent",
    description:
      "Search issues and docs, draft standups, and file work — with org-scoped tools and the same permissions as your team.",
  },
];

export function FeaturesSuite() {
  return (
    <Section id="suite">
      <SectionHeading
        eyebrow="The Manut suite"
        title="One teamwork platform — Plan, Knowledge, Service, and AI"
        lede="Manut is more than an issue tracker. Four connected modules share one workspace, one search bar, and one AI agent that understands all of it."
        align="center"
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {PILLARS.map(({ icon: Icon, eyebrow, title, description }) => (
          <article
            key={eyebrow}
            className="rounded-xl border bg-card p-6 transition-colors hover:bg-muted/30"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Icon className="size-4" />
              {eyebrow}
            </div>
            <h3 className="mt-3 text-base font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </article>
        ))}
      </div>
      <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground">
        <Lightbulb className="mb-0.5 inline size-3.5" /> Free includes Plan and
        read-only Knowledge. Pro unlocks doc spaces, Discovery, and AI.
        Enterprise adds Service desk and Automations.
      </p>
    </Section>
  );
}
