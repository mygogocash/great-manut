import { Hono } from "hono";
import type { Env } from "../types.js";
import { error, json, newId, nowIso, parseJsonBody, getIdempotencyKey, getBearerToken } from "../lib/http.js";
import {
  getOrgBySlug,
  mapIssueRow,
  seedDefaultWorkflowStates,
  userHasOrgAccess,
  userHasTeamAccess,
  getTeamByKey,
  nextIssueNumber,
  isIdempotencyApplied,
  markIdempotencyApplied,
} from "../db/index.js";
import { requireAuth, type AppVariables } from "../middleware/auth.js";
import { verifyAccessToken } from "../auth/jwt.js";

export const orgRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

orgRoutes.use("*", requireAuth);

orgRoutes.get("/", async (c) => {
  const user = c.get("user");
  const result = await c.env.DB.prepare(
    `SELECT o.id, o.slug, o.name, o.created_at, o.updated_at
     FROM organizations o
     INNER JOIN organization_members m ON m.org_id = o.id
     WHERE m.user_id = ?`
  )
    .bind(user.id)
    .all();

  return json(result.results ?? []);
});

orgRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await parseJsonBody<{ name?: string; slug?: string }>(c.req.raw);
  const name = body.name?.trim();
  const slug = body.slug?.trim().toLowerCase();

  if (!name || !slug) {
    return error("INVALID_REQUEST", "Name and slug are required");
  }

  const orgId = newId();
  const timestamp = nowIso();

  await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT INTO organizations (id, slug, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(orgId, slug, name, timestamp, timestamp),
    c.env.DB.prepare(
      "INSERT INTO organization_members (id, org_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(newId(), orgId, user.id, "owner", timestamp),
  ]);

  return json({ id: orgId, slug, name, created_at: timestamp, updated_at: timestamp }, 201);
});

orgRoutes.get("/:orgSlug/teams", async (c) => {
  const user = c.get("user");
  const org = await getOrgBySlug(c.env, c.req.param("orgSlug"));
  if (!org || !(await userHasOrgAccess(c.env, org.id, user.id))) {
    return error("NOT_FOUND", "Organization not found", 404);
  }

  const teams = await c.env.DB.prepare("SELECT * FROM teams WHERE org_id = ? ORDER BY name")
    .bind(org.id)
    .all();

  return json(teams.results ?? []);
});

