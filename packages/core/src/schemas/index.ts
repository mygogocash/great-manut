import { z } from "zod";

export const prioritySchema = z.enum(["none", "urgent", "high", "medium", "low"]);
export type Priority = z.infer<typeof prioritySchema>;

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type User = z.infer<typeof userSchema>;

export const organizationSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Organization = z.infer<typeof organizationSchema>;

export const teamSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  key: z.string().min(2).max(6),
  name: z.string().min(1),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Team = z.infer<typeof teamSchema>;

export const workflowStateSchema = z.object({
  id: z.string().uuid(),
  team_id: z.string().uuid(),
  name: z.string().min(1),
  color: z.string(),
  position: z.number(),
  group: z.enum(["backlog", "unstarted", "started", "completed", "canceled"]),
});
export type WorkflowState = z.infer<typeof workflowStateSchema>;

export const labelSchema = z.object({
  id: z.string().uuid(),
  team_id: z.string().uuid(),
  name: z.string().min(1),
  color: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Label = z.infer<typeof labelSchema>;

export const issueSchema = z.object({
  id: z.string().uuid(),
  team_id: z.string().uuid(),
  org_id: z.string().uuid(),
  number: z.number().int().positive(),
  identifier: z.string(),
  title: z.string().min(1),
  description: z.string(),
  priority: prioritySchema,
  state_id: z.string().uuid(),
  assignee_ids: z.array(z.string().uuid()),
  label_ids: z.array(z.string().uuid()),
  created_by: z.string().uuid(),
  updated_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
});
export type Issue = z.infer<typeof issueSchema>;

export const commentSchema = z.object({
  id: z.string().uuid(),
  issue_id: z.string().uuid(),
  body: z.string(),
  author_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
});
export type Comment = z.infer<typeof commentSchema>;

export const outboxEntrySchema = z.object({
  id: z.string().uuid(),
  idempotency_key: z.string().min(1),
  op: z.enum([
    "issue.create",
    "issue.update",
    "issue.delete",
    "comment.create",
    "comment.update",
    "comment.delete",
    "label.create",
    "label.update",
    "label.delete",
  ]),
  payload: z.record(z.unknown()),
  created_at: z.string(),
  retry_count: z.number().int().nonnegative(),
});
export type OutboxEntry = z.infer<typeof outboxEntrySchema>;

export const syncDeltaSchema = z.object({
  type: z.enum(["mutation", "ack", "delta", "ping", "pong"]),
  idempotency_key: z.string().optional(),
  entity: z.string().optional(),
  data: z.unknown().optional(),
  server_sequence: z.number().int().optional(),
});
export type SyncDelta = z.infer<typeof syncDeltaSchema>;

export const bootstrapSnapshotSchema = z.object({
  org: organizationSchema,
  teams: z.array(teamSchema),
  states: z.array(workflowStateSchema),
  issues: z.array(issueSchema),
  labels: z.array(labelSchema),
  comments: z.array(commentSchema),
});
export type BootstrapSnapshot = z.infer<typeof bootstrapSnapshotSchema>;

export const authTokensSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number().int().positive(),
  token_type: z.literal("Bearer"),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;
