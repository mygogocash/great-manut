# Vector — Agent Guide

Vector (Manut) is a B2B multi-tenant teamwork platform: Linear-style issues plus Confluence-lite docs, product discovery, service desk, roadmaps, and AI — built with **Next.js 16 (App Router) + Convex + Convex Auth + shadcn/ui + Tailwind 4 + pnpm**, deployed on **Cloudflare Workers** via OpenNext.

This repo is built **foundation-first, then in parallel tracks**. Each track is developed by an agent in its own git worktree/branch. This file is the contract that keeps parallel work merge-safe.

## Golden rules for parallel work

1. **ADD files, don't edit shared files.** Your track owns specific directories (see the ownership map). Create new files there freely.
2. **Schema changes need coordination.** `convex/schema.ts` holds all tables and indexes. Prefer additive changes only; if you genuinely need a breaking schema change, stop and ask the human.
3. **These shared files are off-limits**: `package.json`, `pnpm-lock.yaml`, `convex/convex.config.ts`, `convex/schema.ts`, `convex/lib/*`, `convex/http.ts`, `components/providers.tsx`, `app/layout.tsx`, `middleware.ts`, `app/globals.css`, anything in `components/ui/` (shadcn primitives), and other tracks' directories. All dependencies you need are already installed.
4. **Registry files allow ONE-LINE additions only** (append an import + spread/entry; never modify existing lines):
   - `components/commands/registry.ts` — add command-palette commands & single-key shortcuts.
   - `components/issue-detail/slots.tsx` — register panels on the issue detail page (main column or sidebar).
   - `components/shell/app-sidebar.tsx` — nav links exist for suite sections; do not rewrite this file unless adding a one-line route entry.
