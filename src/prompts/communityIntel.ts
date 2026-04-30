import type { VisaRequest } from '../types/index';

export function buildCommunityIntelPrompt(
  request: VisaRequest,
  searchResults: string
): string {
  return `You are a visa analyst reviewing real traveler reports. Analyze recent community reports from Reddit, Nomad List, and travel forums about visa experiences for ${request.normalizedNationality} passport holders in ${request.normalizedDestination}.

Traveler context:
- Intended duration: ${request.intendedDuration || 'unknown'}
- Visa type: ${request.visaType || 'not specified'}
- Entry pattern: ${request.entryExitPattern || 'unknown'}
- Freeform: ${request.freeform}

Community search results:
${searchResults}

Extract ground truth information from recent traveler reports. Focus on:
1. Actual enforcement reality vs. official rules
2. Recent experiences at borders/immigration
3. Common issues travelers face
4. Practical tips that differ from official guidance

IMPORTANT: Community intel (Tier 4) cannot override official policy (Tier 1-2).
Its value is flagging enforcement divergence and practical realities.

Return ONLY valid JSON (no markdown fences):
{
  "recentReports": [
    {
      "summary": "<traveler report summary>",
      "date": "<approximate date or null>",
      "sourceUrl": "<url or null>",
      "sentiment": "<positive|neutral|negative>"
    }
  ],
  "groundTruthNotes": ["<key practical observation>"],
  "enforcementReality": "<how rules are actually enforced in practice>",
  "commonIssues": ["<common problem travelers face>"],
  "confidence": "<high|medium|low>",
  "gaps": ["<what community data was missing>"],
  "sourceTier": 4,
  "sourceUrls": ["<url>"],
  "verified": false
}

Note: Community intel is always verified=false — it supplements but never overrides official sources.`;
}
