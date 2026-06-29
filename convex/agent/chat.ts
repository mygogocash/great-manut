import {
  createThread as createAgentThread,
  listUIMessages,
  saveMessage,
  syncStreams,
  updateThreadMetadata,
  vStreamArgs,
} from "@convex-dev/agent";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import {
  MutationCtx,
  QueryCtx,
  internalAction,
} from "../_generated/server";
import { orgMutation, orgQuery } from "../lib/customFunctions";
import {
  assertAiCreditBalance,
  getAiCreditBalance,
  getAiMode,
} from "../lib/usageLimits";
import { creditsForEvent } from "../lib/usagePricing";
import { aiModeValidator } from "../schema";
import { threadUserKey } from "./limiter";
import {
  AI_NOT_CONFIGURED_MESSAGE,
  isAiConfigured,
} from "./models";
import {
  createVectorAgent,
  VECTOR_INSTRUCTIONS_TEXT,
} from "./vectorAgent";

const DEFAULT_THREAD_TITLE = "New conversation";

async function assertOrgAiReady(
  ctx: MutationCtx,
  orgId: Id<"organizations">
): Promise<void> {
  const org = await ctx.db.get(orgId);
  if (!org) {
    throw new Error("Workspace not found");
  }
  const mode = getAiMode(org);
  if (mode === "managed") {
    assertAiCreditBalance(org, "chatMessage");
    return;
  }
  const credential = await ctx.db
    .query("orgAiCredentials")
    .withIndex("by_org", (q) => q.eq("orgId", orgId))
    .unique();
  if (!credential) {
    throw new Error("Configure a provider API key in AI settings.");
  }
}

/**
 * Verify the agent-component thread belongs to the authenticated
 * (org, user) pair before any read/write. Thread ownership is keyed by
 * `threadUserKey`, so cross-org access is impossible.
 */
async function getOwnedThread(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<"organizations">,
  userId: Id<"users">,
  threadId: string
) {
  const thread = await ctx.runQuery(components.agent.threads.getThread, {
    threadId,
  });
  if (!thread || thread.userId !== threadUserKey(orgId, userId)) {
    throw new Error("Thread not found");
  }
  return thread;
}

// ── Threads ────────────────────────────────────────────────────────────────

export const createThread = orgMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await assertOrgAiReady(ctx, ctx.org._id);
    return await createAgentThread(ctx, components.agent, {
      userId: threadUserKey(ctx.org._id, ctx.user._id),
      title: DEFAULT_THREAD_TITLE,
    });
  },
});

export const listThreads = orgQuery({
  args: {},
  returns: v.array(
    v.object({
      threadId: v.string(),
      title: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    const mode = getAiMode(ctx.org);
    const balance = getAiCreditBalance(ctx.org);
    if (mode === "managed" && balance <= 0) {
      return [];
    }
    const result = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      {
        userId: threadUserKey(ctx.org._id, ctx.user._id),
        order: "desc",
        paginationOpts: { cursor: null, numItems: 100 },
      }
    );
    return result.page
      .filter((thread) => thread.status === "active")
      .map((thread) => ({
        threadId: thread._id,
        title: thread.title ?? DEFAULT_THREAD_TITLE,
        createdAt: thread._creationTime,
      }));
  },
});

export const deleteThread = orgMutation({
  args: { threadId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getOwnedThread(ctx, ctx.org._id, ctx.user._id, args.threadId);
    const agent = createVectorAgent();
    await agent.deleteThreadAsync(ctx, { threadId: args.threadId });
    return null;
  },
});

// ── Messages ───────────────────────────────────────────────────────────────

export const listMessages = orgQuery({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.string(),
    splitCursor: v.optional(v.union(v.string(), v.null())),
    pageStatus: v.optional(
      v.union(
        v.literal("SplitRecommended"),
        v.literal("SplitRequired"),
        v.null()
      )
    ),
    streams: v.optional(v.any()),
  }),
  handler: async (ctx, args) => {
    await getOwnedThread(ctx, ctx.org._id, ctx.user._id, args.threadId);
    const paginated = await listUIMessages(ctx, components.agent, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    });
    const streams = await syncStreams(ctx, components.agent, {
      threadId: args.threadId,
      streamArgs: args.streamArgs,
    });
    return { ...paginated, streams };
  },
});

export const sendMessage = orgMutation({
  args: { threadId: v.string(), prompt: v.string() },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await assertOrgAiReady(ctx, ctx.org._id);
    const prompt = args.prompt.trim();
    if (!prompt) {
      throw new Error("Message cannot be empty");
    }
    const thread = await getOwnedThread(
      ctx,
      ctx.org._id,
      ctx.user._id,
      args.threadId
    );

    if (getAiMode(ctx.org) === "managed") {
      await ctx.runMutation(internal.aiCredits.deductCredits, {
        orgId: ctx.org._id,
        amount: creditsForEvent("chatMessage"),
      });
    }

    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId: args.threadId,
      userId: threadUserKey(ctx.org._id, ctx.user._id),
      prompt,
    });

    if (!thread.title || thread.title === DEFAULT_THREAD_TITLE) {
      await updateThreadMetadata(ctx, components.agent, {
        threadId: args.threadId,
        patch: { title: prompt.length > 60 ? `${prompt.slice(0, 57)}…` : prompt },
      });
    }

    await ctx.scheduler.runAfter(0, internal.agent.chat.streamResponse, {
      threadId: args.threadId,
      promptMessageId: messageId,
      orgId: ctx.org._id,
      userId: ctx.user._id,
    });
    return null;
  },
});

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
      const resolved = await ctx.runAction(
        internal.agent.resolveProvider.resolveOrgAiProvider,
        { orgId: args.orgId }
      );
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

// ── Quota ──────────────────────────────────────────────────────────────────

export const quota = orgQuery({
  args: {},
  returns: v.object({
    hasAccess: v.boolean(),
    aiMode: aiModeValidator,
    unlimited: v.boolean(),
    balance: v.number(),
  }),
  handler: async (ctx) => {
    const mode = getAiMode(ctx.org);
    const balance = getAiCreditBalance(ctx.org);
    const hasAccess = mode === "byok" || balance > 0;
    return {
      hasAccess,
      aiMode: mode,
      unlimited: mode === "byok",
      balance,
    };
  },
});
