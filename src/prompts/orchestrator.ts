import type { VisaInput } from '../types/index.js';

export function buildOrchestratorPrompt(input: VisaInput): string {
  return `You are a visa intelligence orchestrator. A traveler has submitted the following input:

Nationality: ${input.nationality}
Destination: ${input.destination}
Current Visa Type (if specified): ${input.visaType || 'Not specified'}
Freeform context: ${input.freeform}

Your task: Parse and normalize this input into a structured VisaRequest JSON object.

Extract the following fields from the freeform context:
- normalizedNationality: standardized English country name for the nationality
- normalizedDestination: standardized English country name for the destination
- intendedDuration: how long they plan to stay (e.g., "28 days", "3 months")
- entryExitPattern: how they plan to enter/exit (e.g., "single entry", "border run to Malaysia", "multiple entries")
- incomeSource: how they earn (e.g., "remote work for US company", "freelancer", "employed locally")
- priorVisitHistory: any mentioned prior visits to the destination or region
- accommodationType: where they plan to stay (e.g., "apartment rental", "hotel", "coliving")
- parsedSummary: a 2-3 sentence plain-English summary of what you understood, suitable for showing to the user as a confirmation

Return ONLY valid JSON with this exact structure (no markdown fences, no explanation):
{
  "nationality": "<original input>",
  "destination": "<original input>",
  "visaType": "<original input or null>",
  "freeform": "<original input>",
  "normalizedNationality": "<standardized>",
  "normalizedDestination": "<standardized>",
  "intendedDuration": "<extracted or null>",
  "entryExitPattern": "<extracted or null>",
  "incomeSource": "<extracted or null>",
  "priorVisitHistory": "<extracted or null>",
  "accommodationType": "<extracted or null>",
  "parsedSummary": "<2-3 sentence summary>"
}`;
}
