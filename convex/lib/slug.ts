import { MutationCtx, QueryCtx } from "../_generated/server";

export function slugifyName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base.length > 0 ? base : "workspace";
}

export async function uniqueOrgSlug(
  ctx: QueryCtx | MutationCtx,
  baseName: string
): Promise<string> {
  const base = slugifyName(baseName);
  let slug = base;
  let suffix = 0;
  while (true) {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!existing) {
      return slug;
    }
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}
