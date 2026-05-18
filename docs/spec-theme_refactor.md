# Prompt: Theme-Ready Refactor (Feature Branch)

Read CLAUDE.md and DESIGN.md in full before starting.

## Goal

Refactor the codebase to be theme-ready — dark mode remains the default, but light mode
can be introduced later via a single `[data-theme="light"]` CSS block with zero component changes.

This is a refactor only. No new features. No UI changes. Visual output must be identical to main.

---

## Branch

Work on: `feature/theme-ready`
Do not merge to main until all DoD items are checked.

---

## What to do

### 1. Audit current color usage

Scan every file in `app/` and `src/` for:

- Hardcoded hex values outside of `globals.css` `:root` block (e.g. `color: '#6366F1'`, `background: '#0A0A0A'`)
- Tailwind color utilities used for themed colors (e.g. `bg-gray-900`, `text-white`, `border-gray-800`)
- Any inline `style={{}}` props with color hex values

Output a list of every violation found before touching any code. Confirm with me before proceeding.

### 2. Ensure `:root` token block is complete

In `app/globals.css`, confirm the `:root` block contains every color used in the app as a named token.
Add any missing tokens. Every token must have a usage comment.

Reference the token names already established in DESIGN.md — do not rename existing tokens.

### 3. Add `[data-theme="light"]` stub

Immediately after the `:root` block in `app/globals.css`, add:

```css
[data-theme="light"] {
  /* Light mode overrides — populate when light mode is introduced.
     Only tokens that differ from dark mode need to be listed here.
     To enable: document.documentElement.setAttribute('data-theme', 'light')
     To revert: document.documentElement.removeAttribute('data-theme') */
  --color-bg-base: #ffffff;
  --color-bg-elevated: #f9fafb;
  --color-bg-overlay: #f3f4f6;
  --color-bg-subtle: #f0f0f5;
  --color-border: #e5e7eb;
  --color-border-muted: #f3f4f6;
  --color-border-strong: #d1d5db;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-text-tertiary: #9ca3af;
  /* Primary (indigo), accent (amber), semantic colors unchanged in light mode */
}
```

### 4. Replace all hardcoded hex in components

For every violation found in step 1:

- Replace hex with the appropriate `var(--color-*)` token
- Replace Tailwind color utilities (`bg-gray-900`) with inline `style={{ background: 'var(--color-bg-base)' }}`
  OR extract to a CSS class in globals.css

**Priority order:**

- Background colors first (most visible if wrong)
- Text colors second
- Border colors third
- Box shadows last (these are already using rgba — confirm they reference the right semantic color)

### 5. Verify Clerk theming uses tokens where possible

In `app/layout.tsx` ClerkProvider appearance:

- `colorBackground`, `colorInputBackground` etc. are Clerk-internal and cannot use `var()` — leave as hex
- These are acceptable exceptions — document them with a comment: `/* Clerk internal — cannot use CSS vars */`

### 6. Verify ClerkFontFix is in place

Confirm `app/components/ClerkFontFix.tsx` exists and is mounted in `app/layout.tsx`.
If missing, flag it — do not recreate without checking with me first.

### 7. Visual regression check

After all replacements:

- Run `npm run build` — must pass with zero errors
- Manually verify these pages look identical to main:
  - `/` (landing)
  - `/app` (generate form)
  - `/brief/[id]` (brief output)
  - `/dashboard`
  - `/admin`
- Open Clerk sign-in modal — confirm dark theme intact
- Open UserButton popover — confirm dark theme intact

### 8. Smoke test theme toggle

In browser console on any page, run:

```javascript
document.documentElement.setAttribute("data-theme", "light");
```

Page should shift to light surfaces (white backgrounds, dark text) — imperfect is fine at this stage,
but it must not break or throw errors. Document what looks correct and what still needs token work.

---

## Definition of Done

- [ ] Zero hardcoded hex values in components outside globals.css `:root` block
- [ ] Zero Tailwind color utilities used for themed colors
- [ ] `[data-theme="light"]` stub present in globals.css
- [ ] `npm run build` passes
- [ ] Visual output on all 5 pages identical to main (dark mode)
- [ ] Browser console toggle test documented — no errors thrown
- [ ] No new features introduced — this is a refactor only

## What NOT to do

- Do not change any component logic, props, or behavior
- Do not rename existing CSS tokens — only add missing ones
- Do not touch Supabase, Stripe, Clerk auth logic, or any API routes
- Do not modify any test files unless a token rename breaks an import

---

When all DoD items are checked, output a summary:

- Files changed (list)
- Tokens added to :root (list)
- Violations fixed (count by type)
- Console toggle test results
- Any remaining hardcoded values that couldn't be tokenized (with reason)

Then state: "Theme-ready refactor complete. Ready for PR review."
