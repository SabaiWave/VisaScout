import type { AgentResultEnvelope, ConflictReport } from '../types/index.js';

export function buildSynthesisPrompt(
  envelope: AgentResultEnvelope,
  conflictReport: ConflictReport,
  degradedContext: string
): string {
  return `You are a visa intelligence analyst. Synthesize all agent outputs into a comprehensive, actionable visa intelligence brief.

TRAVELER SITUATION:
${envelope.visaRequest.parsedSummary}

Nationality: ${envelope.visaRequest.normalizedNationality}
Destination: ${envelope.visaRequest.normalizedDestination}
Visa type of interest: ${envelope.visaRequest.visaType || 'not specified'}
Intended duration: ${envelope.visaRequest.intendedDuration || 'unknown'}
Entry/exit pattern: ${envelope.visaRequest.entryExitPattern || 'unknown'}
Income source: ${envelope.visaRequest.incomeSource || 'unknown'}

CONFLICT REPORT:
${JSON.stringify(conflictReport, null, 2)}

OFFICIAL POLICY (${envelope.officialPolicy.status}):
${envelope.officialPolicy.status === 'success' ? JSON.stringify(envelope.officialPolicy.data, null, 2) : 'FAILED'}

RECENT CHANGES (${envelope.recentChanges.status}):
${envelope.recentChanges.status === 'success' ? JSON.stringify(envelope.recentChanges.data, null, 2) : 'FAILED'}

COMMUNITY INTEL (${envelope.communityIntel.status}):
${envelope.communityIntel.status === 'success' ? JSON.stringify(envelope.communityIntel.data, null, 2) : 'FAILED'}

ENTRY REQUIREMENTS (${envelope.entryRequirements.status}):
${envelope.entryRequirements.status === 'success' ? JSON.stringify(envelope.entryRequirements.data, null, 2) : 'FAILED'}

BORDER RUN (${envelope.borderRun.status}):
${envelope.borderRun.status === 'success' ? JSON.stringify(envelope.borderRun.data, null, 2) : 'FAILED'}

${degradedContext ? `DATA GAPS (from failed agents):\n${degradedContext}` : ''}

SYNTHESIS RULES:
- Recommended action must be specific, actionable, and include a deadline if applicable
- Visa options ranked by fit for THIS traveler's specific situation
- Confidence scores must be honest — do not uniformly set to "high"
- Every claim in source citations must link to its actual source URL
- If an agent failed, include the specific gap message in the brief
- Contingency must address both denied entry AND overstay scenarios
- Disclaimer MUST be included exactly as: "This report aggregates publicly available information. Verify all visa requirements with official sources before travel. Not legal advice."

Return ONLY valid JSON (no markdown fences):
{
  "parsedSituation": "<echo back what you understood about the traveler's situation>",
  "visaOptions": [
    {
      "name": "<visa type name>",
      "suitability": "<best|good|acceptable>",
      "maxStay": "<max stay duration>",
      "summary": "<one sentence summary>",
      "pros": ["<pro>"],
      "cons": ["<con>"]
    }
  ],
  "recommendedAction": {
    "action": "<specific action the traveler should take>",
    "deadline": "<deadline if applicable, null otherwise>",
    "rationale": "<why this is recommended>",
    "urgency": "<high|medium|low>"
  },
  "entryRequirements": {
    "documents": ["<document>"],
    "proofOfFunds": "<amount or null>",
    "onwardTicket": <true|false>,
    "health": ["<requirement>"],
    "notes": ["<important note>"]
  },
  "borderRunAnalysis": {
    "eligible": <true|false>,
    "limitsPerYear": "<limit or null>",
    "recommendedCrossings": ["<crossing>"],
    "enforcementPosture": "<assessment>",
    "warnings": ["<warning>"]
  },
  "recentChanges": {
    "hasChanges": <true|false>,
    "items": ["<change description>"],
    "watchItems": ["<item to monitor>"]
  },
  "conflictReport": <the conflict report object passed in>,
  "confidenceScore": {
    "overall": "<high|medium|low>",
    "perSection": {
      "officialPolicy": "<high|medium|low>",
      "recentChanges": "<high|medium|low>",
      "communityIntel": "<high|medium|low>",
      "entryRequirements": "<high|medium|low>",
      "borderRun": "<high|medium|low>"
    },
    "sourceCitations": [
      {
        "claim": "<specific claim>",
        "url": "<source url>",
        "tier": <1|2|3|4>,
        "publishedDate": "<date or null>"
      }
    ]
  },
  "contingency": {
    "deniedEntrySteps": ["<step to take if denied entry>"],
    "overstayScenario": "<what happens and what to do if overstay occurs>",
    "emergencyContacts": ["<relevant embassy or hotline>"]
  },
  "disclaimer": "This report aggregates publicly available information. Verify all visa requirements with official sources before travel. Not legal advice."
}`;
}
