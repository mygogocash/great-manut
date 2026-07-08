"use node";

import { saveMessage } from "@convex-dev/agent";
import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { AI_NOT_CONFIGURED_MESSAGE, isAiConfigured } from "./modelConfig";
import { resolveOrgAiProviderForOrg } from "./resolveProvider";
import { threadUserKey } from "./limiter";
import {
  createVectorAgent,
  VECTOR_INSTRUCTIONS_TEXT,
} from "./vectorAgent";

export const streamResponse = internalAction({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
    orgId: v.id("organizations"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const actor = await ctx.runQuery(internal.agent.data.actorContext, {
      orgId: args.orgId,
      userId: args.userId,
    });
    try {
      const resolved = await resolveOrgAiProviderForOrg(ctx, args.orgId);
      const agent = createVectorAgent(resolved.chatModel);
      await agent.streamText(
        { ...ctx, orgId: args.orgId, requestUserId: args.userId },
        {
          threadId: args.threadId,
          userId: threadUserKey(args.orgId, args.userId),
        },
        {
          promptMessageId: args.promptMessageId,
          system: `${VECTOR_INSTRUCTIONS_TEXT}\n\nWorkspace: ${actor.orgName}. Requesting user: ${actor.userName}. Today's date: ${new Date().toISOString().slice(0, 10)}.`,
        },
        { saveStreamDeltas: true }
      );
    } catch (error) {
      console.error("AI response generation failed", error);
      const reason = isAiConfigured()
        ? "Something went wrong while generating a response. Please try again."
        : AI_NOT_CONFIGURED_MESSAGE;
      await saveMessage(ctx, components.agent, {
        threadId: args.threadId,
        userId: threadUserKey(args.orgId, args.userId),
        agentName: "Manut",
        message: { role: "assistant", content: reason },
      });
    }
    return null;
  },
});
