import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { getOrgIssue } from "./issues";
import { orgMutation, orgQuery } from "./lib/customFunctions";
import { slugifyName } from "./lib/slug";
import { userDisplayName, userImageUrl } from "./lib/userDisplay";
import { parseIssueKeys } from "../lib/issue-key";

const SNIPPET_LENGTH = 200;
const REVISIONS_PER_PAGE = 25;
const SEARCH_RESULTS = 25;

export const spaceShape = {
  _id: v.id("docSpaces"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  teamId: v.optional(v.id("teams")),
  icon: v.optional(v.string()),
  createdBy: v.id("users"),
  createdAt: v.number(),
  archivedAt: v.optional(v.number()),
};

export const pageShape = {
  _id: v.id("docPages"),
  _creationTime: v.number(),
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
  bodySnippet: v.optional(v.string()),
};

const revisionShape = {
  _id: v.id("docPageRevisions"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  pageId: v.id("docPages"),
  body: v.string(),
  editorId: v.id("users"),
  createdAt: v.number(),
  changeSummary: v.optional(v.string()),
};

const treeNodeValidator = v.object({
  ...pageShape,
  children: v.array(v.any()),
});

async function getOrgSpace(
  ctx: { db: QueryCtx["db"] },
  orgId: Id<"organizations">,
  spaceId: Id<"docSpaces">
): Promise<Doc<"docSpaces">> {
  const space = await ctx.db.get(spaceId);
  if (!space || space.orgId !== orgId) {
    throw new Error("Space not found");
  }
  return space;
}

export async function getOrgPage(
  ctx: { db: QueryCtx["db"] },
  orgId: Id<"organizations">,
  pageId: Id<"docPages">
): Promise<Doc<"docPages">> {
  const page = await ctx.db.get(pageId);
  if (!page || page.orgId !== orgId) {
    throw new Error("Page not found");
  }
  return page;
}

async function uniqueSpaceSlug(
  ctx: { db: QueryCtx["db"] },
  orgId: Id<"organizations">,
  name: string,
  excludeId?: Id<"docSpaces">
): Promise<string> {
  const base = slugifyName(name);
  let slug = base;
  let suffix = 0;
  while (true) {
    const existing = await ctx.db
      .query("docSpaces")
      .withIndex("by_org_and_slug", (q) =>
        q.eq("orgId", orgId).eq("slug", slug)
      )
      .unique();
    if (!existing || existing._id === excludeId) {
      return slug;
    }
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

async function uniquePageSlug(
  ctx: { db: QueryCtx["db"] },
  spaceId: Id<"docSpaces">,
  title: string,
  excludeId?: Id<"docPages">
): Promise<string> {
  const base = slugifyName(title);
  let slug = base;
  let suffix = 0;
  while (true) {
    const existing = await ctx.db
      .query("docPages")
      .withIndex("by_space_and_slug", (q) =>
        q.eq("spaceId", spaceId).eq("slug", slug)
      )
      .unique();
    if (!existing || existing._id === excludeId) {
      return slug;
    }
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

function bodySnippet(body: string): string {
  const trimmed = body.replace(/\s+/g, " ").trim();
  if (trimmed.length <= SNIPPET_LENGTH) {
    return trimmed;
  }
  return trimmed.slice(0, SNIPPET_LENGTH);
}

function canManageSpace(
  space: Doc<"docSpaces">,
  userId: Id<"users">,
  role: "admin" | "member"
): boolean {
  return role === "admin" || space.createdBy === userId;
}

async function syncIssueLinksFromBody(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
  pageId: Id<"docPages">,
  body: string
) {
  const keys = parseIssueKeys(body);
  const issueIds = new Set<Id<"issues">>();
  for (const key of keys) {
    const team = await ctx.db
      .query("teams")
      .withIndex("by_org_and_key", (q) =>
        q.eq("orgId", orgId).eq("key", key.teamKey)
      )
      .unique();
    if (!team) {
      continue;
    }
    const issue = await ctx.db
      .query("issues")
      .withIndex("by_team_and_number", (q) =>
        q.eq("teamId", team._id).eq("number", key.number)
      )
      .unique();
    if (issue && issue.orgId === orgId) {
      issueIds.add(issue._id);
    }
  }

  const existing = await ctx.db
    .query("docPageIssueLinks")
    .withIndex("by_page", (q) => q.eq("pageId", pageId))
    .collect();

  const existingIds = new Set(existing.map((link) => link.issueId));
  for (const issueId of issueIds) {
    if (!existingIds.has(issueId)) {
      await ctx.db.insert("docPageIssueLinks", {
        orgId,
        pageId,
        issueId,
      });
    }
  }
}

// ── Spaces ───────────────────────────────────────────────────────────────────

export const spacesList = orgQuery({
  args: { includeArchived: v.optional(v.boolean()) },
  returns: v.array(
    v.object({
      ...spaceShape,
      pageCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const spaces = await ctx.db
      .query("docSpaces")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .collect();

    const result = [];
    for (const space of spaces) {
      if (!args.includeArchived && space.archivedAt) {
        continue;
      }
      const pages = await ctx.db
        .query("docPages")
        .withIndex("by_space", (q) => q.eq("spaceId", space._id))
        .collect();
      const pageCount = pages.filter((p) => !p.archivedAt).length;
      result.push({ ...space, pageCount });
    }
    return result;
  },
});

export const spacesGet = orgQuery({
  args: { spaceId: v.id("docSpaces") },
  returns: v.object(spaceShape),
  handler: async (ctx, args) => {
    return await getOrgSpace(ctx, ctx.org._id, args.spaceId);
  },
});

export const spacesCreate = orgMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
    icon: v.optional(v.string()),
  },
  returns: v.id("docSpaces"),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) {
      throw new Error("Space name is required");
    }
    if (args.teamId) {
      const team = await ctx.db.get(args.teamId);
      if (!team || team.orgId !== ctx.org._id) {
        throw new Error("Team not found");
      }
    }
    const slug = await uniqueSpaceSlug(ctx, ctx.org._id, name);
    return await ctx.db.insert("docSpaces", {
      orgId: ctx.org._id,
      name,
      slug,
      description: args.description?.trim() || undefined,
      teamId: args.teamId,
      icon: args.icon,
      createdBy: ctx.user._id,
      createdAt: Date.now(),
    });
  },
});

export const spacesUpdate = orgMutation({
  args: {
    spaceId: v.id("docSpaces"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
    icon: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const space = await getOrgSpace(ctx, ctx.org._id, args.spaceId);
    if (!canManageSpace(space, ctx.user._id, ctx.membership.role)) {
      throw new Error("Only the space creator or an admin can update this space");
    }
    const updates: Partial<Doc<"docSpaces">> = {};
    if (args.name !== undefined) {
      const name = args.name.trim();
      if (!name) {
        throw new Error("Space name is required");
      }
      updates.name = name;
      updates.slug = await uniqueSpaceSlug(ctx, ctx.org._id, name, space._id);
    }
    if (args.description !== undefined) {
      updates.description = args.description.trim() || undefined;
    }
    if (args.teamId !== undefined) {
      if (args.teamId) {
        const team = await ctx.db.get(args.teamId);
        if (!team || team.orgId !== ctx.org._id) {
          throw new Error("Team not found");
        }
      }
      updates.teamId = args.teamId;
    }
    if (args.icon !== undefined) {
      updates.icon = args.icon || undefined;
    }
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(space._id, updates);
    }
    return null;
  },
});

export const spacesArchive = orgMutation({
  args: { spaceId: v.id("docSpaces") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const space = await getOrgSpace(ctx, ctx.org._id, args.spaceId);
    if (!canManageSpace(space, ctx.user._id, ctx.membership.role)) {
      throw new Error("Only the space creator or an admin can archive this space");
    }
    await ctx.db.patch(space._id, { archivedAt: Date.now() });
    return null;
  },
});

// ── Pages ────────────────────────────────────────────────────────────────────

export const pagesCreate = orgMutation({
  args: {
    spaceId: v.id("docSpaces"),
    title: v.string(),
    parentPageId: v.optional(v.id("docPages")),
  },
  returns: v.id("docPages"),
  handler: async (ctx, args) => {
    const space = await getOrgSpace(ctx, ctx.org._id, args.spaceId);
    if (space.archivedAt) {
      throw new Error("Cannot create pages in an archived space");
    }
    const title = args.title.trim();
    if (!title) {
      throw new Error("Page title is required");
    }
    if (args.parentPageId) {
      const parent = await getOrgPage(ctx, ctx.org._id, args.parentPageId);
      if (parent.spaceId !== space._id) {
        throw new Error("Parent page must be in the same space");
      }
    }

    const siblings = await ctx.db
      .query("docPages")
      .withIndex("by_space", (q) => q.eq("spaceId", space._id))
      .collect();
    const siblingPages = siblings.filter(
      (p) => p.parentPageId === args.parentPageId && !p.archivedAt
    );
    const maxSort = siblingPages.reduce(
      (max, p) => Math.max(max, p.sortOrder),
      0
    );

    const slug = await uniquePageSlug(ctx, space._id, title);
    const now = Date.now();
    const pageId = await ctx.db.insert("docPages", {
      orgId: ctx.org._id,
      spaceId: space._id,
      parentPageId: args.parentPageId,
      title,
      slug,
      sortOrder: maxSort + 1000,
      createdBy: ctx.user._id,
      updatedAt: now,
    });

    const revisionId = await ctx.db.insert("docPageRevisions", {
      orgId: ctx.org._id,
      pageId,
      body: "",
      editorId: ctx.user._id,
      createdAt: now,
    });
    await ctx.db.patch(pageId, { currentRevisionId: revisionId });
    return pageId;
  },
});

export const pagesUpdateTitle = orgMutation({
  args: {
    pageId: v.id("docPages"),
    title: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const page = await getOrgPage(ctx, ctx.org._id, args.pageId);
    const title = args.title.trim();
    if (!title) {
      throw new Error("Page title is required");
    }
    const slug = await uniquePageSlug(ctx, page.spaceId, title, page._id);
    await ctx.db.patch(page._id, {
      title,
      slug,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const pagesUpdateBody = orgMutation({
  args: {
    pageId: v.id("docPages"),
    body: v.string(),
    changeSummary: v.optional(v.string()),
  },
  returns: v.id("docPageRevisions"),
  handler: async (ctx, args) => {
    const page = await getOrgPage(ctx, ctx.org._id, args.pageId);
    if (page.archivedAt) {
      throw new Error("Cannot edit an archived page");
    }
    const now = Date.now();
    const revisionId = await ctx.db.insert("docPageRevisions", {
      orgId: ctx.org._id,
      pageId: page._id,
      body: args.body,
      editorId: ctx.user._id,
      createdAt: now,
      changeSummary: args.changeSummary?.trim() || undefined,
    });
    await ctx.db.patch(page._id, {
      currentRevisionId: revisionId,
      updatedAt: now,
      bodySnippet: bodySnippet(args.body),
    });
    await syncIssueLinksFromBody(ctx, ctx.org._id, page._id, args.body);
    return revisionId;
  },
});

export const pagesArchive = orgMutation({
  args: { pageId: v.id("docPages") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const page = await getOrgPage(ctx, ctx.org._id, args.pageId);
    await ctx.db.patch(page._id, {
      archivedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const pagesGet = orgQuery({
  args: { pageId: v.id("docPages") },
  returns: v.object({
    page: v.object(pageShape),
    body: v.string(),
    space: v.object(spaceShape),
    editorName: v.string(),
    editorImageUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const page = await getOrgPage(ctx, ctx.org._id, args.pageId);
    const space = await getOrgSpace(ctx, ctx.org._id, page.spaceId);
    let body = "";
    let editorName = "Unknown";
    let editorImageUrl: string | undefined;
    if (page.currentRevisionId) {
      const revision = await ctx.db.get(page.currentRevisionId);
      if (revision && revision.orgId === ctx.org._id) {
        body = revision.body;
        const editor = await ctx.db.get(revision.editorId);
        editorName = userDisplayName(editor);
        editorImageUrl = userImageUrl(editor);
      }
    }
    return {
      page,
      body,
      space,
      editorName,
      editorImageUrl,
    };
  },
});

type TreeNode = Doc<"docPages"> & { children: TreeNode[] };

function buildTree(
  pages: Doc<"docPages">[],
  parentId: Id<"docPages"> | undefined
): TreeNode[] {
  const nodes = pages
    .filter((p) => p.parentPageId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return nodes.map((page) => ({
    ...page,
    children: buildTree(pages, page._id),
  }));
}

export const pagesListTree = orgQuery({
  args: {
    spaceId: v.id("docSpaces"),
    includeArchived: v.optional(v.boolean()),
  },
  returns: v.array(treeNodeValidator),
  handler: async (ctx, args) => {
    await getOrgSpace(ctx, ctx.org._id, args.spaceId);
    const pages = await ctx.db
      .query("docPages")
      .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
      .collect();
    const filtered = args.includeArchived
      ? pages
      : pages.filter((p) => !p.archivedAt);
    return buildTree(filtered, undefined);
  },
});

export const pagesListByIssueId = orgQuery({
  args: { issueId: v.id("issues") },
  returns: v.array(
    v.object({
      pageId: v.id("docPages"),
      title: v.string(),
      spaceId: v.id("docSpaces"),
      spaceName: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    await getOrgIssue(ctx, ctx.org._id, args.issueId);
    const links = await ctx.db
      .query("docPageIssueLinks")
      .withIndex("by_org_and_issue", (q) =>
        q.eq("orgId", ctx.org._id).eq("issueId", args.issueId)
      )
      .collect();

    const result = [];
    const seen = new Set<Id<"docPages">>();
    for (const link of links) {
      if (seen.has(link.pageId)) {
        continue;
      }
      seen.add(link.pageId);
      const page = await ctx.db.get(link.pageId);
      if (!page || page.orgId !== ctx.org._id || page.archivedAt) {
        continue;
      }
      const space = await ctx.db.get(page.spaceId);
      if (!space || space.orgId !== ctx.org._id) {
        continue;
      }
      result.push({
        pageId: page._id,
        title: page.title,
        spaceId: space._id,
        spaceName: space.name,
      });
    }
    return result;
  },
});

export const pagesLinkIssue = orgMutation({
  args: {
    pageId: v.id("docPages"),
    issueId: v.id("issues"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const page = await getOrgPage(ctx, ctx.org._id, args.pageId);
    await getOrgIssue(ctx, ctx.org._id, args.issueId);
    const existing = await ctx.db
      .query("docPageIssueLinks")
      .withIndex("by_page", (q) => q.eq("pageId", page._id))
      .collect();
    if (existing.some((l) => l.issueId === args.issueId)) {
      return null;
    }
    await ctx.db.insert("docPageIssueLinks", {
      orgId: ctx.org._id,
      pageId: page._id,
      issueId: args.issueId,
    });
    return null;
  },
});

// ── Revisions ────────────────────────────────────────────────────────────────

export const revisionsList = orgQuery({
  args: {
    pageId: v.id("docPages"),
    cursor: v.optional(v.number()),
  },
  returns: v.object({
    revisions: v.array(
      v.object({
        ...revisionShape,
        editorName: v.string(),
        editorImageUrl: v.optional(v.string()),
      })
    ),
    nextCursor: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    await getOrgPage(ctx, ctx.org._id, args.pageId);
    const all = await ctx.db
      .query("docPageRevisions")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .collect();
    const sorted = all
      .filter((r) => r.orgId === ctx.org._id)
      .sort((a, b) => b.createdAt - a.createdAt);

    const start = args.cursor ?? 0;
    const slice = sorted.slice(start, start + REVISIONS_PER_PAGE);

    const revisions = [];
    for (const revision of slice) {
      const editor = await ctx.db.get(revision.editorId);
      revisions.push({
        ...revision,
        editorName: userDisplayName(editor),
        editorImageUrl: userImageUrl(editor),
      });
    }

    const nextStart = start + slice.length;
    return {
      revisions,
      nextCursor:
        nextStart < sorted.length ? nextStart : undefined,
    };
  },
});

export const revisionsGet = orgQuery({
  args: { revisionId: v.id("docPageRevisions") },
  returns: v.object({
    ...revisionShape,
    editorName: v.string(),
    editorImageUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const revision = await ctx.db.get(args.revisionId);
    if (!revision || revision.orgId !== ctx.org._id) {
      throw new Error("Revision not found");
    }
    await getOrgPage(ctx, ctx.org._id, revision.pageId);
    const editor = await ctx.db.get(revision.editorId);
    return {
      ...revision,
      editorName: userDisplayName(editor),
      editorImageUrl: userImageUrl(editor),
    };
  },
});

// ── Issue key resolution ─────────────────────────────────────────────────────

export const resolveIssueKeys = orgQuery({
  args: {
    keys: v.array(
      v.object({
        teamKey: v.string(),
        number: v.number(),
      })
    ),
  },
  returns: v.array(
    v.object({
      teamKey: v.string(),
      number: v.number(),
      issueId: v.optional(v.id("issues")),
    })
  ),
  handler: async (ctx, args) => {
    const results = [];
    for (const key of args.keys) {
      const team = await ctx.db
        .query("teams")
        .withIndex("by_org_and_key", (q) =>
          q.eq("orgId", ctx.org._id).eq("key", key.teamKey)
        )
        .unique();
      if (!team) {
        results.push({ teamKey: key.teamKey, number: key.number });
        continue;
      }
      const issue = await ctx.db
        .query("issues")
        .withIndex("by_team_and_number", (q) =>
          q.eq("teamId", team._id).eq("number", key.number)
        )
        .unique();
      results.push({
        teamKey: key.teamKey,
        number: key.number,
        issueId:
          issue && issue.orgId === ctx.org._id ? issue._id : undefined,
      });
    }
    return results;
  },
});

export const resolveIssueKey = orgQuery({
  args: {
    teamKey: v.string(),
    number: v.number(),
  },
  returns: v.union(
    v.object({
      issueId: v.id("issues"),
      teamKey: v.string(),
      number: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const team = await ctx.db
      .query("teams")
      .withIndex("by_org_and_key", (q) =>
        q.eq("orgId", ctx.org._id).eq("key", args.teamKey)
      )
      .unique();
    if (!team) {
      return null;
    }
    const issue = await ctx.db
      .query("issues")
      .withIndex("by_team_and_number", (q) =>
        q.eq("teamId", team._id).eq("number", args.number)
      )
      .unique();
    if (!issue || issue.orgId !== ctx.org._id) {
      return null;
    }
    return {
      issueId: issue._id,
      teamKey: team.key,
      number: issue.number,
    };
  },
});

// ── Search ───────────────────────────────────────────────────────────────────

export const search = orgQuery({
  args: {
    query: v.string(),
    spaceId: v.optional(v.id("docSpaces")),
  },
  returns: v.array(
    v.object({
      pageId: v.id("docPages"),
      title: v.string(),
      snippet: v.optional(v.string()),
      spaceId: v.id("docSpaces"),
      spaceName: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const text = args.query.trim();
    if (!text) {
      return [];
    }
    if (args.spaceId) {
      await getOrgSpace(ctx, ctx.org._id, args.spaceId);
    }

    const titleMatches = await ctx.db
      .query("docPages")
      .withSearchIndex("search_title", (q) =>
        args.spaceId
          ? q
              .search("title", text)
              .eq("orgId", ctx.org._id)
              .eq("spaceId", args.spaceId)
          : q.search("title", text).eq("orgId", ctx.org._id)
      )
      .take(SEARCH_RESULTS);

    const bodyMatches = await ctx.db
      .query("docPages")
      .withSearchIndex("search_body", (q) =>
        args.spaceId
          ? q
              .search("bodySnippet", text)
              .eq("orgId", ctx.org._id)
              .eq("spaceId", args.spaceId)
          : q.search("bodySnippet", text).eq("orgId", ctx.org._id)
      )
      .take(SEARCH_RESULTS);

    const seen = new Set<Id<"docPages">>();
    const merged: Doc<"docPages">[] = [];
    for (const page of [...titleMatches, ...bodyMatches]) {
      if (page.archivedAt) {
        continue;
      }
      if (!seen.has(page._id)) {
        seen.add(page._id);
        merged.push(page);
      }
      if (merged.length >= SEARCH_RESULTS) {
        break;
      }
    }

    const spaceCache = new Map<Id<"docSpaces">, Doc<"docSpaces"> | null>();
    const results = [];
    for (const page of merged) {
      let space = spaceCache.get(page.spaceId);
      if (space === undefined) {
        space = await ctx.db.get(page.spaceId);
        spaceCache.set(page.spaceId, space);
      }
      if (space && space.orgId === ctx.org._id && !space.archivedAt) {
        results.push({
          pageId: page._id,
          title: page.title,
          snippet: page.bodySnippet,
          spaceId: space._id,
          spaceName: space.name,
        });
      }
    }
    return results;
  },
});
