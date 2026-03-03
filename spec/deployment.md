# Deployment Spec

> This document defines the deployment strategy for nak5-portfolio.
> It is the authoritative reference for all hosting and CI/CD decisions.
> See [`../CLAUDE.md`](../CLAUDE.md) for sync rules.

---

## Overview

The site is a fully static Astro build (HTML/CSS/minimal JS) deployed to **GitHub Pages** via **GitHub Actions**. On every push to `main`, the workflow builds the site and publishes the `dist/` output. No server, container, or external hosting account required.

---

## Hosting

| Concern | Decision |
|---------|---------|
| Provider | GitHub Pages (free, built into the repo) |
| Domain | `nak5.com` (custom domain) |
| HTTPS | Automatic via GitHub Pages |
| CDN | GitHub's global CDN — no configuration needed |

---

## Astro Configuration

In `astro.config.mjs`:

```js
export default defineConfig({
  output: 'static',
  site: 'https://nak5.com',
});
```

No `base` is needed — custom domains serve from the root path. The `site` value is used by Astro for sitemaps and canonical URLs.

---

## Custom Domain

Custom domain: `nak5.com`

Setup checklist:
1. `public/CNAME` file containing `nak5.com` — already added; GitHub Pages reads this file to configure the domain
2. DNS: CNAME record for `www` pointing to `nak5ive.github.io`, and an A record for the apex (`@`) pointing to GitHub's IPs:
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```
3. In GitHub repo settings → Pages: confirm the custom domain is recognized and enable **Enforce HTTPS** (available once DNS propagates)

---

## CI/CD — GitHub Actions

### Workflow

File: `.github/workflows/deploy.yml`

Trigger: push to `main`

Steps:
1. Checkout repo
2. Install Node.js (LTS)
3. Install dependencies (`npm ci`)
4. Run `astro build`
5. Upload `dist/` as a Pages artifact
6. Deploy artifact to GitHub Pages

### Canonical workflow

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Enabling GitHub Pages

In the GitHub repository settings:
- **Pages → Source**: set to `GitHub Actions` (not a branch)
- No branch or folder selection needed — the workflow handles publishing

---

## Environment Variables

None required at this time. All content is static and resolved at build time.

If build-time variables are ever needed (e.g. analytics ID):
- Define in `.env` (gitignored)
- Access via `import.meta.env` in Astro
- Add as GitHub Actions secrets and pass with `env:` in the workflow step

---

## Summary

| Concern | Decision |
|---------|---------|
| Hosting | GitHub Pages |
| Build trigger | Push to `main` via GitHub Actions |
| Build command | `npm run build` → `dist/` |
| Deploy method | `actions/upload-pages-artifact` + `actions/deploy-pages` |
| HTTPS | Automatic |
| Custom domain | TBD |
| Custom domain | `nak5.com` |
| `site` config | `https://nak5.com` |
| `base` config | None (custom domain serves from root) |
