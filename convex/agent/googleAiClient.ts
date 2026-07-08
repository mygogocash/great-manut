"use node";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { EmbeddingModel, LanguageModel } from "ai";
import {
  CHAT_MODEL_ID,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL_ID,
} from "./modelConfig";

function loadGoogleAiApiKey(): string {
  const key =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ??
    process.env.GOOGLE_VERTEX_API_KEY?.trim();
  if (!key) {
    throw new Error("Google AI API key is not configured.");
  }
  return key;
}

let cachedProvider: ReturnType<typeof createGoogleGenerativeAI> | null = null;

function getGoogleAiProvider() {
  cachedProvider ??= createGoogleGenerativeAI({ apiKey: loadGoogleAiApiKey() });
  return cachedProvider;
}

/** Gemini API chat (API-key auth). Used when Vertex OAuth credentials are unavailable. */
export function getGoogleAiChatModel(
  modelId: string = CHAT_MODEL_ID
): LanguageModel {
  return getGoogleAiProvider()(modelId);
}

/** Gemini API embeddings (API-key auth). Express Vertex keys do not support embed endpoints. */
export function getGoogleAiEmbeddingModel(
  modelId: string = EMBEDDING_MODEL_ID
): EmbeddingModel {
  return getGoogleAiProvider().embeddingModel(modelId);
}

/** Match the `by_embedding` vector index (1536-dim). */
export const GOOGLE_AI_EMBED_PROVIDER_OPTIONS = {
  providerOptions: {
    google: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
      taskType: "RETRIEVAL_DOCUMENT" as const,
    },
  },
};

export function googleAiEmbeddingCallOptions(model: EmbeddingModel) {
  if (
    typeof model === "object" &&
    model !== null &&
    "provider" in model &&
    typeof model.provider === "string" &&
    model.provider.includes("google.generative-ai")
  ) {
    return GOOGLE_AI_EMBED_PROVIDER_OPTIONS;
  }
  return {};
}
