import {
  BUSINESS_PLAN_DEF,
  FREE_PLAN,
  type PlanDefinition,
} from "@/lib/plans";
import { formatStorageGb, storageIncludedBytes } from "@/lib/usage-pricing";
import { APP_HOST, appUrl, marketingUrl } from "@/lib/site-urls";

/** Core meaning triple for LLMO / GEO alignment. */
export const ENTITY_TRIPLE = {
  product: "Manut",
  category: "issue tracker",
  audience: "product teams",
} as const;

/** Short hero hook for human visitors. */
export const HERO_LEDE =
  "Manut is how fast product teams plan, capture knowledge, serve customers, and ship — issues, docs, discovery, service desk, and an AI agent in one keyboard-first workspace.";

/** One-line footer blurb (avoid duplicating the full definition below). */
export const FOOTER_TAGLINE =
  "The teamwork suite built for speed — Plan, Knowledge, Service, and AI in one workspace.";

/** 40–60 word definition for FAQ, llms.txt, speakable schema, and agent footer. */
export const PRODUCT_DEFINITION =
  "Manut is a teamwork suite for product teams who want to plan, track, and ship without slowing down. It combines Plan (issues, boards, cycles), Knowledge (docs and discovery), Service (customer portal and queues), and AI (managed credits or BYOK) in one keyboard-first workspace.";

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
    term: "Knowledge (Docs)",
    definition:
      "Team wikis with version history and issue links; read on Free, create spaces on Pro.",
  },
  {
    term: "Discovery",
    definition:
      "Ideas board with impact/effort scoring and promote-to-issue on Pro and Enterprise.",
  },
  {
    term: "Service desk",
    definition:
      "Customer portal, agent queues, and request-to-issue conversion on Enterprise.",
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
      "Manut is a teamwork suite for product teams. It brings Plan (issues, boards, cycles), Knowledge (docs and discovery), Service (service desk), and AI (managed credits or BYOK) into one fast workspace — with keyboard shortcuts and real-time sync on every change.",
  },
  {
    question: "Is Manut free?",
    answer: `Yes — Manut has a Free plan with unlimited teammates, ${formatStorageGb(storageIncludedBytes("free"))} storage, and full suite access. AI uses prepaid credit top-ups or your own API key. Business is $${BUSINESS_PLAN_DEF.monthlyPrice}/mo for more storage. See ${marketingUrl("/pricing")}.`,
  },
  {
    question: "How is Manut different from Linear or Jira?",
    answer:
      "Manut is keyboard-first like Linear but simpler to adopt than Jira. You get issues, kanban boards, and auto-numbered cycles without enterprise bloat. The AI agent handles filing, standups, and duplicate detection — with prepaid credits or BYOK so inference cost stays under your control.",
  },
  {
    question: "Does Manut have an AI agent?",
    answer:
      "Yes — every workspace can use the AI agent via prepaid credit packs or BYOK (Google Vertex, OpenAI, Claude, OpenRouter). The agent works inside your workspace with org-scoped tools: it creates and updates issues, summarizes cycles, drafts standups, and flags duplicate work.",
  },
  {
    question: "What are Manut cycles?",
    answer:
      "Manut cycles are time-boxed work periods for a team, numbered automatically. Assign issues to a cycle to track scope and progress live. Unfinished work rolls forward to the next cycle so your team always has a clear heartbeat for shipping.",
  },
  {
    question: "How do I get started with Manut?",
    answer: `Create a free account at ${appUrl("/sign-up")} — no credit card needed. Set up your workspace, invite unlimited teammates, and start filing issues in under a minute. Top up AI credits or connect BYOK when you need the agent.`,
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
  highlights: string[];
};

export function getPlanSummaries(): PlanSummary[] {
  return [FREE_PLAN, BUSINESS_PLAN_DEF].map(summarizePlan);
}

function summarizePlan(plan: PlanDefinition): PlanSummary {
  return {
    name: plan.name,
    monthlyPrice: plan.monthlyPrice,
    annualMonthlyPrice: plan.annualMonthlyPrice,
    highlights: plan.highlights,
  };
}

export function getFreePlanLimits() {
  return {
    storageBytes: storageIncludedBytes("free"),
    storageLabel: formatStorageGb(storageIncludedBytes("free")),
  };
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
    `- Free: $0 — unlimited members, ${formatStorageGb(storageIncludedBytes("free"))} storage, AI top-up or BYOK`,
    `- Business: $${BUSINESS_PLAN_DEF.monthlyPrice}/mo ($${BUSINESS_PLAN_DEF.annualMonthlyPrice}/mo annual) — ${formatStorageGb(storageIncludedBytes("business"))} storage + metered overage`,
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
    "- Unlimited members, projects, and issues",
    `- ${formatStorageGb(storageIncludedBytes("free"))} attachment storage`,
    "- Full suite: docs, discovery, service desk, automations",
    "- AI via credit top-up or BYOK",
    "- No credit card required",
    "",
    `### Business — $${BUSINESS_PLAN_DEF.monthlyPrice}/mo ($${BUSINESS_PLAN_DEF.annualMonthlyPrice}/mo billed annually)`,
    `- ${BUSINESS_PLAN_DEF.priceNote ?? ""}`,
    ...BUSINESS_PLAN_DEF.highlights.map((h) => `- ${h}`),
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
