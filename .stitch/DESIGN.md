---
version: alpha
name: Manut
description: Linear-style B2B workspace — dark default, dense productivity UI, shadcn radix-nova + Geist. Supports desktop + mobile (375–767px).

# Default theme is DARK (.dark). Light tokens suffixed -light.
colors:
  background: "oklch(0.145 0 0)"
  foreground: "oklch(0.985 0 0)"
  card: "oklch(0.205 0 0)"
  card-foreground: "oklch(0.985 0 0)"
  popover: "oklch(0.205 0 0)"
  popover-foreground: "oklch(0.985 0 0)"
  primary: "oklch(0.922 0 0)"
  primary-foreground: "oklch(0.205 0 0)"
  secondary: "oklch(0.269 0 0)"
  secondary-foreground: "oklch(0.985 0 0)"
  muted: "oklch(0.269 0 0)"
  muted-foreground: "oklch(0.708 0 0)"
  accent: "oklch(0.269 0 0)"
  accent-foreground: "oklch(0.985 0 0)"
  destructive: "oklch(0.704 0.191 22.216)"
  success: "oklch(0.765 0.177 163.223)"
  success-foreground: "oklch(0.205 0 0)"
  warning: "oklch(0.828 0.189 84.429)"
  warning-foreground: "oklch(0.205 0 0)"
  info: "oklch(0.707 0.165 254.624)"
  info-foreground: "oklch(0.205 0 0)"
  border: "oklch(1 0 0 / 10%)"
  input: "oklch(1 0 0 / 15%)"
  ring: "oklch(0.556 0 0)"
  chart-1: "oklch(0.87 0 0)"
  chart-2: "oklch(0.556 0 0)"
  chart-3: "oklch(0.439 0 0)"
  chart-4: "oklch(0.371 0 0)"
  chart-5: "oklch(0.269 0 0)"
  sidebar: "oklch(0.205 0 0)"
  sidebar-foreground: "oklch(0.985 0 0)"
  sidebar-primary: "oklch(0.488 0.243 264.376)"
  sidebar-primary-foreground: "oklch(0.985 0 0)"
  sidebar-accent: "oklch(0.269 0 0)"
  sidebar-accent-foreground: "oklch(0.985 0 0)"
  sidebar-border: "oklch(1 0 0 / 10%)"
  sidebar-ring: "oklch(0.556 0 0)"
  background-light: "oklch(1 0 0)"
  foreground-light: "oklch(0.145 0 0)"
  card-light: "oklch(1 0 0)"
  card-foreground-light: "oklch(0.145 0 0)"
  popover-light: "oklch(1 0 0)"
  popover-foreground-light: "oklch(0.145 0 0)"
  primary-light: "oklch(0.205 0 0)"
  primary-foreground-light: "oklch(0.985 0 0)"
  secondary-light: "oklch(0.97 0 0)"
  secondary-foreground-light: "oklch(0.205 0 0)"
  muted-light: "oklch(0.97 0 0)"
  muted-foreground-light: "oklch(0.556 0 0)"
  accent-light: "oklch(0.97 0 0)"
  accent-foreground-light: "oklch(0.205 0 0)"
  destructive-light: "oklch(0.577 0.245 27.325)"
  success-light: "oklch(0.508 0.118 165.612)"
  success-foreground-light: "oklch(0.985 0 0)"
  warning-light: "oklch(0.555 0.163 48.998)"
  warning-foreground-light: "oklch(0.985 0 0)"
  info-light: "oklch(0.488 0.217 264.376)"
  info-foreground-light: "oklch(0.985 0 0)"
  border-light: "oklch(0.922 0 0)"
  input-light: "oklch(0.922 0 0)"
  ring-light: "oklch(0.708 0 0)"
  sidebar-light: "oklch(0.985 0 0)"
  sidebar-foreground-light: "oklch(0.145 0 0)"
  sidebar-primary-light: "oklch(0.205 0 0)"
  sidebar-primary-foreground-light: "oklch(0.985 0 0)"
  sidebar-accent-light: "oklch(0.97 0 0)"
  sidebar-accent-foreground-light: "oklch(0.205 0 0)"
  sidebar-border-light: "oklch(0.922 0 0)"
  sidebar-ring-light: "oklch(0.708 0 0)"

