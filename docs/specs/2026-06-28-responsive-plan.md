# Responsive layout plan — mobile & tablet

Unified responsive strategy for Manut (Next.js 16 + Tailwind 4 + shadcn/ui).

## Breakpoint tiers

| Tier | Range | Tailwind | Primary use |
|------|-------|----------|-------------|
| **XS** | &lt;640px | default (no prefix) | Phone portrait — single column, Sheets, stacked toolbars |
| **SM** | 640–767px | `sm:` | Phone landscape / small tablet — slightly wider padding, some inline rows |
| **MD** | 768–1023px | `md:` | Tablet — icon sidebar rail (~56px), horizontal settings tabs |
| **LG** | 1024–1279px | `lg:` | Small laptop — **full sidebar (w-60)**, dual fixed rails allowed |
| **XL** | 1280px+ | `xl:` | Desktop — same as LG with more horizontal breathing room |

### Core rule

**Dual fixed rails** (primary sidebar + secondary panel, e.g. issue properties) are allowed **only at `lg+` (≥1024px)**. Below `lg`, the secondary panel moves to a Sheet/drawer; below `md`, the primary sidebar moves to a Sheet as well.

---

## Part A — Marketing / landing

### Global patterns

- Content max-width containers: `max-w-6xl mx-auto`
- Horizontal padding: `px-4 sm:px-6 lg:px-8` (marketing sections)
- Sticky header: `h-14`, backdrop blur

### Sections

| Area | XS–SM | MD | LG+ |
|------|-------|-----|-----|
| **Nav** | Hamburger → Sheet (Pricing, Log in, Sign up) | Inline nav links | Same |
| **Hero** | Stacked CTAs, pill wraps / short copy | Full pill text | Full layout + mock |
| **Feature sections** | Single column | 2-col where defined | Full grid |
| **Mock window** | URL truncates in chrome bar | Sidebar hidden in mock (`md:flex`) | Full mock |
| **Pricing cards** | Stack | 2–3 col grid | 3 col |
| **Feature comparison** | `overflow-x-auto`, sticky first column | Scroll table | Full table |
| **Footer** | Stacked columns | 2-col | 4-col; `break-all` on mono blocks |
| **FAQ / CTA** | Full-width buttons, min 44px touch | Same | Same |

### Public pages

- `/pricing`: `px-4 sm:px-6` on mobile
- `/sign-in`, `/sign-up`, `/portal/*`: responsive padding on form containers (future)

---

## Part B — Authenticated app

### Shell (`workspace-shell.tsx`)

| Tier | Sidebar | Header |
|------|---------|--------|
| **&lt;md** | Hidden; `AppSidebar` in left Sheet via hamburger | `MobileWorkspaceHeader` (org, new issue) |
| **md–lg−1** | Icon rail ~56px (`variant="icon-rail"`) | None extra |
| **lg+** | Full `w-60` sidebar (`variant="full"`) | None |

Touch targets on mobile/tablet chrome: **min 44px** (`min-h-11 min-w-11` or `size-11`).

### Workspace routes

Each workspace view inherits shell behavior. Toolbars use `flex-wrap` and stack controls on XS.

| Route / view | Mobile adaptation |
|--------------|-------------------|
| Team board / list | Toolbar wraps; filter bar scrolls |
| Projects / cycles | Card/list responsive grids (existing) |
| Docs (`space-layout`) | Page tree in Sheet &lt;lg; breadcrumb `overflow-x-auto` |
| Discovery | Header wraps; board/matrix scroll |
| Service queue | Card layout &lt;md OR `overflow-x-auto` table wrapper |
| Service detail | Properties Sheet &lt;lg |
| Search | Input + team filter stack/wrap |
| AI | Chat full-width (existing) |
| Settings | Horizontal scroll tabs &lt;lg; side nav lg+ |

### Dedicated routes

| Route | Adaptation |
|-------|------------|
| Issue detail | Properties aside `hidden lg:block`; Sheet trigger in header |
| Project detail | Responsive content padding |
| Settings (`/settings/*`) | Tabs below lg, side nav lg+ |

---

## Part C — Cross-cutting primitives

### `CONTENT_PX` (`lib/responsive.ts`)

```ts
export const CONTENT_PX = "px-4 sm:px-6 lg:px-8";
```

Use on app content areas (issue body, service detail, settings pages).

### `SecondaryPanel` (`components/shell/secondary-panel.tsx`)

