"use node";

import {
  createVertex,
  type GoogleVertexProvider,
  type GoogleVertexProviderSettings,
} from "@ai-sdk/google-vertex";
import type { EmbeddingModel, LanguageModel } from "ai";
import {
  getGoogleAiChatModel,
  getGoogleAiEmbeddingModel,
  googleAiEmbeddingCallOptions,
} from "./googleAiClient";
import {
  AI_NOT_CONFIGURED_MESSAGE,
  CHAT_MODEL_ID,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL_ID,
  isAiConfigured,
} from "./modelConfig";

export type VertexAuthConfig = {
  project?: string;
  location?: string;
  apiKey?: string;
  googleAuthOptions?: GoogleVertexProviderSettings["googleAuthOptions"];
};

export function parseVertexServiceAccountJson(raw: string): {
  credentials: NonNullable<
    NonNullable<GoogleVertexProviderSettings["googleAuthOptions"]>["credentials"]
  >;
  projectId?: string;
} {
  const parsed = JSON.parse(raw) as {
    client_email?: string;
    private_key?: string;
    project_id?: string;
  };
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(
      "Invalid Google Vertex service account JSON (need client_email and private_key)."
    );
  }
  return {
    credentials: {
      client_email: parsed.client_email,
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
    },
    projectId: parsed.project_id,
  };
}

export function platformVertexAuthConfig(): VertexAuthConfig {
  const location =
    process.env.GOOGLE_VERTEX_LOCATION?.trim() || "us-central1";
  const project =
    process.env.GOOGLE_VERTEX_PROJECT?.trim() || "manut-500913";

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim()) {
    const { credentials, projectId } = parseVertexServiceAccountJson(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    );
    return {
      project: project || projectId,
      location,
      googleAuthOptions: { credentials },
    };
  }

  if (
    process.env.GOOGLE_CLIENT_EMAIL?.trim() &&
    process.env.GOOGLE_PRIVATE_KEY?.trim()
  ) {
    return {
      project,
      location,
      googleAuthOptions: {
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL.trim(),
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        },
      },
    };
  }

  const apiKey = process.env.GOOGLE_VERTEX_API_KEY?.trim();
  if (apiKey) {
    return { apiKey, project, location };
  }

  return { project, location };
}

export const isVertexConfigured = isAiConfigured;

export function usesVertexOAuth(): boolean {
  return Boolean(platformVertexAuthConfig().googleAuthOptions);
}

export function createVertexProvider(
  config: VertexAuthConfig = platformVertexAuthConfig()
): GoogleVertexProvider {
  if (config.apiKey && !config.googleAuthOptions) {
    throw new Error(
      "GCP API keys cannot call Vertex OAuth endpoints. Set GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY, or use GOOGLE_GENERATIVE_AI_API_KEY for Gemini API routing."
    );
  }

  if (config.apiKey) {
    return createVertex({
      apiKey: config.apiKey,
    });
  }

  const project = config.project;
  if (!project) {
    throw new Error("Google Vertex project id is required.");
  }
  return createVertex({
    project,
    location: config.location ?? "us-central1",
    ...(config.googleAuthOptions
      ? { googleAuthOptions: config.googleAuthOptions }
      : {}),
  });
}

/** Match the `by_embedding` vector index (1536-dim legacy → Vertex truncated). */
export const VERTEX_EMBED_PROVIDER_OPTIONS = {
  providerOptions: {
    google: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
      taskType: "RETRIEVAL_DOCUMENT" as const,
    },
  },
};

export function embeddingCallOptions(model: EmbeddingModel) {
  const googleAiOptions = googleAiEmbeddingCallOptions(model);
  if (Object.keys(googleAiOptions).length > 0) {
    return googleAiOptions;
  }
  if (
    typeof model === "object" &&
    model !== null &&
    "provider" in model &&
    typeof model.provider === "string" &&
    model.provider.includes("google.vertex")
  ) {
    return VERTEX_EMBED_PROVIDER_OPTIONS;
  }
  return {};
}

export function vertexChatModel(
  provider: GoogleVertexProvider,
  modelId: string = CHAT_MODEL_ID
): LanguageModel {
  return provider(modelId);
}

export function vertexEmbeddingModel(
  provider: GoogleVertexProvider,
  modelId: string = EMBEDDING_MODEL_ID
): EmbeddingModel {
  return provider.textEmbeddingModel(modelId);
}

let cachedPlatformProvider: GoogleVertexProvider | null = null;

function getPlatformProvider(): GoogleVertexProvider {
  if (!isVertexConfigured()) {
    throw new Error(AI_NOT_CONFIGURED_MESSAGE);
  }
  const config = platformVertexAuthConfig();
  if (config.apiKey && !config.googleAuthOptions) {
    throw new Error(
      "Vertex OAuth credentials are required for this code path. Managed API-key mode uses the Gemini API client instead."
    );
  }
  cachedPlatformProvider ??= createVertexProvider(config);
  return cachedPlatformProvider;
}

export function getPlatformChatModel(): LanguageModel {
  const config = platformVertexAuthConfig();
  if (config.apiKey && !config.googleAuthOptions) {
    return getGoogleAiChatModel();
  }
  return vertexChatModel(getPlatformProvider());
}

export function getPlatformEmbeddingModel(): EmbeddingModel {
  const config = platformVertexAuthConfig();
  if (config.apiKey && !config.googleAuthOptions) {
    return getGoogleAiEmbeddingModel();
  }
  return vertexEmbeddingModel(getPlatformProvider());
}

export function createVertexProviderFromServiceAccountJson(
  serviceAccountJson: string,
  options?: { location?: string; project?: string }
): GoogleVertexProvider {
  const { credentials, projectId } =
    parseVertexServiceAccountJson(serviceAccountJson);
  return createVertexProvider({
    project:
      options?.project ??
      projectId ??
      process.env.GOOGLE_VERTEX_PROJECT?.trim(),
    location:
      options?.location ??
      process.env.GOOGLE_VERTEX_LOCATION?.trim() ??
      "us-central1",
    googleAuthOptions: { credentials },
  });
}
