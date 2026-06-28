import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { issueShape } from "./issues";
import { orgQuery } from "./lib/customFunctions";
import { projectStatusValidator } from "./schema";

const RESULTS_PER_INDEX = 20;
const MAX_RESULTS = 25;

/**
 * Full-text search over issues using the `search_title` and
 * `search_description` indexes. Title matches rank ahead of
 * description-only matches; results are deduplicated and enriched with the
 * owning team so the UI can render identifiers (ENG-42) without extra
 * round trips.
 */
export const issues = orgQuery({
  args: {
    query: v.string(),
    teamId: v.optional(v.id("teams")),
  },
  returns: v.array(
    v.object({
      ...issueShape,
      teamKey: v.string(),
      teamName: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const text = args.query.trim();
    if (!text) {
      return [];
    }
    if (args.teamId) {
      const team = await ctx.db.get(args.teamId);
      if (!team || team.orgId !== ctx.org._id) {
        throw new Error("Team not found");
      }
    }

    const titleMatches = await ctx.db
      .query("issues")
      .withSearchIndex("search_title", (q) =>
        args.teamId
          ? q
              .search("title", text)
              .eq("orgId", ctx.org._id)
              .eq("teamId", args.teamId)
          : q.search("title", text).eq("orgId", ctx.org._id)
      )
      .take(RESULTS_PER_INDEX);

    const descriptionMatches = await ctx.db
      .query("issues")
      .withSearchIndex("search_description", (q) =>
        args.teamId
          ? q
              .search("description", text)
              .eq("orgId", ctx.org._id)
              .eq("teamId", args.teamId)
          : q.search("description", text).eq("orgId", ctx.org._id)
      )
      .take(RESULTS_PER_INDEX);

    // Dedupe, keeping title matches (better relevance signal) first.
    const seen = new Set<Id<"issues">>();
    const merged: Doc<"issues">[] = [];
    for (const issue of [...titleMatches, ...descriptionMatches]) {
      if (!seen.has(issue._id)) {
        seen.add(issue._id);
        merged.push(issue);
      }
      if (merged.length >= MAX_RESULTS) {
        break;
      }
    }

    const teamCache = new Map<Id<"teams">, Doc<"teams"> | null>();
    const results = [];
    for (const issue of merged) {
      let team = teamCache.get(issue.teamId);
      if (team === undefined) {
        team = await ctx.db.get(issue.teamId);
        teamCache.set(issue.teamId, team);
      }
      if (team && team.orgId === ctx.org._id) {
        results.push({ ...issue, teamKey: team.key, teamName: team.name });
      }
    }
    return results;
  },
});

const MAX_PROJECT_RESULTS = 25;

/** Filter projects by name or description (client-style org-scoped search). */
export const projects = orgQuery({
  args: { query: v.string() },
  returns: v.array(
    v.object({
      projectId: v.id("projects"),
      name: v.string(),
      description: v.optional(v.string()),
      status: projectStatusValidator,
    })
  ),
  handler: async (ctx, args) => {
    const text = args.query.trim().toLowerCase();
    if (!text) {
      return [];
    }
    const all = await ctx.db
      .query("projects")
      .withIndex("by_org", (q) => q.eq("orgId", ctx.org._id))
      .collect();
    const results = [];
    for (const project of all) {
      const haystack = `${project.name} ${project.description ?? ""}`.toLowerCase();
      if (haystack.includes(text)) {
        results.push({
          projectId: project._id,
          name: project.name,
          description: project.description,
          status: project.status,
        });
      }
      if (results.length >= MAX_PROJECT_RESULTS) {
        break;
      }
    }
    return results;
  },
});