typography:
  h1:
    fontFamily: Geist Sans
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.25
  h2:
    fontFamily: Geist Sans
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.3
  h3:
    fontFamily: Geist Sans
    fontSize: 0.875rem
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: Geist Sans
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Geist Sans
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: Geist Sans
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.33
  caption:
    fontFamily: Geist Sans
    fontSize: 0.6875rem
    fontWeight: 400
    lineHeight: 1.33
  mono:
    fontFamily: Geist Mono
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.4
  body-mobile:
    fontFamily: Geist Sans
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  h1-mobile:
    fontFamily: Geist Sans
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.25

rounded:
  sm: 0.375rem
  md: 0.5rem
  lg: 0.625rem
  xl: 0.875rem
  2xl: 1.125rem

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  content-px-mobile: 16px
  content-px-tablet: 24px
  content-px-desktop: 32px
  touch-target: 44px
  mobile-header-height: 56px
  sheet-width: 100%
  icon-rail-width: 56px
  sidebar-full-width: 240px
  safe-area-bottom: 34px

components:
  button-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    height: 36px
    padding: 12px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    height: 36px
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    height: 36px
  input-default:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    height: 36px
  row-compact:
    height: 28px
    typography: "{typography.body-sm}"
  row-default:
    height: 36px
    typography: "{typography.body-sm}"
  sidebar-nav-item:
    height: 32px
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
  sidebar-nav-item-active:
    backgroundColor: "{colors.sidebar-accent}"
    textColor: "{colors.sidebar-accent-foreground}"
  badge-default:
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: 4px
  issue-key:
    typography: "{typography.mono}"
    textColor: "{colors.muted-foreground}"
  card-surface:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.lg}"
    padding: 16px
  button-mobile-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body-mobile}"
    rounded: "{rounded.md}"
    height: "{spacing.touch-target}"
    width: 100%
    padding: 12px
  button-mobile-ghost:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
    typography: "{typography.body-mobile}"
    rounded: "{rounded.md}"
    height: "{spacing.touch-target}"
    width: "{spacing.touch-target}"
  icon-button-mobile:
    backgroundColor: transparent
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "{spacing.touch-target}"
    width: "{spacing.touch-target}"
  mobile-header:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    height: "{spacing.mobile-header-height}"
    padding: "{spacing.content-px-mobile}"
  mobile-nav-sheet:
    backgroundColor: "{colors.sidebar}"
    textColor: "{colors.sidebar-foreground}"
    width: "{spacing.sheet-width}"
  mobile-nav-item:
    backgroundColor: transparent
    textColor: "{colors.sidebar-foreground}"
    typography: "{typography.body-mobile}"
    rounded: "{rounded.md}"
    height: "{spacing.touch-target}"
    padding: 12px
  mobile-nav-item-active:
    backgroundColor: "{colors.sidebar-accent}"
    textColor: "{colors.sidebar-accent-foreground}"
  mobile-list-row:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-sm}"
    height: 48px
    padding: 12px
  mobile-sheet-panel:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.popover-foreground}"
    rounded: "{rounded.xl}"
    width: "{spacing.sheet-width}"
  mobile-toolbar:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    height: "{spacing.touch-target}"
    padding: "{spacing.sm}"
  mobile-input:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-mobile}"
    rounded: "{rounded.md}"
    height: "{spacing.touch-target}"
    width: 100%
  mobile-fab:
    backgroundColor: "{colors.sidebar-primary}"
    textColor: "{colors.sidebar-primary-foreground}"
    rounded: "{rounded.lg}"
    height: "{spacing.touch-target}"
    width: "{spacing.touch-target}"
---

## Overview

