import { Activity, AtSign, GitBranch, Zap } from "lucide-react";
import { FeatureBullet } from "@/components/marketing/feature-bullet";
import { MockIssueDetail } from "@/components/marketing/mock-issue-detail";
import { Section, SectionHeading } from "@/components/marketing/section";

export function FeaturesIssues() {
  return (
    <Section id="issues">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="01 · Issues"
            title="Issues that keep pace with your team"
            lede="File work in seconds, triage with a single key, and watch every change sync live — no refresh button, no waiting on spinners."
          />
          <div className="mt-10 grid gap-7 sm:grid-cols-2">
            <FeatureBullet
              icon={Zap}
              title="Fast by default"
              description="Optimistic updates land before your hand leaves the keyboard. The issue tracker stays out of your way."
            />
            <FeatureBullet
              icon={GitBranch}
              title="Sub-issues & relations"
              description="Break epics down, mark blockers and duplicates, and keep every dependency visible on the issue."
            />
            <FeatureBullet
              icon={AtSign}
              title="Comments & @mentions"
              description="Discussion lives on the issue — @mention a teammate and they're in the loop instantly."
            />
            <FeatureBullet
              icon={Activity}
              title="A full audit trail"
              description="Every status change, assignment, and edit lands in the activity feed automatically."
            />
          </div>
        </div>
        <MockIssueDetail />
      </div>
    </Section>
  );
}
