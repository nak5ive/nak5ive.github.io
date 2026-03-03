# Look & Feel Spec

> This document defines the visual design direction for nak5-portfolio.
> It is the authoritative reference for all styling decisions.
> See [`../CLAUDE.md`](../CLAUDE.md) for sync rules.

---

## Design Direction

**Dark & Technical.** This is a developer portfolio — the aesthetic should reflect that. Dark backgrounds, high-contrast text, monospace accents. Clinical, precise, with room for animation and "flare" in later iterations. The design should feel like a well-configured terminal, not a generic agency template.

---

## Color Palette

| Role | Value | Notes |
|------|-------|-------|
| Background | `#0d0d0d` | Near-black base |
| Surface | `#1a1a1a` | Slightly lighter — cards, panels |
| Surface raised | `#242424` | Hover states, elevated elements |
| Primary accent | `#00ffcc` | Cyan — finalized |
| Text primary | `#e8e8e8` | Off-white — main readable text |
| Text secondary | `#888888` | Muted — metadata, labels, subtitles |
| Text disabled | `#444444` | Inactive elements |
| Border | `#2a2a2a` | Subtle dividers |

> Accent color is **locked in** as `#00ffcc` (cyan). Used for: active scroll indicator markers, [Reveal] buttons, hover states, and any other interactive/highlighted elements.

---

## Typography

### Fonts

| Role | Stack | Notes |
|------|-------|-------|
| Monospace | `'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace` | Code labels, section headers, nav, timestamps |
| Sans-serif (body) | `'Inter', system-ui, -apple-system, sans-serif` | Paragraph text, descriptions |

Prefer system fonts for performance. Custom fonts (e.g. via Google Fonts or self-hosted) may be added later but should not be required for a functional build.

### Scale

> TBD — a type scale (e.g. based on a modular scale ratio) will be defined once the component build begins. Use sensible defaults until then.

### Principles

- Monospace for anything that feels "technical": nav links, section labels, timestamps, skill tags, code snippets
- Sans-serif for anything that feels "human": bio text, project descriptions, role descriptions
- Line length capped at ~70ch for readable body text
- No decorative fonts — legibility is the priority

---

## Animation Philosophy

**Subtle by default.** The initial build should prioritize content clarity over motion. Animations should never block or distract.

Default animation behaviors:
- Fade-in on page load / section entry (opacity 0 → 1)
- Smooth transitions on hover (color, border, shadow)
- No janky or abrupt state changes

Architecture requirements (to enable future richness):
- CSS custom properties for timing and easing — no hardcoded `0.3s ease` scattered throughout
- Do not couple layout to animation — keep them separable
- Do not block future adoption of scroll-driven animations (CSS `animation-timeline`) or GSAP
- Island architecture (Astro) means interactive animations can be isolated without affecting static content

> **TBD:** Scroll-driven animations, entrance sequencing, and any GSAP integration are deferred to a later iteration. Do not over-engineer for them now — just don't close the door.

---

## Responsive Design

**Mobile-first.** Base styles target small screens; larger layouts are additive via `min-width` media queries.

| Breakpoint | Min-width | Layout behavior |
|-----------|-----------|----------------|
| `sm` | `480px` | Small phones handled |
| `md` | `768px` | Tablet / larger phone landscape |
| `lg` | `1024px` | Desktop — multi-column where appropriate |
| `xl` | `1280px` | Wide desktop — max content width applied |

Content layout:
- Single column on small screens
- Content-aware multi-column at `lg`+ (e.g. experience timeline with sidebar, skills in a grid)
- Max content width: `~1100px`, centered with horizontal padding

---

## Component Style

- **Minimal decoration.** Let content breathe. Avoid heavy shadows, gradients, or borders unless they add meaning.
- **Content-driven layout.** Components exist to present data, not to be visually interesting in themselves.
- **No heavy UI frameworks.** No Tailwind, no Bootstrap, no component libraries. Raw CSS (or a thin custom utility layer if needed). This keeps the output clean and the bundle minimal.
- **Consistency via CSS custom properties.** All colors, spacing, font stacks, and timing values defined as variables at `:root`. No magic numbers scattered in component styles.

---

## Contact Header

