# Architecture Spec

> This document defines the technical architecture for nak5-portfolio.
> It is the authoritative reference for all structural and framework decisions.
> See [`../CLAUDE.md`](../CLAUDE.md) for sync rules.

---

## Framework

**[Astro](https://astro.build)**

Chosen for:
- Zero JavaScript by default — ships only what's needed, static HTML/CSS output
- Native support for Markdown, YAML, and JSON as data sources
- Island architecture — allows selective hydration of interactive components without polluting the static base
- Simple mental model — `.astro` components are just HTML templates with a JS frontmatter block
- Fast builds, excellent static site output

No server-side rendering (SSR) is needed at this time. Output mode: `static`.

---

## Data Layer

All portfolio content is stored as static files in the `content/` directory. These files are the **single source of truth** for all displayed data — content must never be hardcoded in components.

### Content Files

| File | Contents |
|------|---------|
| `content/experience.yaml` | Work history — roles, companies, dates, descriptions, logo path |
| `content/projects.yaml` | Projects — name, description, tech stack, links |
| `content/skills.yaml` | Skills and tools — grouped by category |
| `content/education.yaml` | Education — institutions, degrees, dates |
| `content/meta.yaml` | Personal info — name, bio, contact (obfuscated), social links |

#### Schema notes

`content/meta.yaml` contact fields (phone, email) should be stored as plain values — obfuscation is handled at render time by the `ContactReveal` island, not in the data file.

#### `content/experience.yaml` schema

Entries are **grouped by company**. Each company can have multiple showcase items (one per product or project worked on there). The scroll indicator shows one logo marker per company.

```yaml
- company: Acme Corp
  logo: /logos/acme.svg        # required — used by ScrollIndicator
  entries:
    - name: Project Phoenix
      description: >
        Led the migration of the legacy billing system to a microservices
        architecture, reducing deployment time by 60%.
      screenshots:             # optional — omit or leave empty if none
        - /screenshots/phoenix-1.png
        - /screenshots/phoenix-2.png
    - name: Internal Dashboard
      description: >
        Designed and built a real-time ops dashboard used daily by 40+
        engineers, replacing a manual Slack-based reporting workflow.
      screenshots: []
```

**Content framing rule:** `description` must describe what *you* did and the impact you had — not what the product does. Write in first person or active voice. "Led", "built", "designed", "reduced", "replaced" — not "a platform that enables...".

`logo` is required. Store logo files in `public/logos/` as SVG preferred, PNG acceptable.

### Data Access Pattern

Astro reads content files at build time using its built-in content collections or direct YAML/JSON imports. All data is resolved statically — there are no runtime API calls or database queries.

> **TBD:** Decide between Astro Content Collections (with schema validation) vs. simple `import` of YAML files. Content Collections are preferred if schema validation is valuable; direct imports are simpler. Decide when the content schema is defined.

---

## Site Structure

**Single-page layout.** All content lives on `/` — the page is divided into anchor-linked sections that the user scrolls through. There are no separate routes.

| Section | Anchor | Content source |
|---------|--------|----------------|
| Contact header | `#contact` | Name, masked phone/email, social links — `content/meta.yaml` |
| Work showcase | `#experience` | Reverse-chronological work history — `content/experience.yaml` |
| Projects | `#projects` | Project list/grid — `content/projects.yaml` |
| Skills | `#skills` | Skill categories — `content/skills.yaml` |

### Navigation

- Top nav links are anchor links (`#experience`, `#projects`, `#skills`) — no full-page navigations
- Mobile: collapsible nav or hamburger (TBD)
- Active state reflects the currently visible section (scroll-spy — requires a small JS island or IntersectionObserver)

---

## Component Architecture

### Layer 1 — Layouts

Astro layout components (`src/layouts/`) wrap page content with shared structure (nav, footer, `<head>` metadata).

### Layer 2 — Page Components

Astro page files (`src/pages/`) map directly to routes. Pages are thin — they import data and compose section components.

### Layer 3 — Section Components

Reusable `.astro` components (`src/components/`) for each logical section (e.g. `ExperienceTimeline.astro`, `ProjectCard.astro`, `SkillGrid.astro`). Each component receives its data as props — no component fetches its own data directly.

### Layer 3 — Section Components (detail)

Key components and their responsibilities:

| Component | Type | Description |
|-----------|------|-------------|
| `ContactHeader.astro` | Static + island | Name, social links (static); masked phone/email with reveal button (island) |
| `ExperienceTimeline.astro` | Static | Reverse-chron work entries from `content/experience.yaml` |
| `ProjectList.astro` | Static | Project cards from `content/projects.yaml` |
| `SkillGrid.astro` | Static | Skill categories from `content/skills.yaml` |
| `ScrollIndicator` | Island | Fixed right-side progress indicator with section markers and draggable thumb |

### Layer 4 — Interactive Islands

Islands are used only where genuine interactivity is required. Identified islands:

1. **`ContactReveal`** (`client:load`) — Handles masked phone/email reveal. The masked value is rendered as obfuscated text; a button triggers a client-side reveal. This prevents plain-text email/phone from appearing in the static HTML and being harvested by scrapers.

2. **`ScrollIndicator`** (`client:load`) — Fixed right-side vertical bar. Tracks scroll position, highlights the active section marker (company logo or section icon), and renders a draggable caret thumb (`<< >>`). Dragging the thumb scrolls the page proportionally.

Svelte or vanilla JS are the preferred choices for islands — no React or Vue unless there's a compelling reason.

> **Default rule:** Static first. Only add an island when interactivity is genuinely required.

---

## Styling Architecture

- Raw CSS in `src/styles/`
- Global custom properties (design tokens) defined in `src/styles/global.css` — imported in the root layout
- Component-scoped styles using Astro's `<style>` blocks (scoped by default)
- No CSS preprocessor required initially; Sass may be added if needed
- No utility-first framework (no Tailwind)

See [`look-and-feel.md`](look-and-feel.md) for the design token values.

---

## Build Output

```
dist/
├── index.html        ← entire site — single page
└── _astro/           ← hashed CSS and JS assets (islands + styles)
```

- Single `index.html` — the whole site is one document
- Minimal JS: only the two islands (`ContactReveal`, `ScrollIndicator`)
- No Node.js runtime required to serve — just a static file server
- Served by GitHub Pages in production

---

## Directory Structure

```
nak5-portfolio/
├── CLAUDE.md
├── README.md
├── astro.config.mjs       # TBD — Astro configuration
├── package.json           # TBD
├── spec/                  # Specification documents
├── content/               # Static data files (source of truth for content)
│   ├── experience.yaml
│   ├── projects.yaml
│   ├── skills.yaml
│   ├── education.yaml
│   └── meta.yaml
├── src/
│   ├── layouts/           # Astro layout components
│   ├── pages/             # Route-mapped page files
│   ├── components/        # Reusable section components
│   └── styles/            # Global CSS and design tokens
├── public/                # Static assets (images, fonts, favicon)
└── dist/                  # Build output (gitignored)
```

---

## Dependencies (TBD)

| Package | Role | Notes |
|---------|------|-------|
| `astro` | Framework | Core |
| `js-yaml` or similar | YAML parsing | If not handled by Astro natively |

> **TBD:** Full `package.json` to be defined when the project is initialized with `npm create astro`.

---

## Constraints & Decisions

- **No SSR** — output mode is `static`. If dynamic behavior is ever needed, revisit.
- **No database** — all content is in `content/` YAML files, resolved at build time.
- **No CMS** — content is edited directly in YAML files and committed to the repo.
- **No React** — Astro components + optional Svelte islands. Keep the JS footprint minimal.
