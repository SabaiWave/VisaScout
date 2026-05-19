---
name: start
description: Begin or resume a VisaScout session — reads spec docs, detects context (active phase vs post-launch), and executes accordingly.
---

Read CLAUDE.md, BLUEPRINT.md, and DESIGN.md in full before doing anything else.

CONTEXT DETECTION — run this logic first, every session:

1. Check planning/progress.md — does it exist?
   - YES: read it in full.
     Before resuming: check whether planning/improve.md exists.
     - If improve.md does NOT exist AND Friction Log in progress.md is non-empty:
       State: "⚠ Unprocessed friction from last session. Run /improve before continuing."
       Wait for instruction. Do not resume until user responds.
     - If improve.md exists OR Friction Log is empty: proceed normally.
       Use the Resume Prompt to pick up exactly where the last session left off.
       Do not re-run completed work. Skip steps 2-3.
   - NO: continue to step 2.

2. Check BLUEPRINT.md — are there any unchecked phases?
   - YES (unchecked phases exist): identify the first unchecked phase.
     Execute that phase prompt exactly as written. Do not skip DoD.
   - NO (all phases checked): POST-LAUNCH MODE — continue to step 3.

3. Post-launch mode:
   State: "All phases complete. Running in post-launch mode."
   Read CLAUDE.md and DESIGN.md.
   Ask: "What are we working on this session?"
   Wait for instruction before doing anything.
   Do not invent work. Do not re-run any phase.

Rules (all modes):

- Do not deviate from the architecture in CLAUDE.md.
- Do not skip the definition of done.
- When a phase completes: check it off in BLUEPRINT.md, summarize what was built,
  state "Phase X complete. Ready for Phase X+1." Do not proceed without instruction.
- Communication style: caveman skill (globally installed). If not active: /caveman.
