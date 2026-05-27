---
name: stop
description: Checkpoint the current session — writes progress to planning/progress-[slug].md (never overwrites other threads), logs friction, and finds a home for post-launch work in BLUEPRINT.md. Safe to run mid-session before token compaction.
---

Create planning/ directory if it doesn't exist.

SLUG GENERATION — do this first:
Derive a short slug from what was worked on this session.
Rules: lowercase, hyphens only, 2-4 words max.
Examples: dashboard-qa, betterstack-alerts, phase-9-cost, auth-clerk-setup
This slug becomes the filename: planning/progress-[slug].md
Never write to planning/progress.md — always use the slug form.
re-running in the same thread overwrites, that's intended.

---

CONTEXT DETECTION:

Check BLUEPRINT.md — are there any unchecked phases?

- YES (unchecked phases exist): PHASE MODE — follow Phase Mode instructions below.
- NO (all phases checked): POST-LAUNCH MODE — follow Post-Launch Mode instructions below.

---

PHASE MODE:

Write planning/progress-[slug].md with these sections:

## Session

[slug] — [date]

## Current Phase

[Which phase is currently in progress — name and number]

## Completed This Session

[Bullet list of what was built or completed this session]

## Remaining in This Phase

[Bullet list of what's left from the current phase prompt in BLUEPRINT.md]

## Friction Log

[Bullet list of anything this session that felt manual, repetitive, or like it
should be automatic. Be specific — "had to manually set max_tokens for resolver"
is useful. "prompts could be better" is not.

Also include: any assumption that turned out wrong mid-session, any rule from
CLAUDE.md that needed to be enforced manually, any pattern recreated that already
exists elsewhere. These are the improvement signals.

If nothing, write "None."]

## Gotchas & Dead Ends

[Bullet list of approaches tried and abandoned this session, and WHY they failed.
Also: any workarounds currently in place that the next session needs to know about.
Be specific — "tried outputFileTracingIncludes to bundle chromium, doesn't work on
Vercel serverless — file size limit" is useful. "PDF generation was tricky" is not.
This section is for the next Claude Code session, not the improve loop.
If nothing, write "None."]

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

---

Before writing the file, run these checks:

**Admin route check:**
Was a new `/api/admin/*` route created this session?
- YES: confirm a corresponding UI action exists in the `/admin` page.
  If missing: build it before writing progress. Admin routes with no UI trigger are invisible debt.
- NO: proceed.

**Docs update check:**
Did this session modify behavior covered by any `docs/` file?
(logging, payments, emails, schema, dev-toolbox, access-gating, dashboard-spec, or any other docs/ file)
- YES: update the relevant docs/ file before writing progress. Stale docs are worse than no docs.
- NO: proceed.

**Legal/marketing alignment check:**
Did this session change any of the following: scoring logic, agent behavior, source tier rules, pricing tiers, data collection, or any user-facing claim about how VisaScout works?
- YES: open `app/how-it-works/page.tsx`, `app/terms/page.tsx`, and `app/privacy/page.tsx`.
  Read the relevant sections. Flag any definition, claim, or statement that no longer matches the implementation.
  Fix misalignments before writing progress. Log any that require legal review in Friction Log instead.
- NO: proceed.

---

POST-LAUNCH MODE:

1. Derive slug from what was worked on (e.g. dev-tooling, sim-endpoint, landing-copy).

2. **Pre-write checks:**

   Admin route check: was a new `/api/admin/*` route created this session?
   - YES: confirm UI action exists in `/admin`. If missing: build it now.
   - NO: continue.

   Docs update check: did this session modify behavior covered by any `docs/` file?
   - YES: update the relevant docs/ file before writing progress.
   - NO: continue.

   Legal/marketing alignment check: did this session change scoring logic, agent behavior, source tier rules, pricing tiers, data collection, or any user-facing claim about how VisaScout works?
   - YES: check `app/how-it-works/page.tsx`, `app/terms/page.tsx`, `app/privacy/page.tsx` for stale definitions or claims. Fix before writing progress. Log legal-review items in Friction Log.
   - NO: continue.

3. Find a home in BLUEPRINT.md:
   - Work relates to an existing phase?
     YES: append under that phase:
     ### Post-launch: [short label] — [date]
     - [bullet: what was done]
       NO: create new entry at bottom:
     ## Phase [N] — [Descriptive Name]
     ### Post-launch: [short label] — [date]
     - [bullet: what was done]
       Mark checked [x] if complete.

4. Write planning/progress-[slug].md with these sections:

## Session

[slug] — [date]

## Session Type

Post-launch — [short description]

## Completed This Session

[Bullet list of what was built, fixed, or changed]

## Friction Log

[Same rules as phase mode — be specific. If nothing, write "None."]

## Gotchas & Dead Ends

[Same rules as phase mode — failed approaches, WHY they failed, active workarounds.
If nothing, write "None."]

## BLUEPRINT.md Update

[Note which phase was updated or created, and what was added]

## Resume Prompt

[If work incomplete: exact instruction to resume.
If complete: "Session complete. No resume needed."]

---

When done, confirm:

---

✅ CHECKPOINT SAVED → planning/progress-[slug].md

Safe to compact or start new thread. /start will detect this file and resume.

End of night: run /improve
/improve reads ALL progress-\*.md files → one consolidated improve.md.
Then bring improve.md to Claude.ai → update skills/commands → archive progress files.

---
