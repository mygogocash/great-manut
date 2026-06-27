import { SignJWT, jwtVerify } from "jose";
import type { Env } from "../types.js";
import { newId, nowIso } from "../lib/http.js";

const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30;
const MAGIC_CODE_TTL_SECONDS = 60 * 10;

function getJwtSecret(env: Env): Uint8Array {
  const secret = env.JWT_SECRET ?? "great-manut-dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function issueAccessToken(env: Env, userId: string, email: string): Promise<string> {
  const ttl = Number(env.ACCESS_TOKEN_TTL_SECONDS ?? "3600");
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(env.JWT_ISSUER ?? "great-manut")
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(getJwtSecret(env));
}

export async function verifyAccessToken(
  env: Env,
  token: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const verified = await jwtVerify(token, getJwtSecret(env), {
      issuer: env.JWT_ISSUER ?? "great-manut",
    });
    const userId = verified.payload.sub;
    const email = verified.payload.email;
    if (!userId || typeof email !== "string") {
      return null;
    }
    return { userId, email };
  } catch {
    return null;
  }
}

export async function issueRefreshToken(env: Env, userId: string): Promise<string> {
  const refreshToken = newId();
  await env.AUTH.put(`refresh:${refreshToken}`, userId, { expirationTtl: REFRESH_TTL_SECONDS });
  return refreshToken;
}

export async function consumeRefreshToken(env: Env, refreshToken: string): Promise<string | null> {
  const userId = await env.AUTH.get(`refresh:${refreshToken}`);
  if (!userId) {
    return null;
  }
  await env.AUTH.delete(`refresh:${refreshToken}`);
  return userId;
}

export async function storeMagicCode(env: Env, email: string, code: string): Promise<void> {
  await env.AUTH.put(`magic:${email}`, code, { expirationTtl: MAGIC_CODE_TTL_SECONDS });
}

export async function verifyMagicCode(env: Env, email: string, code: string): Promise<boolean> {
  const stored = await env.AUTH.get(`magic:${email}`);
  if (!stored || stored !== code) {
    return false;
  }
  await env.AUTH.delete(`magic:${email}`);
  return true;
}

export function generateMagicCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function logMagicCodeDelivery(email: string, code: string, env: Env): Promise<void> {
  if (env.APP_ENV === "production" && env.RESEND_API_KEY) {
    // Production email delivery can be wired to Resend in a follow-up operator step.
    console.info("MAGIC_CODE_DELIVERY", { email });
    return;
  }
  console.info("MAGIC_CODE_DEV", { email, code });
}

export { nowIso, newId };
