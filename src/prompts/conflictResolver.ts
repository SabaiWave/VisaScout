import type { AgentResultEnvelope } from '../types/index';

export function buildConflictResolverPrompt(envelope: AgentResultEnvelope): string {
  const summaries = {
    officialPolicy: envelope.officialPolicy.status === 'success'
      ? JSON.stringify(envelope.officialPolicy.data, null, 2)
      : `FAILED: ${envelope.officialPolicy.error}`,
    recentChanges: envelope.recentChanges.status === 'success'
      ? JSON.stringify(envelope.recentChanges.data, null, 2)
      : `FAILED: ${envelope.recentChanges.error}`,
    communityIntel: envelope.communityIntel.status === 'success'
      ? JSON.stringify(envelope.communityIntel.data, null, 2)
      : `FAILED: ${envelope.communityIntel.error}`,
    entryRequirements: envelope.entryRequirements.status === 'success'
      ? JSON.stringify(envelope.entryRequirements.data, null, 2)
      : `FAILED: ${envelope.entryRequirements.error}`,
    borderRun: envelope.borderRun.status === 'success'
      ? JSON.stringify(envelope.borderRun.data, null, 2)
      : `FAILED: ${envelope.borderRun.error}`,
  };

  return `You are a conflict resolver for a visa intelligence system. You have received outputs from 5 parallel agents. Your job is to reconcile contradictions using source tier and recency.

SOURCE TIER RULES (non-negotiable):
- Tier 1 (government sites) beats all other tiers regardless of recency
- Within same tier, newer beats older
- Tier 4 (community) NEVER overrides Tier 1-2, but flags enforcement divergence
- If no Tier 1-2 source found → mark as unverified, confidence: low

Agent outputs:

OFFICIAL POLICY (Tier ${envelope.officialPolicy.sourceTier}, ${envelope.officialPolicy.status}):
${summaries.officialPolicy}

RECENT CHANGES (Tier ${envelope.recentChanges.sourceTier}, ${envelope.recentChanges.status}):
${summaries.recentChanges}

COMMUNITY INTEL (Tier ${envelope.communityIntel.sourceTier}, ${envelope.communityIntel.status}):
${summaries.communityIntel}

ENTRY REQUIREMENTS (Tier ${envelope.entryRequirements.sourceTier}, ${envelope.entryRequirements.status}):
${summaries.entryRequirements}

BORDER RUN (Tier ${envelope.borderRun.sourceTier}, ${envelope.borderRun.status}):
${summaries.borderRun}

Identify:
1. CONFIRMED: Claims supported by Tier 1-2 sources with no contradictions
2. CONTESTED: Claims where sources disagree (e.g., official says X, community says Y)
3. UNVERIFIED: Claims supported only by Tier 3-4 or from failed agents

Return ONLY valid JSON (no markdown fences):
{
  "confirmed": [
    {
      "topic": "<topic>",
      "description": "<what is confirmed>",
      "sources": ["<url>"],
      "resolution": null
    }
  ],
  "contested": [
    {
      "topic": "<topic>",
      "description": "<what is contested and why>",
      "sources": ["<url>"],
      "resolution": "<how this was resolved — Tier 1 wins>"
    }
  ],
  "unverified": [
    {
      "topic": "<topic>",
      "description": "<what could not be verified>",
      "sources": ["<url>"],
      "resolution": "<what user should do to verify>"
    }
  ],
  "overallConfidence": "<high|medium|low>"
}`;
}
