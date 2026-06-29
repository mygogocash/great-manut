declare module "@ai-sdk/anthropic" {
  import type { LanguageModel } from "ai";

  export function createAnthropic(options: { apiKey: string }): {
    chat: (modelId: string) => LanguageModel;
  };
}
