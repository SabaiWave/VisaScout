import type React from 'react';

export const C = {
  stage:      '#060c12',
  groundUp:   '#0a1520',
  groundSub:  '#0e1c28',
  rim:        '#1e3040',
  rimSoft:    '#16242f',
  accent:     '#c8780a',
  accentRim:  'rgba(200,120,10,0.34)',
  ink:        '#dceaf6',
  ink2:       '#8fb2c8',
  ink3:       '#5f849e',
  ink4:       '#54809d',
} as const;

export const MONO   = "'JetBrains Mono', monospace";
export const BARLOW = "'Barlow Condensed', sans-serif";

export const SK: React.CSSProperties = {
  background: `linear-gradient(90deg, ${C.groundSub} 25%, ${C.rimSoft} 50%, ${C.groundSub} 75%)`,
  backgroundSize: '200% 100%',
  animation: 'bpb-shimmer 1.8s infinite',
  borderRadius: 0,
  display: 'block',
};

export const AGENTS = [
  { label: 'OFFICIAL POLICY' },
  { label: 'RECENT CHANGES' },
  { label: 'ENTRY REQUIREMENTS' },
  { label: 'COMMUNITY INTEL' },
  { label: 'BORDER RUN' },
];

export const SECTIONS = [
  { n: '01', t: 'Parsed Situation',    lines: 2 },
  { n: '02', t: 'Recommended Action',  lines: 3 },
  { n: '03', t: 'Visa Options',        lines: 3 },
  { n: '04', t: 'Entry Requirements',  lines: 2 },
  { n: '05', t: 'Border Run Analysis', lines: 2 },
  { n: '06', t: 'Recent Changes',      lines: 2 },
  { n: '07', t: 'Conflict Report',     lines: 2 },
  { n: '08', t: 'Source Citations',    lines: 1 },
  { n: '09', t: 'Contingency',         lines: 2 },
];
