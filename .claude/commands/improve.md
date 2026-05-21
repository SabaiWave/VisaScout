---
name: improve
description: End-of-night command. Reads ALL planning/progress-*.md files, consolidates friction into one improve.md, proposes CLAUDE.md rules and skill/command updates. Run once after all /stop checkpoints for the night.
---
Scan planning/ for ALL files matching progress-*.md.

If no progress-*.md files exist:
State: "No progress files found. Nothing to improve." and stop.

List the files found:
"Reading: progress-[slug1].md, progress-[slug2].md, ..."

Read each file in full. Focus on the Friction Log section of each.

If ALL friction logs say "None.":
State: "No friction logged across [N] sessions. Nothing to improve." and stop.

---

STEP 1 — Consolidate and classify all friction items across all files.

For each friction item, classify into one of two buckets:

BUCKET A — Claude Code behavioral (fixable by adding a rule to CLAUDE.md):
Claude Code did something wrong, assumed incorrectly, or needed mid-session correction.
A rule addition to CLAUDE.md would prevent recurrence.
Examples: "kept using middleware.ts instead of proxy.ts",
"assumed createClient at module level instead of lazy getter"

BUCKET B — Workflow/skill gap (requires an update in Claude.ai):
Gap in phase structure, missing DoD item, missing phase prompt content, or pattern
that belongs in a Claude.ai skill OR a Claude Code command file.

When classifying Bucket B, always specify which system:
- Claude.ai skill: sbw-phase-library, sbw-project-bootstrapper, sbw-conventions,
  sbw-design-generator, sbw-design-auditor, sbw-blueprint-auditor, sbw-prompt-writer, etc.
- Claude Code command: /start, /stop, /audit-ui, /audit-backend, /improve

Examples:
- "Phase 8 had no step for extracting components" → sbw-phase-library (Claude.ai skill)
- "audit-backend didn't check for missing imports" → /audit-backend (Claude Code command)

---

STEP 2 — Output 1: Proposed CLAUDE.md additions (Bucket A)

For each Bucket A item, write the exact rule text to add to CLAUDE.md.

Format per item:
### Proposed CLAUDE.md rule — [short label]
Section: [which existing CLAUDE.md section this belongs in]
Add after: [quote the line it should follow, or "end of section"]
Rule text:
[Exact text to paste into CLAUDE.md — written as a rule, not a note]
---

If no Bucket A items: state "No CLAUDE.md changes needed."

---

STEP 3 — Write planning/improve.md

# Improve Log — [date]

## Sources
Sessions consolidated: [list progress-*.md files read]
Total friction items: [count across all files]

## Updates Needed (Bucket B)

For each Bucket B item (note which session it came from):
### [Short label]
- Source: progress-[slug].md
- Friction: [exact friction item from log]
- Where: [Claude.ai skill name] OR [Claude Code command]
- Proposed change: [specific language to add, remove, or modify]
- Priority: [high / medium / low]

## CLAUDE.md Rules Proposed (Bucket A)
[Copy proposed rules from Step 2 here for reference]

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

**After applying all updates:**
Archive processed progress files:
Move planning/progress-*.md → planning/archive/progress-[slug]-[date].md
Or delete if you don't need the history.
planning/improve.md can stay as a record or be deleted.

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

After applying: archive or delete planning/progress-*.md files.
---
