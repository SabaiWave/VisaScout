---
name: start
description: Begin or resume a VisaScout session — reads spec docs, identifies current phase, and executes it.
---
Read CLAUDE.md, BLUEPRINT.md, and DESIGN.md in full before doing anything else.

Resume logic:
1. Check if planning/progress.md exists.
   - If YES: read it in full. Use the Resume Prompt inside it
     to pick up exactly where the last session left off.
     Do not re-run completed work.
   - If NO: identify the current phase by checking which phases
     are unchecked in BLUEPRINT.md. Execute the prompt for that
     phase exactly as written.

Do not deviate from the architecture in CLAUDE.md.
Do not skip the definition of done.
When the current phase is complete, check it off in BLUEPRINT.md,
summarize what was built, and explicitly state:
"Phase X complete. Ready for Phase X+1."
Do not proceed to the next phase without explicit instruction.
