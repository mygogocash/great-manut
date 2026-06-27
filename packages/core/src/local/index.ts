import { createStore } from "tinybase";
import type { Store } from "tinybase";
import type { Issue, Label, OutboxEntry, Team, WorkflowState } from "../schemas/index.js";

export type LocalStore = Store;

export const TABLE_ISSUES = "issues";
export const TABLE_TEAMS = "teams";
export const TABLE_LABELS = "labels";
export const TABLE_STATES = "workflow_states";
export const TABLE_OUTBOX = "outbox_queue";
export const TABLE_SYNC_META = "sync_meta";

type LocalRow = Record<string, string | number | boolean | null | undefined>;

function toRow(value: object): LocalRow {
  return value as LocalRow;
}

export function createLocalStore(): Store {
  return createStore()
    .setTable(TABLE_ISSUES, {})
    .setTable(TABLE_TEAMS, {})
    .setTable(TABLE_LABELS, {})
    .setTable(TABLE_STATES, {})
    .setTable(TABLE_OUTBOX, {})
    .setTable(TABLE_SYNC_META, {});
}

function serializeIssue(issue: Issue): LocalRow {
  return {
    ...issue,
    assignee_ids: JSON.stringify(issue.assignee_ids),
    label_ids: JSON.stringify(issue.label_ids),
  };
}

function deserializeIssue(row: LocalRow): Issue {
  return {
    ...(row as unknown as Issue),
    assignee_ids: JSON.parse(String(row.assignee_ids ?? "[]")),
    label_ids: JSON.parse(String(row.label_ids ?? "[]")),
  };
}

export function upsertIssue(store: Store, issue: Issue) {
  store.setRow(TABLE_ISSUES, issue.id, serializeIssue(issue) as never);
}

export function upsertTeam(store: Store, team: Team) {
  store.setRow(TABLE_TEAMS, team.id, toRow(team) as never);
}

export function upsertLabel(store: Store, label: Label) {
  store.setRow(TABLE_LABELS, label.id, toRow(label) as never);
}

export function upsertState(store: Store, state: WorkflowState) {
  store.setRow(TABLE_STATES, state.id, toRow(state) as never);
}

export function enqueueOutbox(store: Store, entry: OutboxEntry) {
  store.setRow(TABLE_OUTBOX, entry.id, toRow({ ...entry, payload: JSON.stringify(entry.payload) }) as never);
}

export function listOutboxEntries(store: Store): OutboxEntry[] {
  const table = store.getTable(TABLE_OUTBOX);
  return Object.values(table)
    .map((row) => {
      const entry = row as unknown as OutboxEntry & { payload: string | Record<string, unknown> };
      return {
        ...entry,
        payload:
          typeof entry.payload === "string" ? JSON.parse(entry.payload) : entry.payload ?? {},
      } satisfies OutboxEntry;
    })
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function removeOutboxEntry(store: Store, id: string) {
  store.delRow(TABLE_OUTBOX, id);
}

export function listActiveIssues(
  store: Store,
  teamId: string,
  filters?: { stateId?: string; assigneeId?: string }
): Issue[] {
  const table = store.getTable(TABLE_ISSUES);
  return Object.values(table)
    .map((row) => deserializeIssue(row as LocalRow))
    .filter((issue) => issue.team_id === teamId && !issue.deleted_at)
    .filter((issue) => (filters?.stateId ? issue.state_id === filters.stateId : true))
    .filter((issue) =>
      filters?.assigneeId ? issue.assignee_ids.includes(filters.assigneeId) : true
    )
    .sort((a, b) => b.number - a.number);
}

export function getIssueByIdentifier(store: Store, identifier: string): Issue | undefined {
  const table = store.getTable(TABLE_ISSUES);
  const match = Object.values(table).find((row) => deserializeIssue(row as LocalRow).identifier === identifier);
  return match ? deserializeIssue(match as LocalRow) : undefined;
}

export function hydrateBootstrap(
  store: Store,
  snapshot: {
    teams: Team[];
    states: WorkflowState[];
    issues: Issue[];
    labels: Label[];
  }
) {
  for (const team of snapshot.teams) upsertTeam(store, team);
  for (const state of snapshot.states) upsertState(store, state);
  for (const issue of snapshot.issues) upsertIssue(store, issue);
  for (const label of snapshot.labels) upsertLabel(store, label);
}
