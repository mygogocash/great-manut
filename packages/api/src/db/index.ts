import type { Env } from "../types.js";
import { newId, nowIso } from "../lib/http.js";

export type DbUser = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export async function findUserByEmail(env: Env, email: string): Promise<DbUser | null> {
  return env.DB.prepare("SELECT * FROM users WHERE email = ?")
    .bind(email.toLowerCase())
    .first<DbUser>();
}

export async function createUser(env: Env, email: string, displayName?: string): Promise<DbUser> {
  const timestamp = nowIso();
  const user: DbUser = {
    id: newId(),
    email: email.toLowerCase(),
    display_name: displayName ?? email.split("@")[0] ?? "User",
    avatar_url: null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  await env.DB.prepare(
    "INSERT INTO users (id, email, display_name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(user.id, user.email, user.display_name, user.avatar_url, user.created_at, user.updated_at)
    .run();

  return user;
}

export async function getOrCreateUser(env: Env, email: string): Promise<DbUser> {
  const existing = await findUserByEmail(env, email);
  if (existing) {
    return existing;
  }
  return createUser(env, email);
}

export async function isIdempotencyApplied(env: Env, key: string): Promise<boolean> {
  const row = await env.DB.prepare("SELECT key FROM applied_idempotency_keys WHERE key = ?")
    .bind(key)
    .first();
  return Boolean(row);
}

export async function markIdempotencyApplied(
  env: Env,
  key: string,
  entityType?: string,
  entityId?: string
): Promise<void> {
  await env.DB.prepare(
    "INSERT OR IGNORE INTO applied_idempotency_keys (key, applied_at, entity_type, entity_id) VALUES (?, ?, ?, ?)"
  )
    .bind(key, nowIso(), entityType ?? null, entityId ?? null)
    .run();
}

export async function getOrgBySlug(env: Env, slug: string) {
  return env.DB.prepare("SELECT * FROM organizations WHERE slug = ?").bind(slug).first<{
    id: string;
    slug: string;
    name: string;
    created_at: string;
    updated_at: string;
  }>();
}

export async function userHasOrgAccess(env: Env, orgId: string, userId: string): Promise<boolean> {
  const row = await env.DB.prepare(
    "SELECT id FROM organization_members WHERE org_id = ? AND user_id = ?"
  )
    .bind(orgId, userId)
    .first();
  return Boolean(row);
}

export async function getTeamByKey(env: Env, orgId: string, teamKey: string) {
  return env.DB.prepare("SELECT * FROM teams WHERE org_id = ? AND key = ?")
    .bind(orgId, teamKey.toUpperCase())
    .first<{
      id: string;
      org_id: string;
      key: string;
      name: string;
      created_at: string;
      updated_at: string;
    }>();
}

export async function userHasTeamAccess(env: Env, teamId: string, userId: string): Promise<boolean> {
  const row = await env.DB.prepare("SELECT id FROM team_members WHERE team_id = ? AND user_id = ?")
    .bind(teamId, userId)
    .first();
  return Boolean(row);
}

export async function nextIssueNumber(env: Env, teamId: string): Promise<number> {
  const row = await env.DB.prepare("SELECT MAX(number) as max_number FROM issues WHERE team_id = ?")
    .bind(teamId)
    .first<{ max_number: number | null }>();
  return (row?.max_number ?? 0) + 1;
}

export async function mapIssueRow(
  env: Env,
  row: {
    id: string;
    team_id: string;
    org_id: string;
    number: number;
    title: string;
    description: string;
    priority: string;
    state_id: string;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
  },
  teamKey: string
) {
  const assignees = await env.DB.prepare(
    "SELECT user_id FROM issue_assignees WHERE issue_id = ? AND deleted_at IS NULL"
  )
    .bind(row.id)
    .all<{ user_id: string }>();

  const labels = await env.DB.prepare(
    "SELECT label_id FROM issue_labels WHERE issue_id = ? AND deleted_at IS NULL"
  )
    .bind(row.id)
    .all<{ label_id: string }>();

  return {
    id: row.id,
    team_id: row.team_id,
    org_id: row.org_id,
    number: row.number,
    identifier: `${teamKey}-${row.number}`,
    title: row.title,
    description: row.description,
    priority: row.priority,
    state_id: row.state_id,
    assignee_ids: (assignees.results ?? []).map((item: { user_id: string }) => item.user_id),
    label_ids: (labels.results ?? []).map((item: { label_id: string }) => item.label_id),
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at ?? null,
  };
}

export async function seedDefaultWorkflowStates(env: Env, teamId: string): Promise<void> {
  const defaults = [
    { name: "Backlog", color: "#bec2c8", position: 0, state_group: "backlog" },
    { name: "Todo", color: "#e2e2e2", position: 1, state_group: "unstarted" },
    { name: "In Progress", color: "#f2c94c", position: 2, state_group: "started" },
    { name: "Done", color: "#5e6ad2", position: 3, state_group: "completed" },
    { name: "Canceled", color: "#95a2b3", position: 4, state_group: "canceled" },
  ];

  for (const state of defaults) {
    await env.DB.prepare(
      "INSERT INTO workflow_states (id, team_id, name, color, position, state_group) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(newId(), teamId, state.name, state.color, state.position, state.state_group)
      .run();
  }
}
