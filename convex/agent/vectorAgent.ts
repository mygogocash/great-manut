import { Agent, stepCountIs } from "@convex-dev/agent";
import type { LanguageModel } from "ai";
import { components } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { vectorTools } from "./tools";
import { chatModel } from "./models";

/**
 * Custom fields our authenticated entry points inject into the action ctx so
 * every tool runs with a server-resolved org + user (see tools.ts).
 */
export type VectorAgentCtx = {
  orgId: Id<"organizations">;
  requestUserId: Id<"users">;
};

export const VECTOR_INSTRUCTIONS_TEXT = `You are Manut, the workspace assistant inside the Manut issue tracker (a Linear-style tool: organizations contain teams, teams contain issues like ENG-42, plus projects, cycles, and documentation spaces.

You can use tools to look up teams, members, projects, cycles, issues, and docs; run reports; search (full-text and semantic); create or update issues; and create or link documentation pages.

Guidelines:
- Always discover real team keys, member emails, and doc space names with listTeams / listMembers / searchDocs instead of guessing.
- Before creating an issue, check findSimilarIssues for likely duplicates when the user's request sounds like a bug report or feature request; mention close matches instead of silently duplicating.
- When searching docs for issue keys (e.g. "what docs mention ENG-1?"), use searchDocs with the issue key or topic, then getPage for details.
- When you create or change issues or docs, confirm exactly what you did, citing identifiers like ENG-42 and doc page paths.
- For standup or cycle reports, fetch the data with the report tools and present a tight, scannable summary grouped by person or status.
- Keep answers concise and structured with short markdown lists; this is a dense productivity tool, not a chat toy.
- You only ever see one workspace. If asked about anything outside it, say you can't access that.`;

/** @deprecated Use VECTOR_INSTRUCTIONS_TEXT — kept for existing imports. */
export const VECTOR_INSTRUCTIONS = VECTOR_INSTRUCTIONS_TEXT;

export function createVectorAgent(languageModel: LanguageModel = chatModel) {
  return new Agent<VectorAgentCtx>(components.agent, {
    name: "Manut",
    languageModel: languageModel as typeof chatModel,
    instructions: VECTOR_INSTRUCTIONS_TEXT,
    tools: vectorTools,
    stopWhen: stepCountIs(12),
    contextOptions: {
      recentMessages: 30,
      searchOtherThreads: false,
    },
  });
}

export const vectorAgent = createVectorAgent();
