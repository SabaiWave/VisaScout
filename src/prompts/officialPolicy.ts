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
Set confidence=low if relying on Tier 3-4 sources only.`;
}
