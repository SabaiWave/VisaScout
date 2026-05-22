---
name: improve
description: End-of-night command. Reads ALL planning/progress-*.md files, consolidates friction into one improve.md, proposes CLAUDE.md rules and skill/command updates, then auto-archives processed progress files. Run once after all /stop checkpoints for the night.
---
Scan planning/ for ALL files matching progress-*.md.

If no progress-*.md files exist:
State: "No progress files found. Nothing to improve." and stop.

List the files found:
"Reading: progress-[slug1].md, progress-[slug2].md, ..."

Read each file in full. Focus on the Friction Log section of each.

If ALL friction logs say "None.":
Auto-archive all progress files (see ARCHIVE step below).
State: "No friction logged across [N] sessions. Nothing to improve. Progress files archived." and stop.

---

STEP 1 — Consolidate and classify all friction items across all files.

BUCKET A — Claude Code behavioral (fixable by adding a rule to CLAUDE.md):
Claude Code did something wrong, assumed incorrectly, or needed mid-session correction.
Examples: "kept using middleware.ts instead of proxy.ts",
"assumed createClient at module level instead of lazy getter"

BUCKET B — Workflow/skill gap (requires an update in Claude.ai):
Gap in phase structure, missing DoD item, missing prompt content, or pattern that belongs
in a Claude.ai skill OR a Claude Code command file.

When classifying Bucket B, always specify which system:
- Claude.ai skill: sbw-phase-library, sbw-project-bootstrapper, sbw-conventions,
  sbw-design-generator, sbw-design-auditor, sbw-blueprint-auditor, sbw-prompt-writer, etc.
- Claude Code command: /start, /stop, /audit-ui, /audit-backend, /improve

---

STEP 2 — Output 1: Proposed CLAUDE.md additions (Bucket A)

For each Bucket A item:
### Proposed CLAUDE.md rule — [short label]
Section: [which section this belongs in]
Add after: [quote the line it should follow, or "end of section"]
Rule text:
[Exact text to paste — written as a rule, not a note]
---

If no Bucket A items: state "No CLAUDE.md changes needed."

---

STEP 3 — Write planning/improve.md

# Improve Log — [date]

## Sources
Sessions consolidated: [list progress-*.md files read]
Total friction items: [count across all files]

## Updates Needed (Bucket B)

For each Bucket B item:
### [Short label]
- Source: progress-[slug].md
- Friction: [exact friction item]
- Where: [Claude.ai skill name] OR [Claude Code command]
- Proposed change: [specific language to add, remove, or modify]
- Priority: [high / medium / low]

## CLAUDE.md Rules Proposed (Bucket A)
[Copy proposed rules from Step 2 here]

## How to apply
**Bucket A — CLAUDE.md rules:**
Open CLAUDE.md in VS Code. Paste rules under correct section. Save.

**Bucket B — Claude.ai skills:**
Bring this file to Claude.ai. Trigger the skill by name.
Paste improve.md and say "apply Bucket B updates from this improve log."
Save artifact via Save Skill button.

**Bucket B — Claude Code commands:**
Bring this file to Claude.ai. Say "update the /[command] command based on this improve log."
Drop the output .md file into .claude/commands/ in VS Code.

---

ARCHIVE STEP — run this after writing improve.md:

1. Create planning/archive/ directory if it doesn't exist.
2. For each progress-[slug].md file that was processed:
   Move to planning/archive/progress-[slug]-[date].md
   (date format: YYYY-MM-DD)
3. Confirm each file moved — do not delete originals until move is confirmed.

---

When done, state:

---
🔁 IMPROVE DONE — [N] sessions consolidated.

Bucket A — CLAUDE.md rules: [X] proposed.
Open CLAUDE.md in VS Code. Paste rules. Save.

Bucket B — [Y] updates in planning/improve.md.
Bring to Claude.ai.
- Claude.ai skill → trigger by name. paste. say "apply Bucket B updates". save artifact.
- Claude Code command → say "update /[command] based on this improve log". drop .md into .claude/commands/.

Progress files archived → planning/archive/
planning/ is clean. Ready for next session.
---
