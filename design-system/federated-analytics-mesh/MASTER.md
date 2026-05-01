# Design System Master File — Federated Analytics Mesh

> **LOGIC:** When building a specific page, first check `design-system/federated-analytics-mesh/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Federated Analytics Mesh (FAM)
**Category:** Privacy-tech / Fintech / Analytical infrastructure
**Style:** Dark-mode command-centre with cryptographic data-viz
**Pattern:** Documentation hub + interactive scenario walkthrough
**Last updated:** 2026-04-30

---

## 1. Color Tokens

All pages use a unified dark palette with semantic naming. Backgrounds graduate from deepest (page) to lightest (cards) so depth is conveyed without shadows.

### Surface Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#0a0e1a` (mesh-in-action) / `#070c18` (dictionary) | Page background |
| `--bg-mid` | `#0d1424` | Hover/elevated mid-tone |
| `--bg-deep` | `#0f1626` | Headers, callout backgrounds |
| `--bg-elevated` | `#111827` / `#1b2640` | Sidebars, slightly raised surfaces |
| `--bg-card` | `#1a2238` (mesh-in-action) / `#131d30` (dictionary) | Card body |
| `--border` | `#2a3656` / `#1f2f4a` | Default borders |
| `--border-strong` | `#3d4a73` / `#2e4470` | Hover/focus borders |

### Text Colors — **READABILITY RULE**

> **CRITICAL:** Card body text must use `--text` (near-white). Do **not** use `--text-muted` for paragraphs of body content. Muted greys are reserved for metadata (durations, tags, footnotes), never multi-sentence content.

| Token | Hex | Allowed Usage |
|-------|-----|---------------|
| `--text` | `#e8edf7` / `#dde4f4` | **All card body text, definitions, narratives, paragraphs, callout content** |
| `--text-muted` | `#8a96b8` / `#7a8caf` | Metadata only: durations, tags, sub-labels, "n of m" counts |
| `--text-dim` | `#5a6584` / `#4a5a7a` | Decorative labels, eyebrows, scale annotations, very subtle helper text |

### Accent Colors

| Token | Hex | Semantic Role |
|-------|-----|--------------|
| `--accent` | `#4ade80` / `#39ff84` | Primary action, success, "in the mesh" highlights |
| `--accent-2` | `#38bdf8` | Information, identity (DID/VC), business perspective |
| `--accent-3` | `#fbbf24` | Warning, broker/consumer flows, analogy callouts |
| `--accent-4` | `#f472b6` | Emphasis, infrastructure, "why it matters" |
| `--accent-5` | `#a78bfa` | Cryptography, transparency log, tertiary |

---

## 2. Typography

System and monospace stacks (no external font load on mesh-in-action). Dictionary loads Syne + IBM Plex Sans.

| Variable | Stack | Usage |
|----------|-------|-------|
| `--mono` | `'SF Mono', 'IBM Plex Mono', Menlo, Consolas, monospace` | Code, payloads, metadata, technical labels |
| `--display` | `'Syne', sans-serif` (dictionary) | H1, large display headings |
| `--body` | system-ui / `'IBM Plex Sans'` | All prose |

### Type scale (updated — increased for readability)

| Role | Size | Weight | Color |
|------|------|--------|-------|
| Page H1 | 40–52px | 700 | `--text` |
| Section title (h2) | 22–26px | 600 | `--text` |
| Sub-section (h3) | 19–21px | 600 | `--text` |
| Lead / subtitle / lede | 19–22px | 400–500 | `--text` |
| **Card body** | **17px** | **400–500** | **`--text`** |
| Card lead sentence | 19px | 600 | `--text` |
| Small body / table cell | 16px | 400 | `--text` |
| Metadata chip / mono inline | 14px mono | 500 | `--text-muted` |
| Eyebrow / section label | 12–13px mono | 600 | `--text-dim` |
| Tag / badge | 12px mono | 600 | accent-tinted |

**Body root:** `font-size: 17px` (was 16px). All sizes inherit unless overridden.

**Line-height:** body text uses 1.65–1.75 for legibility; ledes use 1.5–1.6.

---

## 3. Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps between inline icons |
| `--space-sm` | `8px` | Inline spacing, chip gaps |
| `--space-md` | `16px` | Default padding, paragraph margin |
| `--space-lg` | `24px` | Section padding, card padding |
| `--space-xl` | `32px` | Section margins |
| `--space-2xl` | `48px` | Major section breaks |

---

## 4. Component Specifications