Manut (Vector) is a B2B multi-tenant teamwork platform: Linear-style issues, docs, discovery, service desk, roadmaps, and AI. Visual language is **dark-first**, **neutral**, **dense** — optimized for long sessions, not marketing flair.

**Stack:** Next.js 16, Tailwind 4, shadcn/ui (**radix-nova**), Lucide icons, Geist Sans + Geist Mono.

**Default theme:** dark (`.dark` on `<html>`). Light mode uses `-light` suffixed tokens from YAML.

**Product mood:** Quiet chrome, high information density, subtle borders, blue accent only in sidebar active states.

**Devices:** Design for **Desktop (1024px+)** and **Mobile (375–767px)**. Same tokens; layout and touch targets change. In Stitch: upload this file once, then create design systems for both **DESKTOP** and **MOBILE** device types.

---

## Colors

Semantic tokens map 1:1 to `app/globals.css` CSS variables.

### Dark (default)

| Token | Role |
|-------|------|
| `{colors.background}` | App canvas — near-black |
| `{colors.foreground}` | Primary text |
| `{colors.card}` | Elevated panels, issue cards |
| `{colors.muted}` / `{colors.muted-foreground}` | Secondary surfaces, metadata, timestamps |
| `{colors.primary}` | Inverted emphasis (buttons, selection tint) |
| `{colors.border}` | 10% white hairlines — subtle separation |
| `{colors.destructive}` | Errors, delete actions |
| `{colors.success}` / `{colors.warning}` / `{colors.info}` | Status pills, toasts, issue states |
| `{colors.sidebar}` | Primary nav rail background |
| `{colors.sidebar-primary}` | Active nav accent — blue `oklch(0.488 0.243 264.376)` |
| `{colors.chart-1}` … `{colors.chart-5}` | Monochrome chart scale |

### Light

Use `{colors.*-light}` equivalents. Status colors are **darker** on light surfaces for contrast (emerald/amber/blue ~700 weight).

### Selection

Text selection: `color-mix(in oklch, primary 22%, transparent)` — theme-adaptive tint.

---

## Typography

| Token | Use |
|-------|-----|
| `{typography.h1}` | Page titles (rare — prefer compact headers) |
| `{typography.h2}` | Section headers, panel titles |
| `{typography.h3}` | Subsection, property group labels |
| `{typography.body}` | Default UI copy (14px) |
| `{typography.body-sm}` | **Primary UI size** — lists, buttons, inputs (13px) |
| `{typography.label}` | Badges, column headers, uppercase-adjacent labels |
| `{typography.caption}` | Fine print, keyboard hints |
| `{typography.mono}` | Issue keys (`ENG-42`), IDs, code snippets |

**Voice:** Neutral, scannable. Prefer `{typography.body-sm}` over large body text in workspace views.

---

## Layout & Spacing

### Breakpoints

| Tier | Range | Tailwind | Behavior |
|------|-------|----------|----------|
| XS | <640px | default | Single column, Sheets, stacked toolbars |
| SM | 640–767px | `sm:` | Wider padding, some inline rows |
| MD | 768–1023px | `md:` | Icon sidebar rail (~56px) |
| LG | 1024–1279px | `lg:` | Full sidebar (240px), dual fixed rails OK |
| XL | 1280px+ | `xl:` | More horizontal breathing room |

### Content padding

`px-4 sm:px-6 lg:px-8` → `{spacing.content-px-mobile}` / `{spacing.content-px-tablet}` / `{spacing.content-px-desktop}`

### Shell rules

- **Dual fixed rails** (sidebar + secondary panel) only at **LG+**
- Below LG: secondary panel → Sheet/drawer
- Below MD: primary sidebar → Sheet (hamburger)
- Mobile chrome touch targets: **min 44px** (`min-h-11 min-w-11`)

### Marketing vs app

- Marketing: `max-w-6xl`, sticky header `h-14`, more vertical rhythm
- App: tighter vertical rhythm, `{spacing.sm}`–`{spacing.md}` gaps in toolbars

