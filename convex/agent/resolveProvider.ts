"use node";

import { createOpenAI } from "@ai-sdk/openai";
import type { EmbeddingModel, LanguageModel } from "ai";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import { internalAction } from "../_generated/server";
import { decryptSecret } from "../lib/crypto";
import {
  CHAT_MODEL_ID,
  EMBEDDING_MODEL_ID,
  isAiConfigured,
} from "./modelConfig";
import {
  createVertexProviderFromServiceAccountJson,
  getPlatformChatModel,
  getPlatformEmbeddingModel,
  vertexChatModel,
  vertexEmbeddingModel,
} from "./vertexClient";

export type ResolvedOrgAiProvider = {
  mode: "managed" | "byok";
  chatModel: LanguageModel;
  embeddingModel: EmbeddingModel;
  deductCredits: boolean;
};

type CredentialRow = {
  provider: "openai" | "anthropic" | "openrouter" | "vertex";
  encryptedApiKey: string;
  chatModelId?: string;
  embeddingProvider?: "openai" | "openrouter" | "vertex";
  embeddingModelId?: string;
};

function openAiCompatibleChat(
  apiKey: string,
  modelId: string,
  baseURL?: string
): LanguageModel {
  const provider = createOpenAI({ apiKey, baseURL });
  return provider.chat(modelId);
}

function openAiCompatibleEmbedding(
  apiKey: string,
  modelId: string,
  baseURL?: string
): EmbeddingModel {
  const provider = createOpenAI({ apiKey, baseURL });
  return provider.embedding(modelId);
}

async function anthropicChatModel(
  apiKey: string,
  modelId: string
): Promise<LanguageModel> {
  try {
    const { createAnthropic } = await import("@ai-sdk/anthropic");
    const anthropic = createAnthropic({ apiKey });
    return anthropic.chat(modelId);
  } catch {
    throw new Error(
      "Claude BYOK requires @ai-sdk/anthropic. Use the OpenRouter provider with a Claude model slug, or managed top-up."
    );
  }
}

async function resolveByokModels(
  credential: CredentialRow,
  apiKey: string
): Promise<ResolvedOrgAiProvider> {
  const chatModelId =
    credential.chatModelId ??
    (credential.provider === "anthropic"
      ? "claude-3-5-haiku-latest"
      : credential.provider === "openrouter"
        ? "openai/gpt-4o-mini"
        : credential.provider === "vertex"
          ? CHAT_MODEL_ID
          : CHAT_MODEL_ID);

  let chatModel: LanguageModel;
  switch (credential.provider) {
    case "openai":
      chatModel = openAiCompatibleChat(apiKey, chatModelId);
      break;
    case "openrouter":
      chatModel = openAiCompatibleChat(
        apiKey,
        chatModelId,
        "https://openrouter.ai/api/v1"
      );
      break;
    case "anthropic":
      chatModel = await anthropicChatModel(
        apiKey,
        credential.chatModelId ?? "claude-3-5-haiku-latest"
      );
      break;
    case "vertex": {
      const vertex = createVertexProviderFromServiceAccountJson(apiKey);
      chatModel = vertexChatModel(vertex, chatModelId);
      break;
    }
    default: {
      const _never: never = credential.provider;
      throw new Error(`Unknown provider: ${_never}`);
    }
  }

  const embedProvider = credential.embeddingProvider ?? "openai";
  const embedModelId = credential.embeddingModelId ?? EMBEDDING_MODEL_ID;
  let embeddingModel: EmbeddingModel;

  if (credential.provider === "vertex") {
    const vertex = createVertexProviderFromServiceAccountJson(apiKey);
    embeddingModel = vertexEmbeddingModel(vertex, embedModelId);
  } else if (embedProvider === "openrouter") {
    embeddingModel = openAiCompatibleEmbedding(
      apiKey,
      embedModelId,
      "https://openrouter.ai/api/v1"
    );
  } else if (credential.provider === "anthropic" && isAiConfigured()) {
    embeddingModel = getPlatformEmbeddingModel();
  } else {
    embeddingModel = openAiCompatibleEmbedding(apiKey, embedModelId);
  }

  return {
    mode: "byok",
    chatModel,
    embeddingModel,
    deductCredits: false,
  };
}

export async function resolveOrgAiProviderFromCredential(
  org: { aiMode?: "managed" | "byok" },
  credential: CredentialRow | null
): Promise<ResolvedOrgAiProvider> {
  const mode = org.aiMode ?? "managed";

  if (mode === "byok" && credential) {
    const apiKey = await decryptSecret(credential.encryptedApiKey);
    return await resolveByokModels(credential, apiKey);
  }

  if (!isAiConfigured()) {
    throw new Error(
      "Managed AI is not configured: set Google Vertex credentials on the Convex deployment or switch to BYOK."
    );
  }

  return {
    mode: "managed",
    chatModel: getPlatformChatModel(),
    embeddingModel: getPlatformEmbeddingModel(),
    deductCredits: true,
  };
}

/** Resolve models in-process (node actions only — models are not Convex-serializable). */
export async function resolveOrgAiProviderForOrg(
  ctx: Pick<ActionCtx, "runQuery">,
  orgId: Id<"organizations">
): Promise<ResolvedOrgAiProvider> {
  const state = await ctx.runQuery(internal.aiCredentials.orgAiState, {
    orgId,
  });
  return resolveOrgAiProviderFromCredential(state.org, state.credential);
}

/** Debug/status only — does not return LanguageModel instances. */
export const resolveOrgAiProvider = internalAction({
  args: { orgId: v.id("organizations") },
  returns: v.object({
    mode: v.union(v.literal("managed"), v.literal("byok")),
    deductCredits: v.boolean(),
    chatModelId: v.string(),
    embeddingModelId: v.string(),
  }),
  handler: async (ctx, args) => {
    const resolved = await resolveOrgAiProviderForOrg(ctx, args.orgId);
    const chatModelId =
      typeof resolved.chatModel === "object" &&
      resolved.chatModel !== null &&
      "modelId" in resolved.chatModel &&
      typeof resolved.chatModel.modelId === "string"
        ? resolved.chatModel.modelId
        : CHAT_MODEL_ID;
    const embeddingModelId =
      typeof resolved.embeddingModel === "object" &&
      resolved.embeddingModel !== null &&
      "modelId" in resolved.embeddingModel &&
      typeof resolved.embeddingModel.modelId === "string"
        ? resolved.embeddingModel.modelId
        : EMBEDDING_MODEL_ID;
    return {
      mode: resolved.mode,
      deductCredits: resolved.deductCredits,
      chatModelId,
      embeddingModelId,
    };
  },
});
