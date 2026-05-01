import type { VisaRequest } from '../types/index';

export function buildEntryRequirementsPrompt(
  request: VisaRequest,
  searchResults: string
): string {
  return `You are a visa analyst. Extract entry requirements for ${request.normalizedNationality} passport holders entering ${request.normalizedDestination}.

Traveler context:
- Intended duration: ${request.intendedDuration || 'unknown'}
- Income source: ${request.incomeSource || 'unknown'}
- Visa type: ${request.visaType || 'not specified'}
- Freeform: ${request.freeform}

Search results from official sources:
${searchResults}

Extract ALL entry requirements. Be specific about:
1. Required documents (passport validity, photos, forms, insurance)
2. Proof of funds (exact threshold if known — e.g., "10,000 THB per person")
3. Onward ticket requirement (is it enforced? is it checked?)
4. Health requirements (vaccinations, health insurance, COVID legacy rules)
5. Any other entry conditions

Explicitly state if Tier 1 source not found for any requirement.

Return ONLY valid JSON (no markdown fences):
{
  "requiredDocuments": ["<document>"],
  "proofOfFundsThreshold": "<amount and currency or null>",
  "onwardTicketRequired": <true|false>,
  "onwardTicketNotes": "<enforcement reality or null>",
  "healthRequirements": ["<requirement>"],
  "additionalNotes": ["<important note>"],
  "confidence": "<high|medium|low>",
  "gaps": ["<what could not be confirmed>"],
  "sourceTier": <1|2|3|4>,
  "sourceUrls": ["<url>"],
  "verified": <true|false>
}

Confidence calibration (be decisive — do not default to low):
- high: all major entry requirements confirmed by Tier 1 sources with specific values (document list, exact proof-of-funds threshold)
- medium: Tier 1 source found but some requirements unconfirmed; OR primary source is Tier 2; OR onward ticket enforcement unclear
- low: NO Tier 1-2 source found — relying entirely on Tier 3-4 sources only`;
}
