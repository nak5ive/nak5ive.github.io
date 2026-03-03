# CLAUDE.md — Project Conventions & Source of Truth

## The Spec Is Law

The `spec/` directory is the **authoritative source of truth** for this project.
All decisions about design, architecture, and deployment are recorded there first.
Code exists to implement the spec — not the other way around.

---

## Sync Rules

These rules apply to every change made to this repository:

**Rule 1 — Spec → Code:** When any spec document changes, the codebase must be updated to reflect it before the change is considered complete. Do not leave spec and code out of sync.

**Rule 2 — Code → Spec:** When any code or configuration changes (framework, build config, component structure, deployment setup, etc.), the relevant spec document(s) must be updated in the same commit/changeset.

**Rule 3 — Content files are canonical:** Data files in `content/` are the single source of truth for all portfolio content (experience, projects, skills, education, personal info). Never hardcode content in components or templates.

---

## Instructions for Claude

When making any code change:

1. **Check for spec drift** — read the relevant spec file(s) before modifying code. Confirm the change aligns with the spec.
2. **Update the spec** if the code change introduces anything not covered or that contradicts current spec.
3. **Check `content/`** — if the change involves displaying data, verify it reads from the appropriate content file rather than hardcoded values.
4. If you are unsure whether a change requires a spec update, err on the side of updating the spec.

When reviewing existing code:

- Flag any content hardcoded in components that should be in `content/`
- Flag any architectural patterns that contradict `spec/architecture.md`
- Flag any visual decisions that contradict `spec/look-and-feel.md`

---

## Spec Documents

| File | Purpose |
|------|---------|
| `spec/look-and-feel.md` | Visual design, color, typography, animation |
| `spec/architecture.md` | Framework, data layer, site structure, build |
| `spec/deployment.md` | GitHub Pages, GitHub Actions CI/CD |
| `spec/roadmap.md` | Remaining implementation steps, ordered by phase |

---

## Quick Reference

- Framework: **Astro**
- Styling: Raw CSS (no heavy UI frameworks)
- Data: Static YAML/JSON in `content/`
- Build output: Static HTML/CSS in `dist/`
- Serving: **GitHub Pages**
- Deployment: GitHub Actions → GitHub Pages (push to `main` triggers build + deploy)
