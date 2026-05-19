---
name: improve
description: Analyze the friction log from planning/progress.md. Produces direct CLAUDE.md rule proposals and a structured planning/improve.md ready to paste into Claude.ai for skill updates.
---
Read planning/progress.md in full. Focus on the Friction Log section.

If no friction log exists or it says "None.":
State: "No friction logged. Nothing to improve." and stop.

STEP 1 — Classify each friction item into one of two buckets:

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

If no Bucket A items: state "No CLAUDE.md changes needed this session."

---

STEP 3 — Output 2: Write planning/improve.md

Write planning/improve.md with this structure:

# Improve Log — [date]

## Source
Session: [phase name or post-launch description from progress.md]
Friction items: [count]

## Updates Needed (Bucket B)

For each Bucket B item:
### [Short label]
- Friction: [exact friction item from log]
- Where: [Claude.ai skill name] OR [Claude Code command e.g. /audit-backend]
- Proposed change: [specific language to add, remove, or modify]
- Priority: [high / medium / low]

## CLAUDE.md Rules Proposed (Bucket A)
[Copy the proposed rules from Step 2 output here for reference]

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

When done, state:

---
🔁 IMPROVE DONE.

Bucket A — CLAUDE.md rules: [X] proposed.
Open CLAUDE.md in VS Code. Paste rules under correct section. Save.

Bucket B — [Y] updates written to planning/improve.md.
Open planning/improve.md. Bring to Claude.ai.

For each item:
- Claude.ai skill → trigger skill by name. paste improve.md. say "apply Bucket B updates". save artifact.
- Claude Code command → say "update the /[command] command based on this improve log". drop output .md into .claude/commands/.

Loop complete. /improve again next session.
---
