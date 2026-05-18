# Prompt: Light Theme Refinement — Obsidian Paper

Read CLAUDE.md and DESIGN.md in full before starting.

## Context

The dark/light theme toggle is already working. Dark mode is production-ready.
The light theme exists but the initial implementation produced a "blinding white" result
that doesn't match the intended aesthetic.

This session refines the light theme tokens only. No structural changes. No component
logic changes. No dark mode changes. Visual output in dark mode must remain identical to main.

---

## Branch

Work on: `feature/theme-ready` (already exists)

---

## Design Direction — Obsidian Paper

Light mode is NOT a standard white app. It's an "ink-on-paper dossier" — the same
HUD structure and typography as dark mode, but on premium off-white stock instead of black.

Key principles:
- Base surface: soft off-white `#F9F9FB` — never pure `#FFFFFF` for the page background
- Cards/panels: `#FFFFFF` — elevated above the base, not the base itself
- Indigo accents stay — same `#4f46e5` but slightly deeper for light mode contrast
- `//` section headings stay indigo — HUD identity preserved
- Glow effects → replaced with crisp low-opacity shadows (no neon in light mode)
- Status badges use "ink" style — darker text on subtle tinted backgrounds
- JetBrains Mono labels stay — typography identical across modes

---

## Step 1 — Update `[data-theme="light"]` token block

In `app/globals.css`, replace the existing `[data-theme="light"]` block with:

```css
[data-theme="light"] {
  /* === OBSIDIAN PAPER — Light Mode Token Overrides === */
  /* Only tokens that differ from dark mode are listed here */

  /* Primary content */
  --color-primary:          #0A0A0A;

  /* Indigo — slightly deeper for light mode contrast */
  --color-secondary:        #4f46e5;
  --color-secondary-dark:   #3730a3;
  --color-secondary-light:  #6366f1;
  --color-secondary-subtle: #eef2ff;

  /* Purple — AI features only */
  --color-tertiary:         #9333ea;
  --color-tertiary-dark:    #7e22ce;
  --color-tertiary-subtle:  #faf5ff;

  /* Neutral base */
  --color-neutral:          #F9F9FB;

  /* Surfaces */
  --color-bg-base:          #F9F9FB;   /* Page — soft off-white, never pure white */
  --color-bg-elevated:      #FFFFFF;   /* Cards, panels — elevated above base */
  --color-bg-overlay:       #F3F4F6;   /* Modals, popovers */
  --color-bg-subtle:        #F1F1F4;   /* Sidebar, secondary surfaces */

  /* Borders */
  --color-border:           #E5E7EB;
  --color-border-muted:     #F3F4F6;
  --color-border-strong:    #D1D5DB;

  /* Text */
  --color-text-primary:     #0A0A0A;
  --color-text-secondary:   #4B5563;
  --color-text-tertiary:    #9CA3AF;

  /* Status — ink style: darker for text on light backgrounds */
  --color-status-ready:     #166534;
  --color-status-progress:  #3730a3;
  --color-status-attention: #991b1b;
  --color-status-new:       #92400e;
  --color-status-congested: #6b21a8;

  /* Confidence */
  --color-confidence-high:  #166534;
  --color-confidence-medium: #92400e;
  --color-confidence-low:   #991b1b;

  /* Amber — unchanged, still works on light */
  /* Semantic error/success — unchanged */
}
```

---

## Step 2 — Update light mode shadow/glow overrides

Glow effects (`box-shadow: 0 0 20px rgba(99,102,241,0.05)`) are atmospheric in dark mode
but invisible or muddy in light mode. Replace with crisp shadows.

Add to `app/globals.css` inside the `[data-theme="light"]` block or as a scoped override:

```css
[data-theme="light"] {
  /* ... tokens above ... */

  /* Shadow overrides — crisp depth instead of neon glow */
  --shadow-card:    0 4px 12px rgba(99, 102, 241, 0.04);   /* replaces indigo glow */
  --shadow-card-hover: 0 4px 16px rgba(99, 102, 241, 0.08), 0 0 0 1px rgba(99,102,241,0.12);
  --shadow-amber:   0 2px 8px rgba(245, 158, 11, 0.08);    /* replaces amber glow */
}
```

Then update `SectionCard` and `WarningBox` components to use `var(--shadow-card)` and
`var(--shadow-amber)` instead of hardcoded `box-shadow` values — so they respond to theme.

---

## Step 3 — Update SectionHeading gradient for light mode

The dark mode gradient is `linear-gradient(to right, rgba(99,102,241,0.5), transparent)`.
In light mode this is too faint. Override in globals.css:

```css
[data-theme="light"] .section-heading-line {
  background: linear-gradient(to right, rgba(229,231,235,1), transparent);
}
```

If `SectionHeading` renders the gradient via inline style, extract it to a CSS class
`section-heading-line` so it can be themed. Do not change the dark mode output.

---

## Step 4 — Update Clerk theming for light mode

In `app/layout.tsx`, the ClerkProvider currently uses `baseTheme: dark`.
When light mode is active, Clerk needs light theme values.

Add a client component `app/components/ClerkThemeSync.tsx` that reads the current
theme and passes the correct appearance to ClerkProvider:

```typescript
// Pattern — adapt to actual Clerk v7 API:
// When data-theme="light" is set on documentElement:
// - baseTheme: light (or remove dark)
// - colorBackground: '#FFFFFF'
// - colorInputBackground: '#F3F4F6'
// - colorText: '#0A0A0A'
// When dark (default):
// - keep existing dark appearance block unchanged
```

If ClerkProvider appearance cannot be dynamically swapped without a full remount,
flag this limitation and document the manual swap instructions instead.
Do not break the existing dark Clerk theming.

---

## Step 5 — Visual review checklist

After token updates, toggle light mode via the existing toggle and verify:

- [ ] `/` landing — off-white base, white cards, indigo accents visible
- [ ] `/app` generate form — inputs readable, labels visible, button correct
- [ ] `/brief/[id]` — section headings readable, agent rows visible, confidence badges ink-style
- [ ] `/dashboard` — brief cards elevated above base, sidebar subtle
- [ ] `/admin` — tables readable, metrics clear
- [ ] Clerk sign-in modal — readable in light mode
- [ ] UserButton popover — readable in light mode
- [ ] No pure white page backgrounds — always `#F9F9FB`
- [ ] No neon glow visible in light mode — crisp shadows only
- [ ] Dark mode unchanged — toggle back and verify

---

## Definition of Done

- [ ] `[data-theme="light"]` block updated with full Obsidian Paper token set
- [ ] Shadow tokens added and components use `var(--shadow-card)` not hardcoded glow
- [ ] SectionHeading gradient responds to theme
- [ ] Clerk theming addressed — either dynamic swap or limitation documented
- [ ] All 5 pages visually verified in light mode
- [ ] Dark mode visually unchanged
- [ ] `npm run build` passes
- [ ] No component logic changes — token/CSS changes only

## What NOT to do

- Do not change dark mode tokens in `:root`
- Do not change any component logic, props, or API behavior
- Do not rename existing tokens — only add new ones where needed
- Do not touch Supabase, Stripe, or any API routes
- Do not add new features

---

When all DoD items are checked, output:
- Token changes made (list)
- Components updated for shadow tokens (list)
- Clerk theming outcome
- Any remaining issues (with reason)

Then state: "Obsidian Paper light theme complete. Ready for PR review."
