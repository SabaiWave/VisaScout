import type { VisaBrief } from '../types/index';

/**
 * Redacts brief sections gated behind Standard/Deep depth. Applied once, at
 * synthesis time, so gated content never reaches the client or the stored
 * `brief_markdown` for Quick-depth briefs — not just hidden at render.
 *
 * Confidence scoring runs on the full envelope BEFORE this is called
 * (see synthesizeBrief) — redaction only strips the detail-bearing fields
 * from the outgoing payload, it never affects quality signals.
 *
 * Mirrors the sections gated in app/components/BriefDocument.tsx
 * (BorderRunSection, ConflictSection detail, ContingencySection). Keep
 * both in sync if the gated section list ever changes.
 */
export function redactForDepth(brief: VisaBrief, depth: 'quick' | 'standard' | 'deep'): VisaBrief {
  if (depth !== 'quick') return brief;

  return {
    ...brief,
    borderRunAnalysis: {
      eligible: false,
      recommendedCrossings: [],
      enforcementPosture: '',
      warnings: [],
    },
    contingency: {
      deniedEntrySteps: [],
      overstayScenario: '',
      emergencyContacts: [],
    },
    conflictReport: {
      ...brief.conflictReport,
      confirmed: [],
      contested: [],
      unverified: [],
    },
  };
}