Compound component for lg+ fixed aside + Sheet below lg:

- `SecondaryPanel` — root (Sheet state + desktop aside)
- `SecondaryPanel.Trigger` — mobile-only button (min 44px)
- `SecondaryPanel.Body` — shared inner content

### `MobileWorkspaceHeader` (`components/shell/mobile-workspace-header.tsx`)

Hamburger (opens sidebar Sheet), org switcher (truncated), new-issue button.

### `AppSidebar` variants

| Variant | Width | Labels | Use |
|---------|-------|--------|-----|
| `full` | `w-60` | Yes | lg+ desktop |
| `icon-rail` | `w-14` | Tooltips only | md–lg−1 |
| `sheet-content` | full width | Yes | Mobile Sheet body |

Prop: `onNavigate?: () => void` — closes Sheet after nav on mobile.

### Future: `PageToolbar`, `ResponsiveShell`

- `PageToolbar`: `flex flex-wrap items-center gap-2` with `justify-between` on sm+
- `ResponsiveShell`: optional wrapper for views needing consistent header + scroll body

---

## Part D — Implementation phases

| Phase | Scope | Status |
|-------|-------|--------|
| **0** | `CONTENT_PX`, AGENTS.md bullets | Foundation |
| **M** | Marketing nav Sheet, hero, footer, pricing, feature comparison | Marketing |
| **A** | Shell, sidebar variants, mobile header | **Critical path** |
| **B** | Issue detail, service, docs, settings, toolbars, queue | App surfaces |
| **Q** | Manual QA checklist (Part E), visual regression, device matrix | QA |

Dependencies: **0 → M → A → B → Q**. Phase A unblocks all authenticated work.

---

## Part E — QA checklist

### Marketing

- [ ] Hamburger opens Sheet on &lt;768px; links work
- [ ] Hero pill doesn’t overflow; CTAs tappable (44px)
- [ ] Pricing table scrolls horizontally on phone
- [ ] Footer mono blocks wrap (`break-all`)

### App shell

- [ ] &lt;768px: no fixed sidebar; Sheet nav closes on route change
- [ ] 768–1023px: icon rail visible; tooltips on hover/focus
- [ ] ≥1024px: full sidebar unchanged
- [ ] New issue + command palette reachable on all tiers

### Issue / service detail

- [ ] Properties visible in Sheet &lt;1024px
- [ ] Properties fixed aside ≥1024px
- [ ] Content padding follows `CONTENT_PX`

### Docs

- [ ] Page tree accessible via Sheet &lt;1024px
- [ ] Breadcrumb scrolls horizontally when long

### Settings

- [ ] Tabs scroll horizontally &lt;1024px
- [ ] Side nav visible ≥1024px

### Toolbars

- [ ] Team board, discovery, search toolbars wrap without horizontal page scroll
- [ ] Service queue usable on phone (cards or scroll)

### Cross-browser

- [ ] Safari iOS, Chrome Android, desktop Chrome/Firefox
- [ ] `dvh` shell height; no double scrollbars

---

## Part F — File ownership map

| Phase | Files / directories |
|-------|---------------------|
| **0** | `lib/responsive.ts`, `AGENTS.md` |
| **M** | `app/(marketing)/layout.tsx`, `components/marketing/*`, `components/billing/feature-comparison.tsx`, `app/(marketing)/pricing/page.tsx` |
| **A** | `components/shell/workspace-shell.tsx`, `components/shell/app-sidebar.tsx`, `components/shell/mobile-workspace-header.tsx` |
| **B** | `components/shell/secondary-panel.tsx`, `app/(app)/[orgSlug]/issue/[issueId]/page.tsx`, `components/service-desk/*`, `components/docs/space-layout.tsx`, `app/(app)/[orgSlug]/settings/*`, `components/billing/settings-nav.tsx`, `components/workspace/views/team-board.tsx`, `components/discovery/discovery-page.tsx`, `components/workspace/views/search-index.tsx` |
| **Q** | Manual — no file changes |

### Off-limits (unchanged)

`package.json`, `convex/schema.ts`, `components/ui/*`, `app/layout.tsx`, `middleware.ts`, etc. per `AGENTS.md`.

---

## Reference

- Mock sidebar pattern: `components/marketing/mock-app.tsx` (`hidden md:flex`)
- Design density: Linear-style, dark default, shadcn primitives
- Verification: `pnpm exec tsc --noEmit` && `pnpm lint`