orgRoutes.post("/:orgSlug/teams", async (c) => {
  const user = c.get("user");
  const org = await getOrgBySlug(c.env, c.req.param("orgSlug"));
  if (!org || !(await userHasOrgAccess(c.env, org.id, user.id))) {
    return error("NOT_FOUND", "Organization not found", 404);
  }

  const body = await parseJsonBody<{ name?: string; key?: string }>(c.req.raw);
  const name = body.name?.trim();
  const key = body.key?.trim().toUpperCase();

  if (!name || !key || key.length < 2 || key.length > 6) {
    return error("INVALID_REQUEST", "Team name and 2-6 char key are required");
  }

  const teamId = newId();
  const timestamp = nowIso();

  await c.env.DB.batch([
    c.env.DB.prepare(
      "INSERT INTO teams (id, org_id, key, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(teamId, org.id, key, name, timestamp, timestamp),
    c.env.DB.prepare(
      "INSERT INTO team_members (id, team_id, user_id, created_at) VALUES (?, ?, ?, ?)"
    ).bind(newId(), teamId, user.id, timestamp),
  ]);

  await seedDefaultWorkflowStates(c.env, teamId);

  return json({ id: teamId, org_id: org.id, key, name, created_at: timestamp, updated_at: timestamp }, 201);
});

orgRoutes.get("/:orgSlug/teams/:teamKey/states", async (c) => {
  const user = c.get("user");
  const org = await getOrgBySlug(c.env, c.req.param("orgSlug"));
  if (!org || !(await userHasOrgAccess(c.env, org.id, user.id))) {
    return error("NOT_FOUND", "Organization not found", 404);
  }

  const team = await getTeamByKey(c.env, org.id, c.req.param("teamKey"));
  if (!team || !(await userHasTeamAccess(c.env, team.id, user.id))) {
    return error("NOT_FOUND", "Team not found", 404);
  }

  const states = await c.env.DB.prepare(
    "SELECT id, team_id, name, color, position, state_group as \"group\" FROM workflow_states WHERE team_id = ? ORDER BY position"
  )
    .bind(team.id)
    .all();

  return json(states.results ?? []);
});

orgRoutes.get("/:orgSlug/teams/:teamKey/issues", async (c) => {
  const user = c.get("user");
  const org = await getOrgBySlug(c.env, c.req.param("orgSlug"));
  if (!org || !(await userHasOrgAccess(c.env, org.id, user.id))) {
    return error("NOT_FOUND", "Organization not found", 404);
  }

  const team = await getTeamByKey(c.env, org.id, c.req.param("teamKey"));
  if (!team || !(await userHasTeamAccess(c.env, team.id, user.id))) {
    return error("NOT_FOUND", "Team not found", 404);
  }

  const rows = await c.env.DB.prepare(
    "SELECT * FROM issues WHERE team_id = ? AND deleted_at IS NULL ORDER BY number DESC"
  )
    .bind(team.id)
    .all();

  const issues = await Promise.all(
    (rows.results ?? []).map((row: Record<string, unknown>) => mapIssueRow(c.env, row as never, team.key))
  );

  return json(issues);
});

orgRoutes.post("/:orgSlug/teams/:teamKey/issues", async (c) => {
  const user = c.get("user");
  const org = await getOrgBySlug(c.env, c.req.param("orgSlug"));
  if (!org || !(await userHasOrgAccess(c.env, org.id, user.id))) {
    return error("NOT_FOUND", "Organization not found", 404);
  }

  const team = await getTeamByKey(c.env, org.id, c.req.param("teamKey"));
  if (!team || !(await userHasTeamAccess(c.env, team.id, user.id))) {
    return error("NOT_FOUND", "Team not found", 404);
  }

  const idempotencyKey = getIdempotencyKey(c.req.raw);
  if (idempotencyKey && (await isIdempotencyApplied(c.env, idempotencyKey))) {
    return json({ deduped: true });
  }

  const body = await parseJsonBody<{
    title?: string;
    description?: string;
    state_id?: string;
    priority?: string;
  }>(c.req.raw);
  const title = body.title?.trim();
  if (!title) {
    return error("TITLE_REQUIRED", "Issue title is required");
  }

  let stateId = body.state_id;
  if (!stateId) {
    const defaultState = await c.env.DB.prepare(
      "SELECT id FROM workflow_states WHERE team_id = ? ORDER BY position LIMIT 1"
    )
      .bind(team.id)
      .first<{ id: string }>();
    stateId = defaultState?.id;
  }

  if (!stateId) {
    return error("STATE_REQUIRED", "No workflow state available");
  }

  const issueId = newId();
  const timestamp = nowIso();
  const number = await nextIssueNumber(c.env, team.id);

  await c.env.DB.prepare(
    `INSERT INTO issues (id, team_id, org_id, number, title, description, priority, state_id, created_by, updated_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      issueId,
      team.id,
      org.id,
      number,
      title,
      body.description ?? "",
      body.priority ?? "none",
      stateId,
      user.id,
      user.id,
      timestamp,
      timestamp
    )
    .run();

  if (idempotencyKey) {
    await markIdempotencyApplied(c.env, idempotencyKey, "issue", issueId);
  }

  const row = await c.env.DB.prepare("SELECT * FROM issues WHERE id = ?").bind(issueId).first();
  return json(await mapIssueRow(c.env, row as never, team.key), 201);
});

orgRoutes.patch("/:orgSlug/teams/:teamKey/issues/:issueNumber", async (c) => {
  const user = c.get("user");
  const org = await getOrgBySlug(c.env, c.req.param("orgSlug"));
  if (!org || !(await userHasOrgAccess(c.env, org.id, user.id))) {
    return error("NOT_FOUND", "Organization not found", 404);
  }

  const team = await getTeamByKey(c.env, org.id, c.req.param("teamKey"));
  if (!team || !(await userHasTeamAccess(c.env, team.id, user.id))) {
    return error("NOT_FOUND", "Team not found", 404);
  }

  const issueNumber = Number(c.req.param("issueNumber"));
  const existing = await c.env.DB.prepare(
    "SELECT * FROM issues WHERE team_id = ? AND number = ? AND deleted_at IS NULL"
  )
    .bind(team.id, issueNumber)
    .first<Record<string, unknown>>();

  if (!existing) {
    return error("NOT_FOUND", "Issue not found", 404);
  }

  const idempotencyKey = getIdempotencyKey(c.req.raw);
  if (idempotencyKey && (await isIdempotencyApplied(c.env, idempotencyKey))) {
    return json({ deduped: true });
  }

  const body = await parseJsonBody<{
    title?: string;
    description?: string;
    priority?: string;
    state_id?: string;
    assignee_ids?: string[];
    label_ids?: string[];
  }>(c.req.raw);

  const timestamp = nowIso();
  await c.env.DB.prepare(
    `UPDATE issues SET title = ?, description = ?, priority = ?, state_id = ?, updated_by = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(
      body.title ?? existing.title,
      body.description ?? existing.description,
      body.priority ?? existing.priority,
      body.state_id ?? existing.state_id,
      user.id,
      timestamp,
      existing.id
    )
    .run();

  if (body.assignee_ids) {
    await c.env.DB.prepare("UPDATE issue_assignees SET deleted_at = ? WHERE issue_id = ? AND deleted_at IS NULL")
      .bind(timestamp, existing.id)
      .run();
    for (const assigneeId of body.assignee_ids) {
      await c.env.DB.prepare(
        "INSERT INTO issue_assignees (id, issue_id, user_id, created_at) VALUES (?, ?, ?, ?)"
      )
        .bind(newId(), existing.id, assigneeId, timestamp)
        .run();
    }
  }

  if (body.label_ids) {
    await c.env.DB.prepare("UPDATE issue_labels SET deleted_at = ? WHERE issue_id = ? AND deleted_at IS NULL")
      .bind(timestamp, existing.id)
      .run();
    for (const labelId of body.label_ids) {
      await c.env.DB.prepare("INSERT INTO issue_labels (id, issue_id, label_id, created_at) VALUES (?, ?, ?, ?)")
        .bind(newId(), existing.id, labelId, timestamp)
        .run();
    }
  }

  if (idempotencyKey) {
    await markIdempotencyApplied(c.env, idempotencyKey, "issue", String(existing.id));
  }

  const row = await c.env.DB.prepare("SELECT * FROM issues WHERE id = ?").bind(existing.id).first();
  return json(await mapIssueRow(c.env, row as never, team.key));
});

orgRoutes.get("/:orgSlug/teams/:teamKey/labels", async (c) => {
  const user = c.get("user");
  const org = await getOrgBySlug(c.env, c.req.param("orgSlug"));
  const team = org ? await getTeamByKey(c.env, org.id, c.req.param("teamKey")) : null;
  if (!org || !team || !(await userHasTeamAccess(c.env, team.id, user.id))) {
    return error("NOT_FOUND", "Team not found", 404);
  }

  const labels = await c.env.DB.prepare(
    "SELECT * FROM labels WHERE team_id = ? AND deleted_at IS NULL ORDER BY name"
  )
    .bind(team.id)
    .all();

  return json(labels.results ?? []);
});

orgRoutes.post("/:orgSlug/teams/:teamKey/labels", async (c) => {
  const user = c.get("user");
  const org = await getOrgBySlug(c.env, c.req.param("orgSlug"));
  const team = org ? await getTeamByKey(c.env, org.id, c.req.param("teamKey")) : null;
  if (!org || !team || !(await userHasTeamAccess(c.env, team.id, user.id))) {
    return error("NOT_FOUND", "Team not found", 404);
  }

  const body = await parseJsonBody<{ name?: string; color?: string }>(c.req.raw);
  const name = body.name?.trim();
  if (!name) {
    return error("NAME_REQUIRED", "Label name is required");
  }

  const id = newId();
  const timestamp = nowIso();
  await c.env.DB.prepare(
    "INSERT INTO labels (id, team_id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(id, team.id, name, body.color ?? "#5e6ad2", timestamp, timestamp)
    .run();

  return json({ id, team_id: team.id, name, color: body.color ?? "#5e6ad2", created_at: timestamp, updated_at: timestamp }, 201);
});

orgRoutes.get("/:orgSlug/teams/:teamKey/issues/:issueNumber/comments", async (c) => {
  const user = c.get("user");
  const org = await getOrgBySlug(c.env, c.req.param("orgSlug"));
  const team = org ? await getTeamByKey(c.env, org.id, c.req.param("teamKey")) : null;
  if (!org || !team || !(await userHasTeamAccess(c.env, team.id, user.id))) {
    return error("NOT_FOUND", "Team not found", 404);
  }

  const issue = await c.env.DB.prepare(
    "SELECT id FROM issues WHERE team_id = ? AND number = ? AND deleted_at IS NULL"
  )
    .bind(team.id, Number(c.req.param("issueNumber")))
    .first<{ id: string }>();

  if (!issue) {
    return error("NOT_FOUND", "Issue not found", 404);
  }

  const comments = await c.env.DB.prepare(
    "SELECT * FROM issue_comments WHERE issue_id = ? AND deleted_at IS NULL ORDER BY created_at ASC"
  )
    .bind(issue.id)
    .all();

  return json(comments.results ?? []);
});

orgRoutes.post("/:orgSlug/teams/:teamKey/issues/:issueNumber/comments", async (c) => {
  const user = c.get("user");
  const org = await getOrgBySlug(c.env, c.req.param("orgSlug"));
  const team = org ? await getTeamByKey(c.env, org.id, c.req.param("teamKey")) : null;
  if (!org || !team || !(await userHasTeamAccess(c.env, team.id, user.id))) {
    return error("NOT_FOUND", "Team not found", 404);
  }

  const issue = await c.env.DB.prepare(
    "SELECT id FROM issues WHERE team_id = ? AND number = ? AND deleted_at IS NULL"
  )
    .bind(team.id, Number(c.req.param("issueNumber")))
    .first<{ id: string }>();

  if (!issue) {
    return error("NOT_FOUND", "Issue not found", 404);
  }

  const body = await parseJsonBody<{ body?: string }>(c.req.raw);
  const text = body.body?.trim();
  if (!text) {
    return error("BODY_REQUIRED", "Comment body is required");
  }

  const id = newId();
  const timestamp = nowIso();
  await c.env.DB.prepare(
    "INSERT INTO issue_comments (id, issue_id, body, author_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(id, issue.id, text, user.id, timestamp, timestamp)
    .run();

  return json({ id, issue_id: issue.id, body: text, author_id: user.id, created_at: timestamp, updated_at: timestamp }, 201);
});

export const syncRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

syncRoutes.get("/bootstrap", requireAuth, async (c) => {
  const user = c.get("user");
  const orgSlug = c.req.query("orgSlug");
  if (!orgSlug) {
    return error("ORG_SLUG_REQUIRED", "orgSlug query param is required");
  }

  const org = await getOrgBySlug(c.env, orgSlug);
  if (!org || !(await userHasOrgAccess(c.env, org.id, user.id))) {
    return error("NOT_FOUND", "Organization not found", 404);
  }

  const teams = await c.env.DB.prepare("SELECT * FROM teams WHERE org_id = ?").bind(org.id).all();
  const teamRows = teams.results ?? [];
  const teamIds = teamRows.map((team) => (team as { id: string }).id);

  const states =
    teamIds.length === 0
      ? []
      : (
          await c.env.DB.prepare(
            `SELECT id, team_id, name, color, position, state_group as "group" FROM workflow_states WHERE team_id IN (${teamIds.map(() => "?").join(",")})`
          )
            .bind(...teamIds)
            .all()
        ).results ?? [];

  const issues: unknown[] = [];
  for (const team of teamRows) {
    const teamRow = team as { id: string; key: string };
    const rows = await c.env.DB.prepare(
      "SELECT * FROM issues WHERE team_id = ? AND deleted_at IS NULL"
    )
      .bind(teamRow.id)
      .all();
    for (const row of rows.results ?? []) {
      issues.push(await mapIssueRow(c.env, row as never, teamRow.key));
    }
  }

  const labels =
    teamIds.length === 0
      ? []
      : (
          await c.env.DB.prepare(
            `SELECT * FROM labels WHERE team_id IN (${teamIds.map(() => "?").join(",")}) AND deleted_at IS NULL`
          )
            .bind(...teamIds)
            .all()
        ).results ?? [];

  return json({
    org,
    teams: teamRows,
    states,
    issues,
    labels,
    comments: [],
  });
});

syncRoutes.get("/ws", async (c) => {
  const orgSlug = c.req.query("orgSlug");
  const token = c.req.query("token") ?? getBearerToken(c.req.raw);

  if (!orgSlug || !token) {
    return error("INVALID_REQUEST", "orgSlug and token are required", 400);
  }

  const verified = await verifyAccessToken(c.env, token);
  if (!verified) {
    return error("UNAUTHORIZED", "Invalid token", 401);
  }

  const org = await getOrgBySlug(c.env, orgSlug);
  if (!org) {
    return error("NOT_FOUND", "Organization not found", 404);
  }

  const roomId = c.env.SYNC_ROOMS.idFromName(org.id);
  const stub = c.env.SYNC_ROOMS.get(roomId);
  const url = new URL(c.req.url);
  url.searchParams.set("userId", verified.userId);
  url.searchParams.set("orgId", org.id);

  return stub.fetch(new Request(url.toString(), c.req.raw));
});
