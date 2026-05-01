import type { VisaRequest } from '../types/index';

export function buildOfficialPolicyPrompt(
  request: VisaRequest,
  searchResults: string
): string {
  return `You are a visa policy analyst. Analyze the following official government sources about visa rules for ${request.normalizedNationality} passport holders traveling to ${request.normalizedDestination}.

Traveler context:
- Intended duration: ${request.intendedDuration || 'unknown'}
- Entry/exit pattern: ${request.entryExitPattern || 'unknown'}
- Current visa type: ${request.visaType || 'not specified'}
- Freeform: ${request.freeform}

Search results from official sources:
${searchResults}

Extract comprehensive visa policy information. Be specific and cite exact rules.
If you cannot find information from Tier 1 sources (government sites), explicitly state this.

Return ONLY valid JSON (no markdown fences):
{
  "visaTypes": [
    {
      "name": "<visa type name>",
      "maxStay": "<maximum stay duration>",
      "canExtend": <true|false>,
      "extensionDetails": "<extension rules or null>",
      "fee": "<fee in USD or local currency or null>",
      "eligibility": "<who qualifies or null>"
    }
  ],
  "defaultStayDuration": "<default duration for this nationality>",
  "extensionRules": "<general extension rules>",
  "fees": "<fee summary>",
  "applicationProcess": "<how to apply>",
  "notes": ["<important note>"],
  "confidence": "<high|medium|low>",
  "gaps": ["<what information was missing>"],
  "sourceTier": <1|2|3|4>,
  "sourceUrls": ["<url>"],
  "verified": <true|false>
}

Set verified=false if no Tier 1 government sources were found.
Confidence calibration (be decisive — do not default to low):
- high: core visa rules (stay duration, eligibility, fees) confirmed by Tier 1 sources with specific values
- medium: Tier 1 source found but key details (exact fees, specific stay length) unconfirmed; OR primary source is Tier 2
- low: NO Tier 1-2 source found, relying entirely on aggregators or community (Tier 3-4 only)`;
}
