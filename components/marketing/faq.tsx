"use client";

import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "@/lib/product-facts";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Section, SectionHeading } from "@/components/marketing/section";
import { cn } from "@/lib/utils";

function FaqItem({
  question,
  answer,
  answerId,
  defaultOpen = false,
}: {
  question: string;
  answer: string;
  answerId?: string;
  defaultOpen?: boolean;
}) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="border-b border-border/80 last:border-b-0"
    >
      <CollapsibleTrigger className="group flex w-full min-h-11 items-center justify-between gap-4 py-4 text-left">
        <h3 className="text-sm font-medium text-foreground md:text-base">
          {question}
        </h3>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p
          id={answerId}
          className="max-w-prose pb-4 text-sm leading-relaxed text-muted-foreground"
        >
          {answer}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function Faq() {
  return (
    <Section id="faq">
      <SectionHeading
        eyebrow="FAQ"
        title="Questions teams ask before they switch"
        lede="Straight answers about Manut — pricing, AI, cycles, and how to get started. No sales deck required."
        align="center"
      />
      <div className={cn("mx-auto mt-12 max-w-2xl rounded-xl border bg-card/30 px-5 md:px-6")}>
        {FAQ_ITEMS.map((item, index) => (
          <FaqItem
            key={item.question}
            question={item.question}
            answer={item.answer}
            answerId={index === 0 ? "faq-answer-0" : undefined}
            defaultOpen={index === 0}
          />
        ))}
      </div>
    </Section>
  );
}
