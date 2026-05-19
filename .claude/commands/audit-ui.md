---
name: audit-ui
description: Audit all app/ files against DESIGN.md — flags inline patterns, hardcoded values, and component violations. Run any time mid-phase to catch UI drift before it accumulates.
---

Read DESIGN.md in full before starting.

Scan every .tsx and .ts file in app/ (excluding node_modules, .next, generated files).
Also scan src/ if it contains UI-related files.

Check each file against DESIGN.md component registry and enforcement rules.

Checks to run:

COMPONENT VIOLATIONS — patterns that must use a registered component:

- Inline `//` heading pattern (raw JSX string or span) instead of <SectionHeading> or <CardHeading>
- Bare <UserButton /> instead of <VisaScoutUserButton>
- Raw <button> element outside app/components/ui/ — when flagging, also check whether `import { Button }` exists in the file; if missing, append `(Button import missing)` to the finding
- Styled <Link> with background/border outside app/components/ui/
- Wordmark pattern (// VisaScout) written inline instead of <Wordmark>
- Footer links written inline instead of <FooterLink>

HARDCODED VALUES — values that must use CSS tokens:

- Hardcoded font names in component files ('Space Grotesk', 'Geist', 'JetBrains Mono', etc.) outside app/layout.tsx and src/lib/pdfTemplate.ts
- Hardcoded rgba() shadow values in JSX style props (boxShadow: '0 0 ...' etc.) — must use var(--shadow-card) or var(--shadow-amber)
- Hardcoded hex color values in JSX style props — must use var(--color-\*)
- Exception: #ffffff on primary button text is allowed hardcoded

THEME VIOLATIONS:

- [data-theme="light"] selector without html prefix — must be html[data-theme="light"]
- var(--color-primary) used as text color on a colored background (button, badge)
- disableTransitionOnChange on ThemeProvider

TYPOGRAPHY VIOLATIONS:

- letterSpacing value above 0.04em on any string containing a space (multi-word)
- font-family or fontFamily set to a literal font name instead of var(--font-\*)

CLERK VIOLATIONS:

- ClerkProvider appearance config inline in layout.tsx — must be in ClerkThemeProvider.tsx
- Bare <UserButton /> without VisaScoutUserButton wrapper

Output format:

## UI Audit — [date]

### VIOLATIONS (fix before continuing)

[file path]:[line approx] — [description of violation]

### WARNINGS (review before phase complete)

[file path]:[line approx] — [description]

### PASS

[X] files scanned. [Y] violations. [Z] warnings.

Rules:

- Be specific — file path for every finding. Line number where determinable.
- Do not fix anything. Report only. Wait for instruction.
- If a file is clearly a fixture, test, or generated file, skip it.

Once complete, state: "Audit complete. X violations found. Ready for fixes or continue?"
