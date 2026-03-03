# nak5-portfolio

Personal resume and portfolio webapp for nak5. A dark, technical developer portfolio showcasing work history, projects, skills, and contact information.

---

## What This Site Showcases

- **Work history** — professional experience timeline
- **Projects** — selected personal and professional projects
- **Skills** — tools, languages, and technologies
- **Contact** — links and contact information

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | [Astro](https://astro.build) — static-first, zero JS by default |
| Styling | Raw CSS, mobile-first |
| Data | Static YAML/JSON in `content/` |
| Build output | Static HTML/CSS in `dist/` |
| Server | nginx (served from Docker container) |

---

## Deployment

Docker multi-stage build → nginx:alpine serving static files → Raspberry Pi (ARM-compatible images) → DigitalOcean (same image, no changes needed).

See [`spec/deployment.md`](spec/deployment.md) for full details.

---

## Spec Documents

The `spec/` directory is the source of truth for all design and architecture decisions. See [`CLAUDE.md`](CLAUDE.md) for the sync rules that keep spec and code aligned.

| Document | Description |
|----------|-------------|
| [`spec/look-and-feel.md`](spec/look-and-feel.md) | Visual design, color palette, typography, animation |
| [`spec/architecture.md`](spec/architecture.md) | Framework, data layer, site structure, build pipeline |
| [`spec/deployment.md`](spec/deployment.md) | Docker strategy, nginx config, deployment targets |

---

## Quick Start

> TBD — to be filled in once the build system is bootstrapped.

```bash
# Install dependencies
# TBD

# Run dev server
# TBD

# Build for production
# TBD

# Build Docker image
# TBD
```

---

## Repository Structure

```
nak5-portfolio/
├── CLAUDE.md              # Sync rules — spec is source of truth
├── README.md              # This file
├── spec/                  # Specification documents
│   ├── look-and-feel.md
│   ├── architecture.md
│   └── deployment.md
├── content/               # TBD — static data files (YAML/JSON)
├── src/                   # TBD — Astro source
└── dist/                  # TBD — build output (gitignored)
```

> **Note:** The `spec/` directory is the authoritative source of truth. All code changes must stay in sync with it. See [`CLAUDE.md`](CLAUDE.md).
