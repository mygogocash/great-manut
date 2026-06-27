import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types.js";
import { corsHeaders, json, nowIso } from "./lib/http.js";
import { authRoutes, userRoutes } from "./routes/auth.js";
import { orgRoutes, syncRoutes } from "./routes/orgs.js";
import type { AppVariables } from "./middleware/auth.js";

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(c.env.APP_ORIGIN),
    });
  }
  await next();
  const response = c.res;
  if (response.status === 101) {
    return response;
  }
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(c.env.APP_ORIGIN))) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    headers,
  });
});

app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    allowHeaders: ["Authorization", "Content-Type", "Idempotency-Key"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.get("/healthz", (c) => json({ ok: true, service: "great-manut-api", env: c.env.APP_ENV ?? "unknown" }));

app.get("/", (c) =>
  json({
    name: "Great Manut API",
    version: "0.0.0",
    docs: "/api/healthz",
  })
);

app.route("/api/auth", authRoutes);
app.route("/api/users", userRoutes);
app.route("/api/orgs", orgRoutes);
app.route("/api/sync", syncRoutes);

app.post("/api/dev/seed", async (c) => {
  if (c.env.APP_ENV === "production") {
    return json({ error: "Not available in production" }, 404);
  }

  const { getOrCreateUser, seedDefaultWorkflowStates } = await import("./db/index.js");
  const user = await getOrCreateUser(c.env, "dev@gogocash.co");
  const timestamp = nowIso();
  const existingOrg = await c.env.DB.prepare("SELECT id FROM organizations WHERE slug = ?")
    .bind("demo")
    .first<{ id: string }>();

  if (existingOrg) {
    return json({ ok: true, org_slug: "demo", already_seeded: true, dev_user_email: user.email });
  }

  const orgId = crypto.randomUUID();
  const teamId = crypto.randomUUID();

  await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT INTO organizations (id, slug, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(orgId, "demo", "Demo Org", timestamp, timestamp),
    c.env.DB.prepare(
      "INSERT INTO organization_members (id, org_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(crypto.randomUUID(), orgId, user.id, "owner", timestamp),
    c.env.DB.prepare(
      "INSERT INTO teams (id, org_id, key, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(teamId, orgId, "ENG", "Engineering", timestamp, timestamp),
    c.env.DB.prepare(
      "INSERT INTO team_members (id, team_id, user_id, created_at) VALUES (?, ?, ?, ?)"
    ).bind(crypto.randomUUID(), teamId, user.id, timestamp),
  ]);

  await seedDefaultWorkflowStates(c.env, teamId);

  return json({ ok: true, org_slug: "demo", team_key: "ENG", dev_user_email: user.email });
});

app.post("/api/uploads/presign", async (c) => {
  return json({ upload_url: null, message: "Presign stub — wire R2 in production" }, 501);
});

export default app;
export type AppType = typeof app;

export { SyncRoomDurableObject } from "./sync/sync-room.js";
