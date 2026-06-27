import type { Context, Next } from "hono";
import type { Env, AuthUser } from "../types.js";
import { error, getBearerToken } from "../lib/http.js";
import { verifyAccessToken } from "../auth/jwt.js";

export type AppVariables = {
  user: AuthUser;
};

export async function requireAuth(c: Context<{ Bindings: Env; Variables: AppVariables }>, next: Next) {
  const token = getBearerToken(c.req.raw);
  if (!token) {
    return error("UNAUTHORIZED", "Missing bearer token", 401);
  }

  const verified = await verifyAccessToken(c.env, token);
  if (!verified) {
    return error("UNAUTHORIZED", "Invalid or expired token", 401);
  }

  const row = await c.env.DB.prepare(
    "SELECT id, email, display_name FROM users WHERE id = ?"
  )
    .bind(verified.userId)
    .first<{ id: string; email: string; display_name: string | null }>();

  if (!row) {
    return error("UNAUTHORIZED", "User not found", 401);
  }

  c.set("user", row);
  await next();
}
