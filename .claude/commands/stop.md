---
name: stop
description: End the current session — writes progress summary to planning/progress.md so the next session can resume cleanly.
---
Create planning/ directory if it doesn't exist.
Write planning/progress.md with the following sections:

## Current Phase
[Which phase is currently in progress]

## Completed This Session
[Bullet list of what was built or completed this session]

## Remaining in This Phase
[Bullet list of what's left from the current phase prompt in BLUEPRINT.md]

## Resume Prompt
[Exact text to paste at the start of the next Claude Code
session to pick up where we left off — be specific about
what file to touch next and what to do]

Overwrite planning/progress.md if it already exists.

When done, confirm: "Phase 1 delta complete."
Do not proceed to Phase 2.
