import type { VisaRequest } from '../types/index';

export function buildRecentChangesPrompt(
  request: VisaRequest,
  searchResults: string
): string {
  return `You are a visa policy analyst specializing in recent policy changes. Analyze recent news and official announcements about visa policy for ${request.normalizedNationality} passport holders traveling to ${request.normalizedDestination}.

Focus ONLY on changes from the last 90 days. Ignore older information.

Traveler context:
- Visa type of interest: ${request.visaType || 'general tourist/visa-on-arrival/exemption'}
- Freeform: ${request.freeform}

Search results (last 90 days):
${searchResults}

Extract policy changes, enforcement shifts, and new requirements.
Be specific — include effective dates when available.
Explicitly state "No recent changes found from Tier 1-2 sources" if applicable.

Return ONLY valid JSON (no markdown fences):
{
  "changes": [
    {
      "description": "<what changed>",
      "effectiveDate": "<date or null>",
      "sourceUrl": "<url or null>",
      "sourceTier": <1|2|3|4>
    }
  ],
  "enforcementShifts": ["<enforcement change description>"],
  "newRequirements": ["<new requirement>"],
  "lastChecked": "<today's date>",
  "confidence": "<high|medium|low>",
  "gaps": ["<what information was missing or couldn't be verified>"],
  "sourceTier": <1|2|3|4>,
  "sourceUrls": ["<url>"],
  "verified": <true|false>
}

Set verified=false if no Tier 1-2 sources confirmed the changes.`;
}
