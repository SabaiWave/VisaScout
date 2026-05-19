---
name: improve
description: Analyze the friction log from planning/progress.md. Produces direct CLAUDE.md rule proposals and a structured planning/improve.md ready to paste into Claude.ai for skill updates.
---
Read planning/progress.md in full. Focus on the Friction Log section.

If no friction log exists or it says "None.":
State: "No friction logged. Nothing to improve." and stop.

---

STEP 1 — Classify each friction item into one of two buckets:

BUCKET A — Claude Code behavioral (fixable by adding a rule to CLAUDE.md):
Claude Code did something wrong, assumed incorrectly, or needed mid-session correction.
A rule addition to CLAUDE.md would prevent recurrence.
Examples: "kept using middleware.ts instead of proxy.ts",
"assumed createClient at module level instead of lazy getter",
"used var(--color-primary) on button text instead of #ffffff"

BUCKET B — Workflow/skill gap (requires a skill update in Claude.ai):
Gap in phase structure, missing DoD item, missing phase prompt content, or pattern
that belongs in the bootstrapper, design generator, or auditor skill.
Examples: "Phase 8 had no step for extracting components first",
"design auditor didn't catch inline shadow values",
"stop command had no post-launch mode"

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

## Skill Updates Needed (Bucket B)

For each Bucket B item:
### [Short label]
- Friction: [exact friction item from log]
- Skill affected: [bootstrapper / design-generator / design-auditor / other]
- Proposed change: [specific language to add, remove, or modify in that skill]
- Priority: [high / medium / low]

## CLAUDE.md Rules Proposed (Bucket A)
[Copy the proposed rules from Step 2 here for reference]

## How to apply skill updates
1. Open Claude.ai
2. Trigger the relevant skill (e.g. sbw-project-bootstrapper)
3. Paste this improve.md content and say:
   "Apply the Bucket B skill updates from this improve log."
4. Save the updated skill artifact via the Save Skill button.

---

When done, state:
"Improve analysis complete.
- [X] CLAUDE.md rules proposed — review and paste manually into CLAUDE.md.
- [Y] skill updates written to planning/improve.md — paste into Claude.ai to apply.
Run /improve again after next session to continue the loop."
