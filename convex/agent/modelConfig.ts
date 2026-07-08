/** Shared AI model ids and vector dimensions (no runtime deps).
 *  Vertex runs on GCP project manut-500913 (AI-only — not app hosting). */

export const CHAT_MODEL_ID = "gemini-2.5-flash";

/** gemini-embedding-001 truncated to match the 1536-dim `by_embedding` index. */
export const EMBEDDING_MODEL_ID = "gemini-embedding-001";

export const EMBEDDING_DIMENSIONS = 1536;

export const AI_NOT_CONFIGURED_MESSAGE =
  "The AI agent is not configured yet: set GOOGLE_VERTEX_API_KEY (express mode) or GOOGLE_VERTEX_PROJECT plus service account credentials on the Convex deployment.";

/** Env-only check — safe to import from non-`"use node"` Convex functions. */
export function isAiConfigured(): boolean {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim()) {
    return true;
  }
  if (
    process.env.GOOGLE_CLIENT_EMAIL?.trim() &&
    process.env.GOOGLE_PRIVATE_KEY?.trim()
  ) {
    return true;
  }
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) {
    return true;
  }
  if (process.env.GOOGLE_VERTEX_API_KEY?.trim()) {
    return true;
  }
  const project = process.env.GOOGLE_VERTEX_PROJECT?.trim();
  if (!project) {
    return false;
  }
  return Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim());
}

export function assertAiConfigured(): void {
  if (!isAiConfigured()) {
    throw new Error(AI_NOT_CONFIGURED_MESSAGE);
  }
}