---

## Mobile (<768px)

**Viewport:** 375×812 (iPhone) primary; also test 390×844, 360×800.

**Frame:** Single column, full-bleed content. No fixed sidebars. Use Sheets for nav and secondary panels.

### Mobile shell

| Element | Spec |
|---------|------|
| `{components.mobile-header}` | Sticky top bar — hamburger, org name (truncate), new-issue |
| `{components.mobile-nav-sheet}` | Full-width left Sheet — `{components.mobile-nav-item}` list |
| `{components.mobile-nav-item-active}` | Active route — same tokens as desktop sidebar accent |
| `{components.icon-button-mobile}` | Hamburger, close, overflow — **44×44px** min |
| `{components.mobile-toolbar}` | View title + actions; wraps on XS (`flex-wrap`) |
| `{components.mobile-sheet-panel}` | Issue properties, filters, doc tree — slides from right/bottom |

### Mobile touch & spacing

- **Minimum tap target:** `{spacing.touch-target}` = **44px** (Apple HIG / Material)
- Primary CTAs: `{components.button-mobile-primary}` — full-width on marketing/auth
- Icon-only actions: `{components.icon-button-mobile}` or `{components.button-mobile-ghost}`
- Content padding: `{spacing.content-px-mobile}` (16px) — matches `CONTENT_PX`
- List rows: `{components.mobile-list-row}` — **48px** (slightly taller than desktop compact rows)
- Bottom safe area: account for `{spacing.safe-area-bottom}` on iOS home indicator

### Mobile typography

- Page titles: `{typography.h1-mobile}` (20px) — not desktop `{typography.h1}` (24px)
- Body / nav / buttons: `{typography.body-mobile}` (14px)
- Metadata: `{typography.caption}` — still readable at 11px
- Issue keys: `{typography.mono}` unchanged

### Mobile by surface

| Surface | Mobile behavior |
|---------|-----------------|
| **Marketing** | Hamburger → Sheet nav; stacked hero CTAs; horizontal scroll pricing table |
| **Board / list** | Single column or horizontal scroll columns; toolbar wraps |
| **Issue detail** | Main column full width; properties in `{components.mobile-sheet-panel}` |
| **Docs** | Page tree in Sheet; breadcrumb `overflow-x-auto` |
| **Search** | Stacked input + filters |
| **AI chat** | Full-width thread; composer fixed bottom with safe-area padding |
| **Settings** | Horizontal scroll tabs (no side nav) |
| **Service queue** | Card list (not table) |

### Mobile patterns

- **Sheet nav:** Opens from hamburger; closes on route change
- **Secondary panel:** `{components.mobile-sheet-panel}` triggered by header button — never fixed aside
- **No dual rails:** Never show sidebar + properties panel simultaneously on mobile
- **Scroll:** Page scrolls; toolbars sticky; avoid nested scroll traps
- **Keyboard:** Inputs use `{components.mobile-input}`; composer rises above keyboard

### Stitch mobile generation

When generating mobile screens in Stitch:

1. Upload this `DESIGN.md`
2. Create design system → device type **MOBILE**
3. Prompt example: *"Manut issue list mobile, dark theme, hamburger nav, 375px wide, 44px touch targets"*
4. Re-use same color tokens; apply mobile component specs above

---

## Elevation & Depth

Low elevation system — flat dark surfaces, border separation over shadows.

| Level | Treatment |
|-------|-----------|
| Base | `{colors.background}` |
| Raised | `{colors.card}` + `{colors.border}` 1px |
| Overlay | `{colors.popover}` — dropdowns, command palette, Sheets |
| Focus | `{colors.ring}` outline at 50% opacity |

Avoid heavy drop shadows in workspace UI. Popovers may use subtle shadow from shadcn defaults only.

---

## Shapes

Base radius: `{rounded.lg}` = **0.625rem** (10px).

