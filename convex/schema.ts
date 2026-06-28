import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Shared validators — import these from feature code instead of redefining.
 * The schema is FROZEN for parallel track work: coordinate before editing this file.
 */
export const issueStatusValidator = v.union(
  v.literal("backlog"),
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("in_review"),
  v.literal("done"),
  v.literal("canceled")
);

export const issuePriorityValidator = v.union(
  v.literal("none"),
  v.literal("urgent"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

export const planValidator = v.union(
  v.literal("free"),
  v.literal("pro"),
  v.literal("enterprise")
);

export const memberRoleValidator = v.union(
  v.literal("admin"),
  v.literal("member")
);

export const projectStatusValidator = v.union(
  v.literal("backlog"),
  v.literal("planned"),
  v.literal("in_progress"),
  v.literal("paused"),
  v.literal("completed"),
  v.literal("canceled")
);

export const issueRelationTypeValidator = v.union(
  v.literal("blocks"),
  v.literal("blocked_by"),
  v.literal("related"),
  v.literal("duplicate_of")
);

/** Doc page lifecycle — archived pages keep `archivedAt` set. */
export const docPageStatusValidator = v.union(
  v.literal("active"),
  v.literal("archived")
);

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    activeOrgId: v.optional(v.id("organizations")),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    imageUrl: v.optional(v.string()),
    plan: planValidator,
    subscriptionStatus: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  members: defineTable({
    orgId: v.id("organizations"),
    userId: v.id("users"),
    role: memberRoleValidator,
  })
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_org_and_user", ["orgId", "userId"]),

  invitations: defineTable({
    orgId: v.id("organizations"),
    email: v.string(),
    role: memberRoleValidator,
    token: v.string(),
    invitedBy: v.id("users"),
    expiresAt: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("revoked")
    ),
  })
    .index("by_token", ["token"])
    .index("by_org", ["orgId"])
    .index("by_org_and_email", ["orgId", "email"]),

  // ── Workspace structure ────────────────────────────────────────────────
  teams: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    /** Issue prefix, e.g. "ENG" → ENG-123 */
    key: v.string(),
    description: v.optional(v.string()),
    /** Per-team issue number sequence */
    nextIssueNumber: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_and_key", ["orgId", "key"]),

  issues: defineTable({
    orgId: v.id("organizations"),
    teamId: v.id("teams"),
    /** Per-team sequence number, displayed as KEY-number */
    number: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    status: issueStatusValidator,
    priority: issuePriorityValidator,
    assigneeId: v.optional(v.id("users")),
    creatorId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    cycleId: v.optional(v.id("cycles")),
    parentIssueId: v.optional(v.id("issues")),
    estimate: v.optional(v.number()),
    /** Due date as ms since epoch */
    dueDate: v.optional(v.number()),
    /** Fractional ranking for board/list ordering */
    sortOrder: v.number(),
    /** Embedding for semantic duplicate detection (Track D fills this) */
    embedding: v.optional(v.array(v.float64())),
  })
    .index("by_org", ["orgId"])
    .index("by_team", ["teamId"])
    .index("by_team_and_number", ["teamId", "number"])
    .index("by_team_and_status", ["teamId", "status"])
    .index("by_assignee", ["orgId", "assigneeId"])
    .index("by_project", ["projectId"])
    .index("by_cycle", ["cycleId"])
    .index("by_parent", ["parentIssueId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["orgId", "teamId"],
    })
    .searchIndex("search_description", {
      searchField: "description",
      filterFields: ["orgId", "teamId"],
    })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["orgId"],
    }),

  labels: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    /** Hex color, e.g. "#5e6ad2" */
    color: v.string(),
  }).index("by_org", ["orgId"]),

  issueLabels: defineTable({
    issueId: v.id("issues"),
    labelId: v.id("labels"),
  })
    .index("by_issue", ["issueId"])
    .index("by_label", ["labelId"]),

  issueRelations: defineTable({
    issueId: v.id("issues"),
    relatedIssueId: v.id("issues"),
    type: issueRelationTypeValidator,
  })
    .index("by_issue", ["issueId"])
    .index("by_related", ["relatedIssueId"]),

  comments: defineTable({
    orgId: v.id("organizations"),
    issueId: v.id("issues"),
    authorId: v.id("users"),
    body: v.string(),
    /** User ids @mentioned in the body */
    mentions: v.optional(v.array(v.id("users"))),
  }).index("by_issue", ["issueId"]),

  activity: defineTable({
    orgId: v.id("organizations"),
    issueId: v.id("issues"),
    actorId: v.id("users"),
    /** e.g. "created" | "status_changed" | "assigned" | "labeled" | "commented" */
    type: v.string(),
    field: v.optional(v.string()),
    oldValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
  })
    .index("by_issue", ["issueId"])
    .index("by_org", ["orgId"]),

  projects: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    status: projectStatusValidator,
    leadId: v.optional(v.id("users")),
    /** Target date as ms since epoch */
    targetDate: v.optional(v.number()),
    color: v.optional(v.string()),
  }).index("by_org", ["orgId"]),

  cycles: defineTable({
    orgId: v.id("organizations"),
    teamId: v.id("teams"),
    /** Per-team cycle sequence: Cycle 1, Cycle 2, ... */
    number: v.number(),
    name: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_team_and_number", ["teamId", "number"]),

  attachments: defineTable({
    orgId: v.id("organizations"),
    issueId: v.id("issues"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    uploadedBy: v.id("users"),
  }).index("by_issue", ["issueId"]),

  views: defineTable({
    orgId: v.id("organizations"),
    creatorId: v.id("users"),
    name: v.string(),
    /** JSON-serialized filter configuration (owned by Track A) */
    filters: v.string(),
    shared: v.boolean(),
  })
    .index("by_org", ["orgId"])
    .index("by_creator", ["creatorId"]),

  // ── Docs / Wiki (Track G) ────────────────────────────────────────────────
  docSpaces: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
    icon: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    archivedAt: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_org_and_slug", ["orgId", "slug"]),

  docPages: defineTable({
    orgId: v.id("organizations"),
    spaceId: v.id("docSpaces"),
    parentPageId: v.optional(v.id("docPages")),
    title: v.string(),
    slug: v.string(),
    sortOrder: v.number(),
    currentRevisionId: v.optional(v.id("docPageRevisions")),
    createdBy: v.id("users"),
    updatedAt: v.number(),
    archivedAt: v.optional(v.number()),
    /** Denormalized body snippet for search + previews */
    bodySnippet: v.optional(v.string()),
  })
    .index("by_org", ["orgId"])
    .index("by_space", ["spaceId"])
    .index("by_space_and_slug", ["spaceId", "slug"])
    .index("by_parent", ["parentPageId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["orgId", "spaceId"],
    })
    .searchIndex("search_body", {
      searchField: "bodySnippet",
      filterFields: ["orgId", "spaceId"],
    }),

  docPageRevisions: defineTable({
    orgId: v.id("organizations"),
    pageId: v.id("docPages"),
    body: v.string(),
    editorId: v.id("users"),
    createdAt: v.number(),
    changeSummary: v.optional(v.string()),
  }).index("by_page", ["pageId"]),

  docComments: defineTable({
    orgId: v.id("organizations"),
    pageId: v.id("docPages"),
    authorId: v.id("users"),
    body: v.string(),
    mentions: v.optional(v.array(v.id("users"))),
    createdAt: v.number(),
  }).index("by_page", ["pageId"]),

  docPageIssueLinks: defineTable({
    orgId: v.id("organizations"),
    pageId: v.id("docPages"),
    issueId: v.id("issues"),
  })
    .index("by_page", ["pageId"])
    .index("by_issue", ["issueId"])
    .index("by_org_and_issue", ["orgId", "issueId"]),
});
