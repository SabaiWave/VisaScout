// Pure constants — no 'use client'. Shared by AgentsDeployedScreen (client)
// and BriefDocument (renders server-side via react-dom/server for PDF).
// Keeping this client-free breaks the client-boundary chain that BriefDocument
// must not cross.

export const AGENT_DISPLAY_ORDER = [
  'officialPolicy',
  'recentChanges',
  'communityIntel',
  'entryRequirements',
  'borderRun',
  'conflictResolver',
] as const;

export type AgentKey = (typeof AGENT_DISPLAY_ORDER)[number];

export const AGENT_DISPLAY_LABELS: Record<AgentKey, string> = {
  officialPolicy:    'Official Policy',
  recentChanges:     'Recent Changes',
  communityIntel:    'Community Intel',
  entryRequirements: 'Entry Requirements',
  borderRun:         'Border Run',
  conflictResolver:  'Conflict Resolver',
};
