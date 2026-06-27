import { Hono } from "hono";
import type { Env } from "../types.js";
import { error, json, parseJsonBody } from "../lib/http.js";
import {
  generateMagicCode,
  issueAccessToken,
  issueRefreshToken,
  logMagicCodeDelivery,
  storeMagicCode,
  verifyMagicCode,
  consumeRefreshToken,
} from "../auth/jwt.js";
import { getOrCreateUser } from "../db/index.js";
import { requireAuth, type AppVariables } from "../middleware/auth.js";

export const authRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

authRoutes.post("/magic-code/initiate", async (c) => {
  const body = await parseJsonBody<{ email?: string }>(c.req.raw);
  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return error("EMAIL_REQUIRED", "Email is required");
  }

  const code = generateMagicCode();
  await storeMagicCode(c.env, email, code);
  await logMagicCodeDelivery(email, code, c.env);

  return json({ ok: true });
});

authRoutes.post("/magic-code/verify", async (c) => {
  const body = await parseJsonBody<{ email?: string; code?: string }>(c.req.raw);
  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();

  if (!email || !code) {
    return error("INVALID_REQUEST", "Email and code are required");
  }

  const valid = await verifyMagicCode(c.env, email, code);
  if (!valid) {
    return error("INVALID_CODE", "Invalid or expired code", 401);
  }

  const user = await getOrCreateUser(c.env, email);
  const access_token = await issueAccessToken(c.env, user.id, user.email);
  const refresh_token = await issueRefreshToken(c.env, user.id);
  const expires_in = Number(c.env.ACCESS_TOKEN_TTL_SECONDS ?? "3600");

  return json({
    access_token,
    refresh_token,
    expires_in,
    token_type: "Bearer",
  });
});

authRoutes.post("/refresh", async (c) => {
  const body = await parseJsonBody<{ refresh_token?: string }>(c.req.raw);
  const refreshToken = body.refresh_token?.trim();
  if (!refreshToken) {
    return error("REFRESH_TOKEN_REQUIRED", "Refresh token is required");
  }

  const userId = await consumeRefreshToken(c.env, refreshToken);
  if (!userId) {
    return error("INVALID_REFRESH_TOKEN", "Invalid refresh token", 401);
  }

  const user = await c.env.DB.prepare("SELECT id, email FROM users WHERE id = ?")
    .bind(userId)
    .first<{ id: string; email: string }>();

  if (!user) {
    return error("USER_NOT_FOUND", "User not found", 404);
  }

  const access_token = await issueAccessToken(c.env, user.id, user.email);
  const refresh_token = await issueRefreshToken(c.env, user.id);
  const expires_in = Number(c.env.ACCESS_TOKEN_TTL_SECONDS ?? "3600");

  return json({
    access_token,
    refresh_token,
    expires_in,
    token_type: "Bearer",
  });
});

export const userRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

userRoutes.get("/me", requireAuth, (c) => {
  const user = c.get("user");
  return json({
    id: user.id,
    email: user.email,
    display_name: user.display_name,
  });
});