5. **Placeholder pages may be REPLACED** by the owning track (they're marked with a comment): `app/(marketing)/page.tsx` (F), `app/(marketing)/pricing/page.tsx` (E).
6. **Don't run `npx convex dev` in your worktree** — the shared dev deployment is owned by the main checkout. Verify with `pnpm exec tsc --noEmit` and `pnpm lint`. Functional testing happens after merge to main. (`convex/_generated` is committed, so types resolve without a deploy.)
7. **Commit conventions**: conventional commits (`feat:`, `fix:`, `chore:`), small focused commits, branch names `track/<name>`.

## Architecture you must follow

- **Auth:** Convex Auth (`@convex-dev/auth`) with email/password. Users, orgs, and memberships live in Convex (`users`, `organizations`, `members`, `invitations`). Org context comes from the active org on the session/JWT. Never bypass `orgQuery` / `orgMutation` scoping.
- **Every Convex function** uses the wrappers from `convex/lib/customFunctions.ts`:
  - `orgQuery` / `orgMutation` — resolves `ctx.user`, `ctx.org`, `ctx.membership` from the active org and verifies membership. **Always scope queries by `ctx.org._id`** and verify any document you load belongs to `ctx.org._id`.
  - `orgAdminMutation` — same, plus requires the org admin role.
  - `authedQuery` / `authedMutation` — signed-in but org-agnostic (rare).
  - Public `query`/`mutation` without auth is forbidden except documented public endpoints (e.g. service desk portal submit).
- **Validators required** on args AND returns of every public function. Import shared validators from `convex/schema.ts`.
- **Billing gates** (demo billing — no Stripe/Clerk):
  - Plans: `free` / `pro` / `enterprise` on `ctx.org.plan`. Org admins switch plans via `organizations.updatePlan`.
  - In Convex: helpers in `convex/lib/limits.ts` — `assertCanCreateIssue`, `assertCanCreateProject`, `hasAiAccess`, `assertHasDocsWrite`, `assertHasDiscovery`, `assertHasServiceDesk`, `assertHasAutomations`, `FREE_PLAN_LIMITS`.
  - In UI: `useSuiteFeatureAccess` / `<FeatureGate feature="…">` from `components/billing/`. UI checks are cosmetic; Convex `assert*` helpers are the enforcement.
- **Activity logging**: any mutation that changes an issue should call `logActivity` from `convex/lib/activity.ts`.
- **UI conventions**: shadcn/ui components from `components/ui/`, lucide icons, Linear-style density (small text, h-7/h-9 rows), dark theme default with light mode via `next-themes`. Shared primitives in `components/shared/`.
- **Routes:** Workspace sections use client-side routing at `app/(app)/[orgSlug]/[[...section]]/page.tsx` via `lib/workspace-routes.ts` and `components/workspace/workspace-route-view.tsx`. Public customer portal: `app/portal/[orgSlug]/page.tsx` (`/portal/*` is public in `middleware.ts`). Issue detail remains a dedicated route under `team/[teamId]/issue/[issueId]`.

## Track ownership map

### Track A — Board & Views (`track/board-views`)

Kanban board (@dnd-kit, fractional `sortOrder`), list-view filtering, saved views, full-text search page.
**Owns:** `components/board/`, `components/views/`, `convex/views.ts`, `convex/search.ts`, team board views.

### Track B — Projects & Cycles (`track/projects-cycles`)

Project CRUD + progress, cycles per team, issue assignment via `issues.update`. Enforce `assertCanCreateProject`.
**Owns:** `components/projects/`, `components/cycles/`, `convex/projects.ts`, `convex/cycles.ts`, workspace views for projects/cycles.

### Track C — Issue Detail Collaboration (`track/issue-collab`)

Comments, activity feed, sub-issues, relations, attachments, presence.
**Owns:** `components/issue-detail/` (EXCEPT `slots.tsx` registry + `issue-properties.tsx`), `convex/comments.ts`, `convex/activity.ts`, `convex/attachments.ts`, `convex/issueRelations.ts`, `convex/presenceFns.ts`. Register panels in `components/issue-detail/slots.tsx` (one-line additions).

### Track D — AI Agent (`track/ai-agent`)

Convex Agent (`@convex-dev/agent`) with OpenAI, org-scoped tools (issues, docs, cycles, projects, members), chat UI at `/ai`, triage/embeddings, rate limiting. Gate with `hasAiAccess(ctx.org)` and UI access hooks.
**Owns:** `convex/agent/`, `components/ai/`, workspace AI view.
**Env:** `OPENAI_API_KEY` on the Convex deployment.

### Track E — Billing & Gating (`track/billing`)

Custom pricing page, org billing settings, upgrade prompts, members/invites UI. Plan definitions in `lib/plans.ts`; enforcement in `convex/lib/limits.ts`.
**Owns:** `app/(marketing)/pricing/`, `app/(app)/[orgSlug]/settings/`, `components/billing/`, `lib/plans.ts`.

### Track F — Landing Page (`track/landing`)

Marketing landing page with suite narrative (Plan / Knowledge / Service / AI).
**Owns:** `app/(marketing)/` (except `pricing/`), `components/marketing/`.

### Track G — Docs / Wiki (`track/docs-g`)

Confluence-lite: doc spaces, pages, revisions, comments, issue links.
**Owns:** `components/docs/`, `convex/docs.ts`, `convex/docComments.ts`, workspace docs views. Gate writes with `assertHasDocsWrite`.

### Track H — Unified Search + AI (`track/search-ai-h`)

Search tabs (All/Issues/Docs/Projects), AI agent doc tools (`searchDocs`, `getPage`, `createPage`, `linkIssueToPage`).
**Owns:** search UI extensions, `convex/search.ts` (projects search), agent tools under `convex/agent/`.

### Track I — Product Discovery (`track/discovery-i`)

Ideas backlog, kanban/matrix, promote-to-issue.
**Owns:** `components/discovery/`, `convex/ideas.ts`, workspace discovery view. Gate with `assertHasDiscovery` + `FeatureGate feature="discovery"`.

### Track J — Service Desk (`track/service-desk-j`)

Request types, agent queue, customer portal, convert-to-issue.
**Owns:** `components/service-desk/`, `convex/serviceDesk.ts`, `app/portal/[orgSlug]/`. Gate with `assertHasServiceDesk` + `FeatureGate feature="service_desk"`.

### Track K — Epics / Roadmaps (`track/roadmaps-k`)

Epics on projects, timeline roadmap view.
**Owns:** `components/roadmaps/`, `convex/epics.ts`, project epics/roadmap UI.

### Track L — Automations (`track/automations-l`)

Rule-based automations on issue events.
**Owns:** `components/automations/`, `convex/automations.ts`, `convex/lib/automationEngine.ts`, settings automations page. Gate with `assertHasAutomations` + `FeatureGate feature="automations"`.

### Track M — Suite Positioning (`track/suite-positioning-m`)

Plan matrix, feature comparison, marketing suite sections, `FeatureUpgradeCta`.
**Owns:** marketing suite copy, `lib/plans.ts` display matrix, billing gate components.

## Verifying your work

```bash
pnpm exec tsc --noEmit   # must pass
pnpm lint                # must pass
```

Do not start dev servers or push to the Convex deployment from a worktree. From **main checkout** after merge: `pnpm run deploy:convex` or `npx convex dev`.

## Reference

- Convex dev deployment: `sincere-oriole-287` (project `great-manut`, team `kunanon-jarat`). Main checkout runs `npx convex dev`.
- Production: https://app.manut.xyz (Worker `great-manut`, GoGoCash Cloudflare account).
- Design doc: `docs/specs/2026-06-12-linear-clone-design.md`.

## Learned User Preferences

## Learned Workspace Facts

- Production frontend deploys on push to `main` via GitHub Actions (`Deploy Cloudflare` workflow); live at https://app.manut.xyz (workspace) and https://manut.xyz (marketing) on Cloudflare Worker `great-manut`.
- Frontend deploys via OpenNext (`@opennextjs/cloudflare`) on Cloudflare Workers; Cloudflare Workers Builds should use `pnpm run build:cf` — `build` runs OpenNext which invokes `next build` internally (avoid recursion).
- `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL` must be in `wrangler.toml` `[vars]` and inlined at build time — missing runtime vars cause HTTP 500 on the Worker.
- Auth uses Convex Auth (`@convex-dev/auth`) with email/password; Clerk was removed — ignore stale Clerk references elsewhere in this file.
- Edge auth middleware lives in `middleware.ts` (not Next 16 `proxy.ts`) for OpenNext on Cloudflare; `/ingest` and `/portal/*` must stay public routes.
- ESLint must ignore `.open-next/**` (OpenNext build artifacts break lint otherwise).
- Convex dev deployment: `sincere-oriole-287` (project `great-manut`, team `kunanon-jarat`). Run `npx convex dev` from main checkout after schema changes; CI uses `CONVEX_DEPLOY_KEY` in GitHub secrets.
- Workspace sidebar uses client-side routing via `lib/workspace-routes.ts` and `components/workspace/workspace-route-view.tsx` at `app/(app)/[orgSlug]/[[...section]]/page.tsx` (Projects, Cycles, Teams, AI, Docs, Discovery, Service, Search).
- PR #15 merged the Atlassian-style suite (Tracks G–M): docs, unified search, discovery, service desk, epics/roadmaps, automations, suite billing gates, and marketing positioning. Delegation spec: `docs/specs/2026-06-27-atlassian-suite-delegation-spec.md`.
- Demo billing: org admins switch plans via `organizations.updatePlan` (no Stripe/Clerk Checkout). Suite gates in `convex/lib/limits.ts`: `hasDocsWrite`, `hasDiscovery`, `hasServiceDesk`, `hasAutomations` (plus matching `assert*` helpers).
- GitHub repo is `mygogocash/great-manut`; `main` branch protection requires CI checks (Lint, Typecheck, Build, Security audit) and one PR review.
- PostHog analytics via `posthog-js` + `instrumentation-client.ts`; events proxy through `/ingest` rewrites in `next.config.ts`. Set `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` at build time (`.env.local` + Cloudflare/GitHub Actions env). B2B org grouping uses PostHog `organization` group from `organizations.current`.
