import type { VisaRequest } from '../types/index';

export function buildBorderRunPrompt(
  request: VisaRequest,
  searchResults: string
): string {
  return `You are a visa analyst specializing in border crossing and visa run strategies for ${request.normalizedDestination}.

Traveler context:
- Nationality: ${request.normalizedNationality}
- Intended duration: ${request.intendedDuration || 'unknown'}
- Entry/exit pattern: ${request.entryExitPattern || 'unknown'}
- Visa type: ${request.visaType || 'not specified'}
- Freeform: ${request.freeform}

Search results (official + community):
${searchResults}

Extract border run / visa run information. Be specific and honest about enforcement posture.
Do NOT soften enforcement reality — travelers need accurate risk assessment.

Analyze:
1. How many land border entries are allowed per year (if restricted)?
2. What are the main crossing options and which are recommended?
3. What is the current enforcement posture (strict/relaxed/unpredictable)?
4. Are there any recent crackdowns or changes?
5. What are the risks of repeated border runs?

Return ONLY valid JSON (no markdown fences):
{
  "limitsPerYear": "<e.g., '2 land border crossings per year' or 'no official limit' or null>",
  "crossingOptions": [
    {
      "name": "<crossing name>",
      "country": "<neighboring country>",
      "notes": "<practical notes>",
      "recommended": <true|false>
    }
  ],
  "enforcementPosture": "<strict|moderate|relaxed — with explanation>",
  "recommendedCrossings": ["<crossing name>"],
  "warnings": ["<important warning>"],
  "confidence": "<high|medium|low>",
  "gaps": ["<what could not be verified>"],
  "sourceTier": <1|2|3|4>,
  "sourceUrls": ["<url>"],
  "verified": <true|false>
}`;
}
