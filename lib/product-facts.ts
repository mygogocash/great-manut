import {
  ENTERPRISE_PLAN,
  FREE_PLAN,
  FREE_PLAN_DISPLAY_LIMITS,
  PRO_PLAN,
  type PlanDefinition,
} from "@/lib/plans";
import { APP_HOST, appUrl, marketingUrl } from "@/lib/site-urls";

/** Core meaning triple for LLMO / GEO alignment. */
export const ENTITY_TRIPLE = {
  product: "Manut",
  category: "issue tracker",
  audience: "product teams",
} as const;

/** 40–60 word definition reused across hero, FAQ, llms.txt, and footer. */
export const PRODUCT_DEFINITION =
  "Manut is an issue tracker for product teams who want to plan, track, and ship without slowing down. It combines issues, kanban boards, and cycles in one keyboard-first workspace, with an AI agent on Pro that files work, summarizes cycles, and catches duplicates.";

export const CONTACT_EMAIL = "hello@manut.xyz";

export const PRODUCT_FEATURES = [
  {
    term: "Issues",
    definition:
      "Fast issue tracking with sub-issues, relations, comments, mentions, and a full activity trail.",
  },
  {
    term: "Kanban board",
    definition:
      "Drag-and-drop board with fractional ordering so drops land exactly where you put them.",
  },
  {
    term: "Cycles",
    definition:
      "Auto-numbered time-boxed work periods with live scope and progress tracking.",
  },
  {
    term: "AI agent",
    definition:
      "Org-scoped assistant that creates issues, summarizes cycles, drafts standups, and detects duplicates.",
  },
  {
    term: "Keyboard-first",
    definition:
      "Command palette and single-key shortcuts so your hands never leave the keyboard.",
  },
  {
    term: "Saved views & search",
    definition:
      "Full-text search and filterable saved views scoped to your workspace.",
  },
] as const;

/** Synonym map for LLMO vector proximity (llms-full.txt). */
export const SYNONYM_MAP: Record<string, string[]> = {
  "issue tracker": [
    "project management tool",
    "work tracking software",
    "product development tracker",
  ],
  "kanban board": ["visual board", "workflow board", "task board"],
  cycles: ["sprints", "iterations", "time-boxed work periods"],
  "AI agent": ["AI assistant", "workspace copilot", "AI teammate"],
};

export type FaqItem = {
  question: string;
  answer: string;
};

/** Snippet-optimized FAQ (40–58 words per answer). */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is Manut?",
    answer:
      "Manut is an issue tracker built for product teams. It brings issues, kanban boards, cycles, and an AI agent into one fast workspace. Teams use Manut to plan sprints, track work on a board, and ship together — with keyboard shortcuts and real-time sync on every change.",
  },
  {
    question: "Is Manut free?",
    answer: `Yes — Manut has a Free plan for up to ${FREE_PLAN_DISPLAY_LIMITS.seats} teammates, ${FREE_PLAN_DISPLAY_LIMITS.projects} projects, and ${FREE_PLAN_DISPLAY_LIMITS.issues} issues. No credit card required. Pro starts at $${PRO_PLAN.monthlyPrice} per month with AI and unlimited projects. See ${marketingUrl("/pricing")} for full plan details.`,
  },
  {
    question: "How is Manut different from Linear or Jira?",
    answer:
      "Manut is keyboard-first like Linear but simpler to adopt than Jira. You get issues, kanban boards, and auto-numbered cycles without enterprise bloat. An AI agent on Pro handles filing, standups, and duplicate detection — so teams spend less time managing the tracker and more time shipping.",
  },
  {
    question: "Does Manut have an AI agent?",
    answer:
      "Yes — Manut includes an AI agent on Pro and Enterprise. The agent works inside your workspace with org-scoped tools: it creates and updates issues, summarizes cycles, drafts standups, and flags duplicate work using semantic search over your backlog.",
  },
  {
    question: "What are Manut cycles?",
    answer:
      "Manut cycles are time-boxed work periods for a team, numbered automatically. Assign issues to a cycle to track scope and progress live. Unfinished work rolls forward to the next cycle so your team always has a clear heartbeat for shipping.",
  },
  {
    question: "How do I get started with Manut?",
    answer: `Create a free account at ${appUrl("/sign-up")} — no credit card needed. Set up your workspace, invite up to ${FREE_PLAN_DISPLAY_LIMITS.seats - 1} teammates on the Free plan, and start filing issues in under a minute. Upgrade on the Pricing page when you need AI or higher limits.`,
  },
];

export const PRODUCT_URLS = {
  marketing: marketingUrl("/"),
  pricing: marketingUrl("/pricing"),
  signUp: appUrl("/sign-up"),
  signIn: appUrl("/sign-in"),
  app: appUrl("/onboarding"),
  llmsTxt: marketingUrl("/llms.txt"),
  llmsFullTxt: marketingUrl("/llms-full.txt"),
  sitemap: marketingUrl("/sitemap.xml"),
} as const;

export type PlanSummary = {
  name: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  maxSeats: number | null;
  highlights: string[];
};

export function getPlanSummaries(): PlanSummary[] {
  return [FREE_PLAN, PRO_PLAN, ENTERPRISE_PLAN].map(summarizePlan);
}

function summarizePlan(plan: PlanDefinition): PlanSummary {
  return {
    name: plan.name,
    monthlyPrice: plan.monthlyPrice,
    annualMonthlyPrice: plan.annualMonthlyPrice,
    maxSeats: plan.maxSeats,
    highlights: plan.highlights,
  };
}