The top section of the page displays personal and contact information.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Name (large, monospace)                                │
│  Title / tagline (small, muted)                         │
│                                                         │
│  📧  ••••••••••••••  [Reveal]    ← email                │
│  📞  ••••••••••••••  [Reveal]    ← phone                │
│                                                         │
│  [GitHub]  [LinkedIn]  [...]     ← social links         │
└─────────────────────────────────────────────────────────┘
```

### Masked fields (email & phone)

- Phone and email are **not rendered as plain text in the HTML**. They are obfuscated to prevent scraper harvesting.
- Each masked field shows a placeholder (e.g. `••••••••••`) with a **[Reveal]** button alongside it.
- Clicking [Reveal] triggers the `ContactReveal` island, which decodes and displays the actual value client-side.
- The visual style of the revealed text should match the surrounding text — no jarring shift.
- The [Reveal] button uses the primary accent color; after reveal it may change to a [Copy] affordance (TBD).

### Social links

- Rendered as icon + label or icon-only buttons, linking externally (`target="_blank"`).
- Style: subtle — ghost button or plain link, not prominent CTAs.

---

## Showcase Items

Each showcase item (a project/product entry within a company) renders as a two-column card in the main content area.

### Alternating layout

Items alternate between two orientations as you scroll down, breaking up the visual monotony:

```
Item 1  ┌─────────────────┬─────────────────┐
        │  [Screenshot]   │  Name           │  ← screenshot left
        │                 │  Description    │
        └─────────────────┴─────────────────┘

Item 2  ┌─────────────────┬─────────────────┐
        │  Name           │  [Screenshot]   │  ← screenshot right
        │  Description    │                 │
        └─────────────────┴─────────────────┘

Item 3  ┌─────────────────────────────────────┐
        │  Name                               │  ← no screenshot: full width
        │  Description (full content width)   │
        └─────────────────────────────────────┘
```

- Odd items (1st, 3rd, ...): screenshot on the left, text on the right
- Even items (2nd, 4th, ...): text on the left, screenshot on the right
- Items with no screenshot: text spans full content width; alternation counter still advances (the next item with a screenshot picks up the correct side)
- On mobile (`< lg`): single column, screenshot above text, alternation disabled

### Screenshots

- Displayed as a contained image within its column — `object-fit: cover` or `object-fit: contain` depending on aspect ratio (TBD)
- Subtle border or shadow to lift it off the background
- Optional: clicking opens a lightbox or full-size view (TBD, deferred)

### Text content

- **Name**: monospace font, accent color (`#00ffcc`), prominent but not huge
- **Description**: sans-serif body text, `#e8e8e8`, capped at ~60ch
- Description content must describe personal contribution and impact — not product features. This is enforced by content convention (see `spec/architecture.md`), not by the component.

### Company grouping

Items are grouped under their parent company. The company name and role may appear as a section heading above its items, styled in muted secondary text (`#888888`) so it doesn't compete with the item names.

---

## Scroll Indicator

A fixed, right-side vertical navigation element that provides both progress feedback and section-jump affordances.

### Layout

```
          ┊
          ◉  ← Company A logo (active)
          │
          ◎  ← Company B logo
          │
    <<  ▓  >>   ← draggable thumb (caret style)
          │
          ◎  ← Projects icon
          │
          ◎  ← Skills icon
          ┊
```

### Behavior

- **Fixed position** on the right side of the viewport, vertically centered relative to the showcase sections.
- **Section markers**: One marker per major section. For work experience entries, the marker is the company's logo image. For non-experience sections (projects, skills), a generic icon or monogram is used.
- **Active marker**: The marker for the currently visible section is highlighted (e.g. full opacity, accent color ring or glow). Inactive markers are dimmed.
- **Scroll thumb**: A draggable element positioned along the vertical bar. Its position reflects the current scroll progress through the page.
  - Visual style: two HTML-caret characters (`<<` and `>>`) flanking the thumb, rendered in monospace. Example: `<< ▓ >>`
  - Drag behavior: dragging the thumb scrolls the page proportionally to the drag position.
  - Clicking a section marker jumps to that section (smooth scroll).

### Responsive behavior

- On mobile (`< lg` breakpoint), the scroll indicator is **hidden**. It is only shown at `lg`+ where there is sufficient horizontal space.
- The main content must not be obscured by the indicator — adequate right-side padding is required on `lg`+ layouts.

### Visual style

- Vertical line: `1px` solid, `border` color token (`#2a2a2a`), subtle
- Markers: `~24px` diameter circles; logo images cropped/masked to circle
- Active marker: accent color ring, full opacity
- Inactive markers: `40%` opacity
- Thumb: monospace font, accent color, `cursor: grab` / `cursor: grabbing` on drag

---

## Visual Motifs (TBD)

> These are aspirational — not required for the initial build.

- Subtle scanline or grain texture on backgrounds
- Terminal-style cursor blink on accent elements
- Monospace text with highlighted "typed" effect on hero section
- Grid or dot-matrix background pattern (very subtle, CSS-only)
