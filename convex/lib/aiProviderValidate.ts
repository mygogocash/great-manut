export async function validateProviderKey(
  provider: "openai" | "anthropic" | "openrouter" | "vertex",
  apiKey: string
): Promise<void> {
  switch (provider) {
    case "openai":
      await validateOpenAiKey(apiKey);
      return;
    case "openrouter":
      await validateOpenAiKey(apiKey, "https://openrouter.ai/api/v1");
      return;
    case "anthropic":
      await validateAnthropicKey(apiKey);
      return;
    case "vertex":
      validateVertexServiceAccountJson(apiKey);
      return;
    default: {
      const _never: never = provider;
      throw new Error(`Unknown provider: ${_never}`);
    }
  }
}

function validateVertexServiceAccountJson(raw: string): void {
  const parsed = JSON.parse(raw) as {
    client_email?: string;
    private_key?: string;
    project_id?: string;
  };
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(
      "Vertex credentials must be a Google Cloud service account JSON with client_email and private_key."
    );
  }
}

async function validateAnthropicKey(apiKey: string): Promise<void> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1,
      messages: [{ role: "user", content: "ping" }],
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic key validation failed: ${body.slice(0, 200)}`);
  }
}

async function validateOpenAiKey(apiKey: string, baseURL?: string): Promise<void> {
  const url = baseURL
    ? `${baseURL.replace(/\/$/, "")}/models`
    : "https://api.openai.com/v1/models";
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API key validation failed: ${body.slice(0, 200)}`);
  }
}