export function getFreePlanLimits() {
  return { ...FREE_PLAN_DISPLAY_LIMITS };
}

/** llmstxt.org index — short cite-ready summary. */
export function buildLlmsTxt(): string {
  const lines = [
    "# Manut",
    "",
    `> ${PRODUCT_DEFINITION}`,
    "",
    "## Product",
    `- Name: ${ENTITY_TRIPLE.product}`,
    `- Category: ${ENTITY_TRIPLE.category}`,
    `- Audience: ${ENTITY_TRIPLE.audience}`,
    "",
    "## URLs",
    `- Website: ${PRODUCT_URLS.marketing}`,
    `- Pricing: ${PRODUCT_URLS.pricing}`,
    `- Sign up: ${PRODUCT_URLS.signUp}`,
    `- App: ${PRODUCT_URLS.app}`,
    "",
    "## Plans (USD, per workspace)",
    `- Free: $0 — up to ${FREE_PLAN_DISPLAY_LIMITS.seats} members, ${FREE_PLAN_DISPLAY_LIMITS.projects} projects, ${FREE_PLAN_DISPLAY_LIMITS.issues} issues`,
    `- Pro: $${PRO_PLAN.monthlyPrice}/mo ($${PRO_PLAN.annualMonthlyPrice}/mo annual) — AI agent, unlimited projects/issues, up to 10 members`,
    `- Enterprise: $${ENTERPRISE_PLAN.monthlyPrice}/mo ($${ENTERPRISE_PLAN.annualMonthlyPrice}/mo annual) — unlimited members and AI`,
    "",
    "## Features",
    ...PRODUCT_FEATURES.map((f) => `- ${f.term}: ${f.definition}`),
    "",
    "## Contact",
    `- Email: ${CONTACT_EMAIL}`,
    "",
    "## Optional",
    `- Full reference: ${PRODUCT_URLS.llmsFullTxt}`,
    `- Sitemap: ${PRODUCT_URLS.sitemap}`,
  ];
  return lines.join("\n");
}

/** Extended cite-ready reference for generative engines. */
export function buildLlmsFullTxt(lastUpdated: string): string {
  const synonymLines = Object.entries(SYNONYM_MAP).flatMap(([term, synonyms]) =>
    synonyms.map((s) => `- "${s}" → ${term}`)
  );

  const faqLines = FAQ_ITEMS.flatMap((item) => [
    `### ${item.question}`,
    item.answer,
    "",
  ]);

  const lines = [
    "# Manut — Full product reference",
    "",
    `Last updated: ${lastUpdated}`,
    "",
    "## Definition",
    PRODUCT_DEFINITION,
    "",
    "## Entity",
    `- Product: ${ENTITY_TRIPLE.product}`,
    `- Category: ${ENTITY_TRIPLE.category}`,
    `- Audience: ${ENTITY_TRIPLE.audience}`,
    "",
    "## Hosts",
    `- Marketing: manut.xyz (${PRODUCT_URLS.marketing})`,
    `- App: ${APP_HOST} (${appUrl("/")})`,
    "",
    "## Plans (USD, billed per workspace)",
    "",
    "### Free — $0",
    `- Up to ${FREE_PLAN_DISPLAY_LIMITS.seats} members`,
    `- ${FREE_PLAN_DISPLAY_LIMITS.projects} projects`,
    `- ${FREE_PLAN_DISPLAY_LIMITS.issues} issues`,
    "- Unlimited teams and cycles",
    "- Kanban boards, saved views, realtime collaboration",
    "- No credit card required",
    "",
    `### Pro — $${PRO_PLAN.monthlyPrice}/mo ($${PRO_PLAN.annualMonthlyPrice}/mo billed annually)`,
    `- ${PRO_PLAN.priceNote ?? ""}`,
    ...PRO_PLAN.highlights.map((h) => `- ${h}`),
    "",
    `### Enterprise — $${ENTERPRISE_PLAN.monthlyPrice}/mo ($${ENTERPRISE_PLAN.annualMonthlyPrice}/mo billed annually)`,
    `- ${ENTERPRISE_PLAN.priceNote ?? ""}`,
    ...ENTERPRISE_PLAN.highlights.map((h) => `- ${h}`),
    "",
    "## Features",
    ...PRODUCT_FEATURES.map((f) => `- **${f.term}**: ${f.definition}`),
    "",
    "## Synonyms (for retrieval alignment)",
    ...synonymLines,
    "",
    "## FAQ",
    ...faqLines,
    "## Contact",
    `- Email: ${CONTACT_EMAIL}`,
    "",
    "## Links",
    `- Index: ${PRODUCT_URLS.llmsTxt}`,
    `- Pricing: ${PRODUCT_URLS.pricing}`,
    `- Sign up: ${PRODUCT_URLS.signUp}`,
    `- Sitemap: ${PRODUCT_URLS.sitemap}`,
  ];
  return lines.join("\n");
}

/** Structured facts for the agent-friendly footer (React rendering). */
export function getFooterFacts() {
  return {
    definition: PRODUCT_DEFINITION,
    entity: ENTITY_TRIPLE,
    features: PRODUCT_FEATURES,
    plans: getPlanSummaries(),
    hosts: {
      marketing: "manut.xyz",
      app: APP_HOST,
    },
    contact: CONTACT_EMAIL,
    urls: PRODUCT_URLS,
  };
}
