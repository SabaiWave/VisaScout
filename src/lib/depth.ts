export const BRIEF_DEPTHS = ['quick', 'standard', 'deep'] as const;
export type BriefDepth = typeof BRIEF_DEPTHS[number];

export const DEPTH_LABEL: Record<BriefDepth, string> = {
  quick:    'Scout',
  standard: 'Intel',
  deep:     'Dossier',
};

export const DEPTH_CTA: Record<BriefDepth, string> = {
  quick:    'Run Scout',
  standard: 'Run Intel',
  deep:     'Build Dossier',
};
