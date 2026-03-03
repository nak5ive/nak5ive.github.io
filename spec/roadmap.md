# Implementation Roadmap

> Remaining work to take the project from scaffold to production.
> Phases are ordered by dependency — complete each phase before starting the next.
> Design decisions live in the other spec docs; this document tracks **what to build and in what order**.

---

## Phase 1 — Data Layer

Before any component can render real content, YAML loading must be wired up.

### 1.1 YAML loader utility

Create `src/lib/content.ts` — typed helper functions that read and parse each `content/*.yaml` file using `js-yaml` and `node:fs`. Returns strongly-typed objects consumed by pages and components.

One function per content file:
- `getExperience()` → `Company[]`
- `getProjects()` → `Project[]`
- `getSkills()` → `SkillCategory[]`
- `getEducation()` → `Education[]`
- `getMeta()` → `Meta`

### 1.2 TypeScript types

Create `src/types.ts` — interfaces mirroring the YAML schemas defined in `spec/architecture.md`:

- `Company` — `company`, `role`, `start`, `end`, `location`, `logo`, `entries: ShowcaseItem[]`
- `ShowcaseItem` — `name`, `description`, `screenshots: string[]`
- `Project` — `name`, `description`, `tech: string[]`, `links`, `screenshots`
- `SkillCategory` — `category`, `skills: string[]`
- `Education` — `institution`, `logo`, `degree`, `field`, `start`, `end`, `location`, `gpa`, `notes`
- `Meta` — `name`, `title`, `bio`, `location`, `contact`, `social`

---

## Phase 2 — Page Shell

### 2.1 Nav component

Create `src/components/Nav.astro`.

- Anchor links: `#contact`, `#experience`, `#projects`, `#skills`
- Fixed to top of viewport
- Monospace font, secondary text color, accent color on active/hover
- Mobile: hamburger or collapsed — TBD at implementation time
- Active state driven by the `ScrollSpy` island (Phase 4.2)

### 2.2 Page layout

Update `src/pages/index.astro` to:
- Import and call all `get*()` content loaders
- Compose all section components in order: `ContactHeader`, `ExperienceTimeline`, `ProjectList`, `SkillGrid`
- Add right-side padding at `lg`+ to leave room for `ScrollIndicator`
- Pass data down as props — no component fetches its own data

---

## Phase 3 — Static Section Components

All components in this phase are pure `.astro` — no client-side JS.

### 3.1 `ContactHeader.astro`

Renders the top section. See `spec/look-and-feel.md → Contact Header` for the layout spec.

- Name: large, monospace, `--color-text-primary`
- Title/tagline: small, `--color-text-secondary`
- Masked email and phone: rendered as `••••••••••` placeholder — the `ContactReveal` island (Phase 4.1) replaces these client-side
- Social links: icon + label, ghost style, `target="_blank"`

### 3.2 `ExperienceTimeline.astro`

Renders the `#experience` section. See `spec/look-and-feel.md → Showcase Items` for layout.

- Groups entries by company
- Company name + role as a muted section heading above its entries
- Showcase items alternate layout (odd: screenshot left / text right; even: text left / screenshot right)
- Items with no screenshots render full-width text
- On mobile (`< lg`): single column, alternation disabled, screenshot above text
- Delegates each item to `ShowcaseItem.astro`

### 3.3 `ShowcaseItem.astro`

Child of `ExperienceTimeline`. Renders a single showcase entry.

- `name`: monospace, `--color-accent`
- `description`: sans-serif, `--color-text-primary`, max ~60ch
- `screenshots`: `object-fit: cover`, subtle border/shadow — empty array renders no image column
- Accepts an `index` prop to determine which layout orientation to use

### 3.4 `ProjectList.astro`

Renders the `#projects` section.

- One card per project from `content/projects.yaml`
- Each card: name, description, tech tag list, links (GitHub / demo)
- Layout: grid at `lg`+, single column on mobile

### 3.5 `SkillGrid.astro`

Renders the `#skills` section.

- One group per category from `content/skills.yaml`
- Category label: monospace, `--color-text-secondary`
- Skills: tag-style, `--color-surface`, monospace

---

## Phase 4 — Interactive Islands

Islands are added only after static components are working. See `spec/architecture.md → Layer 4`.

### 4.1 `ContactReveal` island

**File:** `src/components/ContactReveal` (Svelte or vanilla JS — decide at implementation time)
**Directive:** `client:load`

Behaviour:
- Receives an obfuscated value (e.g. base64-encoded email/phone) as a prop — plain text must not appear in the static HTML
- Renders a `[Reveal]` button styled with `--color-accent`
- On click: decodes the value and replaces the `••••••••••` placeholder with the real text
- Optional post-reveal: button becomes a `[Copy]` affordance — TBD

