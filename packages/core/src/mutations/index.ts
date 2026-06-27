function randomUUID(): string {
  return crypto.randomUUID();
}
import type { Store } from "tinybase";
import type { Issue, OutboxEntry, Priority } from "../schemas/index.js";
import { enqueueOutbox, upsertIssue } from "../local/index.js";

export function nowIso(): string {
  return new Date().toISOString();
}

export function createIdempotencyKey(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export type CreateIssueInput = {
  team_id: string;
  org_id: string;
  team_key: string;
  number: number;
  title: string;
  description?: string;
  priority?: Priority;
  state_id: string;
  created_by: string;
};

export function createIssueLocal(store: Store, input: CreateIssueInput): Issue {
  const timestamp = nowIso();
  const id = randomUUID();
  const issue: Issue = {
    id,
    team_id: input.team_id,
    org_id: input.org_id,
    number: input.number,
    identifier: `${input.team_key}-${input.number}`,
    title: input.title,
    description: input.description ?? "",
    priority: input.priority ?? "none",
    state_id: input.state_id,
    assignee_ids: [],
    label_ids: [],
    created_by: input.created_by,
    updated_by: input.created_by,
    created_at: timestamp,
    updated_at: timestamp,
  };

  const idempotency_key = createIdempotencyKey("issue_create");
  const outbox: OutboxEntry = {
    id: randomUUID(),
    idempotency_key,
    op: "issue.create",
    payload: { issue },
    created_at: timestamp,
    retry_count: 0,
  };

  upsertIssue(store, issue);
  enqueueOutbox(store, outbox);
  return issue;
}

export type UpdateIssueInput = {
  issue_id: string;
  updated_by: string;
  title?: string;
  description?: string;
  priority?: Priority;
  state_id?: string;
  assignee_ids?: string[];
  label_ids?: string[];
};

export function updateIssueLocal(store: Store, input: UpdateIssueInput): Issue | undefined {
  const existing = store.getRow("issues", input.issue_id) as unknown as Issue | undefined;
  if (!existing || existing.deleted_at) {
    return undefined;
  }

  const timestamp = nowIso();
  const updated: Issue = {
    ...existing,
    title: input.title ?? existing.title,
    description: input.description ?? existing.description,
    priority: input.priority ?? existing.priority,
    state_id: input.state_id ?? existing.state_id,
    assignee_ids: input.assignee_ids ?? existing.assignee_ids,
    label_ids: input.label_ids ?? existing.label_ids,
    updated_by: input.updated_by,
    updated_at: timestamp,
  };

  const outbox: OutboxEntry = {
    id: randomUUID(),
    idempotency_key: createIdempotencyKey("issue_update"),
    op: "issue.update",
    payload: { issue: updated },
    created_at: timestamp,
    retry_count: 0,
  };

  upsertIssue(store, updated);
  enqueueOutbox(store, outbox);
  return updated;
}

export function deleteIssueLocal(store: Store, issueId: string, updatedBy: string): Issue | undefined {
  const existing = store.getRow("issues", issueId) as unknown as Issue | undefined;
  if (!existing || existing.deleted_at) {
    return undefined;
  }

  const timestamp = nowIso();
  const updated: Issue = {
    ...existing,
    deleted_at: timestamp,
    updated_by: updatedBy,
    updated_at: timestamp,
  };

  const outbox: OutboxEntry = {
    id: randomUUID(),
    idempotency_key: createIdempotencyKey("issue_delete"),
    op: "issue.delete",
    payload: { issue_id: issueId },
    created_at: timestamp,
    retry_count: 0,
  };

  upsertIssue(store, updated);
  enqueueOutbox(store, outbox);
  return updated;
}