### Card / Sidebar / Entry

```css
.card, .sidebar, .entry {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10–12px;
  padding: 18–24px 20–28px;
  color: var(--text);              /* CARD CONTENT IS WHITE */
  line-height: 1.65–1.75;
}

.card:hover, .entry:hover {
  border-color: var(--border-strong);
  /* No layout-shifting transforms — borders/shadows only */
}
```

### Callout (privacy, business perspective, analogy, why-it-matters)

```css
.callout {
  background: var(--bg-deep);
  border-left: 3px solid <accent>;
  border-radius: 0 8px 8px 0;
  padding: 14px 16px;
  color: var(--text);              /* WHITE — not muted */
  font-size: 15px;
  line-height: 1.55;
}
.callout strong { color: <accent>; }
```

### Pill / Tab / Step indicator

```css
.pill {
  padding: 8–12px 14–18px;
  background: transparent;
  color: var(--text-muted);        /* dim until active */
  border-radius: 8px;
}
.pill.active {
  background: var(--bg-deep);
  color: var(--text);
  box-shadow: inset 0 0 0 1px var(--accent);
}
```

### Chip (actor, tag)

```css
.chip {
  font-family: var(--mono);
  font-size: 13px;
  padding: 3px 8px;
  border-radius: 3px;
  background: var(--bg-deep);
  border: 1px solid var(--border);
  color: var(--text);              /* WHITE */
}
.chip.primary { /* green-tinted */ }
.chip.infra   { /* purple-tinted */ }
```

---

## 5. Iconography

- **No emojis as functional icons.** Inline SVGs only (the dictionary uses single emojis as decorative category icons in the header — that is acceptable).
- Standard sizes: `14px` (inline), `16px` (button), `20px` (section header).
- `stroke-width: 1.6–2`, `stroke-linecap: round`.
- Icons inherit `currentColor` so they recolor with their parent.

---

## 6. Motion

- Default transition: `150–250ms cubic-bezier(0.4, 0, 0.2, 1)`.
- Active flow lines pulse with `flowDash 1.2s linear infinite`.
- Layout transitions (sidebar collapse): `0.3s` on `grid-template-columns`.
- Respect `prefers-reduced-motion` — disable all decorative animation, keep state changes instant.

---

## 7. SVG Diagram Conventions

- ViewBox: `0 0 1100 580`.
- Bands by y-coordinate: 60 (document path), 180 (mesh layer), 300 (services), 500 (consumers).
- Edges that converge on the same node use **quadratic Bézier paths** (`<path d="M.. Q.. ..">`), not straight `<line>` elements.
- Arrival points are staggered across the receiving node's full width to prevent arrowhead clustering.
- Active flow lines: `drop-shadow(0 0 3px currentColor)` to lift over static lines.

---

## 8. Accessibility

- Card text contrast: `--text` (`#e8edf7`) on `--bg-card` (`#1a2238`) ≈ 13.5:1 — passes WCAG AAA.
- Muted text contrast: `--text-muted` on `--bg-card` ≈ 5.4:1 — passes AA but **must not be used for body content**.
- Focus rings: `outline: 2px solid var(--accent); outline-offset: 2px;` on all interactive elements.
- All clickable surfaces have `cursor: pointer`.
- Icon-only buttons require `aria-label`.

---

## 9. Anti-Patterns (Do NOT Use)

- ❌ **Muted-grey body text** — paragraphs of `--text-muted` are unreadable for users with mild visual fatigue. Use `--text` for any content over one line.
- ❌ Light mode (project is dark-only).
- ❌ Emoji as functional icons.
- ❌ Layout-shifting hover transforms (scale/translate) on cards.
- ❌ Straight `<line>` SVG edges where multiple flows converge — use curved paths.
- ❌ Floating cards that obscure the diagram (replaced by anchored sidebars).

---

## 10. Pre-Delivery Checklist

- [ ] All card body text uses `var(--text)`, not `--text-muted`
- [ ] Muted greys reserved for ≤1-line metadata
- [ ] Focus rings visible on all interactive elements
- [ ] `cursor: pointer` on every clickable surface
- [ ] No emoji icons (decorative category emojis in dictionary header are OK)
- [ ] Hover states are color/border only, no layout shift
- [ ] Animations under 300ms; honor `prefers-reduced-motion`
- [ ] Responsive at 375 / 768 / 1024 / 1400 px
- [ ] Dark-mode contrast ≥ 4.5:1 for muted, ≥ 7:1 for body
