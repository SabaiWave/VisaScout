import type React from 'react';

export const C = {
  stage:      'var(--color-bg-base)',
  groundUp:   'var(--color-bg-elevated)',
  groundSub:  'var(--color-bg-overlay)',
  rim:        'var(--color-border)',
  rimSoft:    'var(--color-border-muted)',
  accent:     'var(--color-secondary)',
  accentRim:  'rgba(var(--color-secondary-rgb),0.34)',
  ink:        'var(--color-text-primary)',
  ink2:       'var(--color-text-secondary)',
  ink3:       'var(--color-text-tertiary)',
  // Brief-specific: slightly darker than --color-text-tertiary (#5f849e), no global token equivalent
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
