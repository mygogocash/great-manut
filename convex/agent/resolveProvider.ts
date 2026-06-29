"use node";

import { createOpenAI } from "@ai-sdk/openai";
import type { EmbeddingModel, LanguageModel } from "ai";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { decryptSecret } from "../lib/crypto";
import {
  CHAT_MODEL_ID,
  EMBEDDING_MODEL_ID,
  isAiConfigured,
} from "./models";

export type ResolvedOrgAiProvider = {
  mode: "managed" | "byok";
  chatModel: LanguageModel;
  embeddingModel: EmbeddingModel;
  deductCredits: boolean;
};

type CredentialRow = {
  provider: "openai" | "anthropic" | "openrouter";
  encryptedApiKey: string;
  chatModelId?: string;
  embeddingProvider?: "openai" | "openrouter";
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
    default: {
      const _never: never = credential.provider;
      throw new Error(`Unknown provider: ${_never}`);
    }
  }

  const embedProvider = credential.embeddingProvider ?? "openai";
  const embedModelId = credential.embeddingModelId ?? EMBEDDING_MODEL_ID;
  let embeddingModel: EmbeddingModel;
  if (embedProvider === "openrouter") {
    embeddingModel = openAiCompatibleEmbedding(
      apiKey,
      embedModelId,
      "https://openrouter.ai/api/v1"
    );
  } else if (credential.provider === "anthropic" && isAiConfigured()) {
    embeddingModel = openAiCompatibleEmbedding(
      process.env.OPENAI_API_KEY!,
      embedModelId
    );
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
      "Managed AI is not configured: set OPENAI_API_KEY on the Convex deployment or switch to BYOK."
    );
  }

  const platform = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  return {
    mode: "managed",
    chatModel: platform.chat(CHAT_MODEL_ID),
    embeddingModel: platform.embedding(EMBEDDING_MODEL_ID),
    deductCredits: true,
  };
}

/** Node action entry — loads org + credentials then resolves models. */
export const resolveOrgAiProvider = internalAction({
  args: { orgId: v.id("organizations") },
  returns: v.any(),
  handler: async (ctx, args): Promise<ResolvedOrgAiProvider> => {
    const state = await ctx.runQuery(internal.aiCredentials.orgAiState, {
      orgId: args.orgId,
    });
    return resolveOrgAiProviderFromCredential(state.org, state.credential);
  },
});
