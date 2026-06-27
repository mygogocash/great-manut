import { describe, expect, it } from "vitest";
import { createLocalStore, listActiveIssues, listOutboxEntries } from "../local/index.js";
import { createIssueLocal, updateIssueLocal } from "./index.js";

describe("mutations", () => {
  it("createIssueLocal writes issue and outbox atomically", () => {
    const store = createLocalStore();
    const issue = createIssueLocal(store, {
      team_id: "550e8400-e29b-41d4-a716-446655440001",
      org_id: "550e8400-e29b-41d4-a716-446655440002",
      team_key: "ENG",
      number: 42,
      title: "Ship sync",
      state_id: "550e8400-e29b-41d4-a716-446655440003",
      created_by: "550e8400-e29b-41d4-a716-446655440004",
    });

    expect(issue.identifier).toBe("ENG-42");
    expect(listActiveIssues(store, issue.team_id)).toHaveLength(1);
    expect(listOutboxEntries(store)).toHaveLength(1);
    expect(listOutboxEntries(store)[0]?.op).toBe("issue.create");
  });

  it("updateIssueLocal enqueues issue.update", () => {
    const store = createLocalStore();
    const issue = createIssueLocal(store, {
      team_id: "550e8400-e29b-41d4-a716-446655440001",
      org_id: "550e8400-e29b-41d4-a716-446655440002",
      team_key: "ENG",
      number: 1,
      title: "Old title",
      state_id: "550e8400-e29b-41d4-a716-446655440003",
      created_by: "550e8400-e29b-41d4-a716-446655440004",
    });

    const updated = updateIssueLocal(store, {
      issue_id: issue.id,
      updated_by: issue.created_by,
      title: "New title",
      priority: "high",
    });

    expect(updated?.title).toBe("New title");
    expect(listOutboxEntries(store)).toHaveLength(2);
    expect(listOutboxEntries(store)[1]?.op).toBe("issue.update");
  });
});
