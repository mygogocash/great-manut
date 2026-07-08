/** Stripe webhook signature verification (Web Crypto — no stripe SDK). */

const DEFAULT_TOLERANCE_SECONDS = 300;

function parseStripeSignatureHeader(
  header: string
): { timestamp: number; signatures: string[] } | null {
  const parts = header.split(",");
  let timestamp: number | null = null;
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (!key || !value) {
      continue;
    }
    if (key === "t") {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed)) {
        return null;
      }
      timestamp = parsed;
    } else if (key === "v1") {
      signatures.push(value);
    }
  }

  if (timestamp === null || signatures.length === 0) {
    return null;
  }

  return { timestamp, signatures };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyStripeWebhookSignature(args: {
  payload: string;
  signatureHeader: string;
  secret: string;
  toleranceSeconds?: number;
}): Promise<boolean> {
  const parsed = parseStripeSignatureHeader(args.signatureHeader);
  if (!parsed) {
    return false;
  }

  const tolerance = args.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parsed.timestamp) > tolerance) {
    return false;
  }

  const signedPayload = `${parsed.timestamp}.${args.payload}`;
  const expected = await hmacSha256Hex(args.secret, signedPayload);

  return parsed.signatures.some((sig) => timingSafeEqualHex(sig, expected));
}
