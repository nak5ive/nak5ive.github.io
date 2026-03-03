# nak5-portfolio

Personal portfolio site for Nevada (Al) Kent — a dark, technical developer portfolio showcasing work history, projects, skills, and contact information. Live at [nak5.com](https://nak5.com).

---

## What This Site Showcases

- **Work history** — professional experience timeline sourced from resume
- **Projects** — selected personal and professional projects
- **Skills** — tools, languages, and technologies
- **Contact** — links and contact information

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | [Astro](https://astro.build) — static-first, zero JS by default |
| Styling | Raw CSS, no utility frameworks |
| Data | Static YAML in `content/` |
| Build output | Static HTML/CSS in `dist/` |
| Hosting | GitHub Pages (custom domain: `nak5.com`) |
| CI/CD | GitHub Actions — push to `master` triggers build + deploy |

---

## Quick Start

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## Deployment

Every push to `master` triggers a GitHub Actions workflow that builds the site and deploys `dist/` to GitHub Pages. No manual steps required.

See [`spec/deployment.md`](spec/deployment.md) for full CI/CD details and custom domain setup.

---

## Spec Documents

The `spec/` directory is the source of truth for all design and architecture decisions. See [`CLAUDE.md`](CLAUDE.md) for the sync rules that keep spec, code, and README aligned.

| Document | Description |
|----------|-------------|
| [`spec/look-and-feel.md`](spec/look-and-feel.md) | Visual design, color palette, typography, animation |
| [`spec/architecture.md`](spec/architecture.md) | Framework, data layer, site structure, build pipeline |
| [`spec/deployment.md`](spec/deployment.md) | GitHub Pages, GitHub Actions CI/CD, custom domain |
| [`spec/roadmap.md`](spec/roadmap.md) | Remaining implementation steps, ordered by phase |

---

## Repository Structure

```
nak5-portfolio/
├── CLAUDE.md                  # Sync rules — spec is source of truth
├── README.md                  # This file
├── astro.config.mjs           # Astro configuration
├── package.json
├── spec/                      # Specification documents
│   ├── look-and-feel.md
│   ├── architecture.md
│   ├── deployment.md
│   └── roadmap.md
├── content/                   # Static data files — single source of truth for content
│   ├── meta.yaml              # Personal info, contact, social links
│   ├── experience.yaml        # Work history (sourced from resume)
│   ├── experience-extended.yaml  # Extended prose descriptions (reference)
│   ├── projects.yaml          # Projects
│   ├── skills.yaml            # Skills by category
│   └── education.yaml         # Education
├── src/
│   ├── layouts/               # Astro layout components
│   ├── pages/                 # Route-mapped page files
│   ├── components/            # Reusable section components
│   ├── lib/                   # Content loaders, utilities
│   ├── styles/                # Global CSS and design tokens
│   └── types.ts               # TypeScript interfaces for all content schemas
├── public/                    # Static assets (images, logos, icons, fonts)
└── dist/                      # Build output (gitignored)
```
