/**
 * Central model configuration for the Vector AI agent (Track D).
 *
 * Managed inference runtime: `convex/agent/vertexClient.ts` (`"use node"` only).
 * Per-org resolution: `convex/agent/resolveProvider.ts`.
 */
export {
  AI_NOT_CONFIGURED_MESSAGE,
  assertAiConfigured,
  CHAT_MODEL_ID,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL_ID,
  isAiConfigured,
} from "./modelConfig";
