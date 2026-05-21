---
name: start
description: Begin or resume a VisaScout session — reads spec docs, detects context (active phase vs post-launch), and executes accordingly.
---

Read CLAUDE.md, BLUEPRINT.md, and DESIGN.md in full before doing anything else.

CONTEXT DETECTION — run this logic first, every session:

1. Check BLUEPRINT.md — are there any unchecked phases?
   - YES (unchecked phases exist): PHASE MODE — continue to step 2.
   - NO (all phases checked): POST-LAUNCH MODE — skip to step 4.

2. PHASE MODE — check for progress files:
   Scan planning/ for any progress-\*.md files.
   - NO FILES: identify the first unchecked phase in BLUEPRINT.md.
     Execute that phase prompt exactly as written. Do not skip DoD.
   - ONE FILE: read it. Check friction log.
     If improve.md does NOT exist AND Friction Log is non-empty:
     State: "⚠ Unprocessed friction from last session. Run /improve before continuing."
     Wait for instruction. Do not resume until user responds.
     Otherwise: use Resume Prompt to pick up where left off.
   - MULTIPLE FILES: list them with last-modified time. Ask:
     "Found [N] progress files:
     1. progress-[slug1].md (modified [time])
     2. progress-[slug2].md (modified [time])
        Which to resume? (default: most recent)"
        Wait for response. Load chosen file. Apply friction check same as ONE FILE above.

3. PHASE MODE rules:
   - Do not deviate from the architecture in CLAUDE.md.
   - Do not skip the definition of done.
   - When a phase completes: check it off in BLUEPRINT.md, summarize what was built,
     state "Phase X complete. Ready for Phase X+1." Do not proceed without instruction.

4. POST-LAUNCH MODE:
   Scan planning/ for any progress-\*.md files.
   - NO FILES: state "All phases complete. Running in post-launch mode."
     Ask: "What are we working on this session?"
     Wait for instruction. Do not invent work.
   - ONE FILE: state "Found progress-[slug].md. Resume this or start something new?"
     Wait for response.
     - Resume: load file, use Resume Prompt.
     - New: ask "What are we working on?" and proceed.
   - MULTIPLE FILES: list them. Ask:
     "Found [N] progress files:
     1. progress-[slug1].md (modified [time])
     2. progress-[slug2].md (modified [time])
        Resume one, or start something new?"
        Wait for response. Load chosen file or ask what to work on.

Rules (all modes):

- Do not deviate from the architecture in CLAUDE.md.
- Do not skip the definition of done.
- Communication style: caveman skill (globally installed). If not active: /caveman.

After outputting the session kickoff summary, always append:

---

⚡ SESSION OPEN. When done: /stop
Why: /stop checkpoint progress. Capture friction. Safe mid-session before compaction.
New thread same feature? /stop here → /start there → picks up exact file.

---