| Token | Value | Use |
|-------|-------|-----|
| `{rounded.sm}` | 0.375rem | Badges, chips |
| `{rounded.md}` | 0.5rem | Buttons, inputs |
| `{rounded.lg}` | 0.625rem | Cards, default |
| `{rounded.xl}` | 0.875rem | Modals, large panels |

Corners are moderately rounded — not pill-shaped, not sharp.

---

## Components

Built on **shadcn/ui radix-nova**. Icons: **Lucide**, 16px default in dense rows.

| Component | Spec |
|-----------|------|
| `{components.button-default}` | Primary action — `{colors.primary}` fill |
| `{components.button-ghost}` | Toolbar, icon-adjacent actions |
| `{components.button-destructive}` | Irreversible deletes |
| `{components.input-default}` | Form fields, search, filters |
| `{components.row-compact}` | Issue list rows, board cards — **28px** |
| `{components.row-default}` | Standard interactive rows — **36px** |
| `{components.sidebar-nav-item}` | Nav links — 32px height |
| `{components.sidebar-nav-item-active}` | Active route highlight |
| `{components.badge-default}` | Status, priority, label chips |
| `{components.issue-key}` | Monospace muted key prefix |
| `{components.card-surface}` | Grouped content blocks |

### Mobile components

| Component | Spec |
|-----------|------|
| `{components.button-mobile-primary}` | Full-width primary CTA — 44px height |
| `{components.button-mobile-ghost}` | Secondary mobile action |
| `{components.icon-button-mobile}` | Icon-only — 44×44px |
| `{components.mobile-header}` | App top bar — 56px |
| `{components.mobile-nav-sheet}` | Navigation drawer |
| `{components.mobile-nav-item}` | Nav row — 44px |
| `{components.mobile-list-row}` | Issue/list item — 48px |
| `{components.mobile-sheet-panel}` | Properties / filters drawer |
| `{components.mobile-toolbar}` | View header + actions |
| `{components.mobile-input}` | Search, forms — 44px, full width |
| `{components.mobile-fab}` | Floating action (new issue) — optional |

### Patterns

- **Command palette:** `{colors.popover}`, keyboard-first (`Cmd+K`)
- **Issue detail:** Main column + properties sidebar (LG+); sidebar → Sheet below LG
- **Board:** Kanban columns, minimal column chrome, compact cards
- **AI chat:** Full-width conversational panel, markdown lists, dense message rows

---

## Do's

- Default mocks to **dark theme**
- Use semantic tokens (`{colors.muted-foreground}` for metadata, not arbitrary gray)
- Keep toolbars single-line where possible; wrap on XS
- Use `{typography.mono}` for issue identifiers
- Respect 44px touch targets on mobile chrome
- Sidebar active state: `{colors.sidebar-primary}` blue accent
- Mobile: use Sheets, not fixed sidebars
- Mobile: full-width primary buttons on auth/marketing
- Mobile: test at 375px width in Stitch (**MOBILE** device type)

## Don'ts

- No gradients, glassmorphism, or playful illustration in workspace UI
- No large hero typography inside authenticated app shell
- Don't use pure `#000` / `#fff` — use oklch tokens
- Don't show dual fixed sidebars below LG breakpoint
- Don't use `{colors.destructive}` for non-destructive emphasis
- Avoid light-mode-only contrast assumptions — test both themes
- Mobile: no dual fixed panels, no hover-only affordances, no tiny tap targets (<44px)
- Mobile: no horizontal page scroll (tables may scroll inside container)

---

## Source of truth

| File | Contents |
|------|----------|
| `app/globals.css` | Token values (`:root` light, `.dark` default) |
| `components.json` | shadcn radix-nova, Lucide |
| `app/layout.tsx` | Geist font loading |
| `lib/responsive.ts` | `CONTENT_PX` padding constant |
| `docs/specs/2026-06-28-responsive-plan.md` | Breakpoint & shell rules |

When updating tokens in Stitch, mirror changes back to `app/globals.css`.
