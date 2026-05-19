---
name: stop
description: End the current session — detects phase vs post-launch context, writes progress to planning/progress.md, logs friction, and finds a home for post-launch work in BLUEPRINT.md.
---

Create planning/ directory if it doesn't exist.

CONTEXT DETECTION — run this logic first:

Check BLUEPRINT.md — are there any unchecked phases?

- YES (unchecked phases exist): PHASE MODE — follow Phase Mode below.
- NO (all phases checked): POST-LAUNCH MODE — follow Post-Launch Mode below.

---

PHASE MODE:

Write planning/progress.md with these sections:

## Current Phase

[Which phase is currently in progress — name and number]

## Completed This Session

[Bullet list of what was built or completed this session]

## Remaining in This Phase

[Bullet list of what's left from the current phase prompt in BLUEPRINT.md]

## Friction Log

[Bullet list of anything this session that felt manual, repetitive, or like it
should be automatic. Be specific — "had to manually set max_tokens for resolver"
is useful. "prompts could be better" is not. If nothing, write "None."]

## Phase Complete Summary

[Only if ALL DoD items for this phase are checked. Include:

- What was built (bullet list)
- What was fixed (bullet list)
- Decisions made
- New environment variables introduced (name, purpose, where to get it)
- Manual verification steps
  If phase is not complete, omit this section entirely.]

## Resume Prompt

[Exact instruction to start the next session — specific file, specific action.
Always first line: "Read CLAUDE.md, BLUEPRINT.md, and DESIGN.md before starting."
Then: what to do next.]

Overwrite planning/progress.md if it already exists.
When done, confirm: "Session saved. Run /improve to process friction."

---

POST-LAUNCH MODE:

1. Summarize what was worked on this session (feature branch, polish, hotfix, etc.)

2. Find a home in BLUEPRINT.md:
   - Does this session's work relate closely to an existing phase?
     YES: append a post-launch iteration note under that phase in BLUEPRINT.md:
     ### Post-launch: [short label] — [date]
     - [bullet: what was done]
       NO: create a new phase entry at the bottom of BLUEPRINT.md:
     ## Phase [N] — [Descriptive Name]
     ### Post-launch: [short label] — [date]
     - [bullet: what was done]
       Mark it checked [x] if work is complete.

3. Write planning/progress.md with these sections:

## Session Type

Post-launch — [feature branch name or short description]

## Completed This Session

[Bullet list of what was built, fixed, or changed]

## Friction Log

[Capture both friction AND learnings from this session:

- Friction: anything that felt manual, repetitive, or should be automatic
- Learnings: decisions made, gotchas discovered, patterns that worked well,
  anything worth preserving or repeating in future sessions or projects
  Be specific in both cases. "Had to manually set max_tokens" is useful friction.
  "Lazy getter pattern solved the module-level singleton bug" is a useful learning.
  If nothing, write "None."]

## BLUEPRINT.md Update

[Which phase was updated or created, and what was added]

## Resume Prompt

[If work is incomplete: exact instruction to resume next session.
If work is complete: "Session complete. No resume needed."]

Overwrite planning/progress.md if it already exists.
When done, confirm: "Session saved to [Phase X / new Phase N]. Run /improve to process friction."