### 4.2 `ScrollIndicator` island

**File:** `src/components/ScrollIndicator` (Svelte or vanilla JS)
**Directive:** `client:load`

Behaviour — see `spec/look-and-feel.md → Scroll Indicator` for full visual spec:
- Fixed right-side vertical bar
- One circular marker per company (logo image) + one each for Projects and Skills
- Active marker: full opacity, `--color-accent` ring
- Inactive markers: 40% opacity
- Draggable thumb (`<< ▓ >>`) tracks scroll position; dragging scrolls the page
- Clicking a marker smooth-scrolls to that section

Responsive: hidden below `lg` breakpoint.

### 4.3 Scroll-spy

Either bundled into `ScrollIndicator` or extracted as a shared utility. Uses `IntersectionObserver` to track the currently visible section and:
- Updates the active marker in `ScrollIndicator`
- Updates the active link in `Nav`

---

## Phase 5 — Static Assets

### 5.1 Logos

Add company/institution logo files to `public/logos/`. One per entry in `content/experience.yaml` and `content/education.yaml`.

| File | Used by |
|------|---------|
| `block.svg` | Block / Cash App |
| `mastercard.svg` | Mastercard |
| `coolfire.svg` | Coolfire Solutions |
| `snap-creative.svg` | Snap Creative |
| `mizzou.svg` | University of Missouri |

SVG preferred, PNG acceptable. These are required for the `ScrollIndicator` markers.

### 5.2 Screenshots

Add project screenshots to `public/screenshots/` and update `screenshots` arrays in `content/experience.yaml` and `content/projects.yaml`. All `screenshots: []` entries are currently empty placeholders.

### 5.3 Favicon

Add `public/favicon.svg`. Referenced in `src/layouts/Layout.astro`.

---

## Phase 6 — Typography & Polish

### 6.1 Web fonts

The spec font stacks (`JetBrains Mono`, `Inter`) fall back to system fonts — no fonts are loaded yet. Options:
- Self-host font files in `public/fonts/` and declare `@font-face` in `global.css`
- Load via Google Fonts `<link>` in `Layout.astro`

Decision deferred to implementation. System fonts are acceptable for an initial deploy.

### 6.2 Type scale

Define the type scale in `global.css` (font sizes for headings, body, labels, tags). Referenced in `spec/look-and-feel.md` as TBD — finalize at component build time.

### 6.3 Entrance animations

Fade-in on section entry (`opacity: 0 → 1`) using CSS and `IntersectionObserver` or the CSS `@starting-style` rule. See `spec/look-and-feel.md → Animation Philosophy`.

Do not block this on GSAP or scroll-driven animations — keep it CSS-first, simple.

### 6.4 Responsive QA

Test and fix layouts at all four breakpoints (`sm` / `md` / `lg` / `xl`) defined in `spec/look-and-feel.md`.

### 6.5 Accessibility audit

- Keyboard navigation through nav and contact reveal
- `alt` text on all images
- Sufficient color contrast (accent `#00ffcc` on `#0d0d0d` passes WCAG AA)
- `aria-label` on icon-only buttons

---

## Phase 7 — Deployment

### 7.1 Astro config

`site: 'https://nak5.com'` is already set in `astro.config.mjs`. No further config needed.

### 7.2 Add GitHub Actions workflow

Create `.github/workflows/deploy.yml`. See `spec/deployment.md → CI/CD` for the canonical workflow.

Enable GitHub Pages in repo settings: **Settings → Pages → Source → GitHub Actions**.

### 7.3 DNS and custom domain

`public/CNAME` containing `nak5.com` is already in place — GitHub Pages will read it automatically.

Remaining DNS steps (one-time, done in your DNS provider):
- Apex A records → GitHub's IPs (see `spec/deployment.md → Custom Domain`)
- `www` CNAME → `nak5ive.github.io`
- Enable **Enforce HTTPS** in GitHub Pages settings after DNS propagates

---

## Summary

| Phase | Deliverable | Status |
|-------|------------|--------|
| 1 | YAML loader + TypeScript types | pending |
| 2 | Nav + page shell | pending |
| 3.1 | `ContactHeader.astro` | pending |
| 3.2–3.3 | `ExperienceTimeline` + `ShowcaseItem` | pending |
| 3.4 | `ProjectList.astro` | pending |
| 3.5 | `SkillGrid.astro` | pending |
| 4.1 | `ContactReveal` island | pending |
| 4.2–4.3 | `ScrollIndicator` + scroll-spy | pending |
| 5 | Logos, screenshots, favicon | pending |
| 6 | Typography, animations, responsive QA, a11y | pending |
| 7.1 | Configure Astro for GitHub Pages | pending |
| 7.2 | GitHub Actions deploy workflow | pending |
| 7.3 | DNS + enforce HTTPS | pending |
