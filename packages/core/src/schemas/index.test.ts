import { describe, expect, it } from "vitest";
import { issueSchema } from "./index.js";

describe("issueSchema", () => {
  it("parses a valid issue", () => {
    const parsed = issueSchema.parse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      team_id: "550e8400-e29b-41d4-a716-446655440001",
      org_id: "550e8400-e29b-41d4-a716-446655440002",
      number: 1,
      identifier: "ENG-1",
      title: "First issue",
      description: "",
      priority: "none",
      state_id: "550e8400-e29b-41d4-a716-446655440003",
      assignee_ids: [],
      label_ids: [],
      created_by: "550e8400-e29b-41d4-a716-446655440004",
      updated_by: "550e8400-e29b-41d4-a716-446655440004",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });

    expect(parsed.identifier).toBe("ENG-1");
  });
});
