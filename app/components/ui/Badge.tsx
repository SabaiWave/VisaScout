import { DEPTH_LABEL } from '@/src/lib/depth';

// font/spacing/shape via global .vs-badge — only color/bg vary per variant

// ─── Confidence ──────────────────────────────────────────────────────────────

const confidenceLabelMap = {
  high:   'WELL SOURCED',
  medium: 'VERIFY KEY DETAILS',
  low:    'VERIFY BEFORE TRAVEL',
} as const;

const confidenceMap = {
  high:   { background: 'rgba(34,197,94,0.15)',  color: 'var(--color-confidence-high)' },
  medium: { background: 'rgba(245,158,11,0.15)', color: 'var(--color-confidence-medium)' },
  low:    { background: 'rgba(239,68,68,0.15)',  color: 'var(--color-confidence-low)' },
} as const;

export function ConfidenceBadge({
  level,
  prefixed = true,
}: {
  level: 'high' | 'medium' | 'low';
  prefixed?: boolean;
}) {
  return (
    <span className="vs-badge" style={{ flexShrink: 0, ...confidenceMap[level] }}>
      {prefixed ? confidenceLabelMap[level] : level.toUpperCase()}
    </span>
  );
}

// ─── Depth ───────────────────────────────────────────────────────────────────

const depthMap = {
  quick:    { background: 'rgba(var(--color-depth-quick-rgb),0.12)',    color: 'var(--color-depth-quick)' },
  standard: { background: 'rgba(var(--color-depth-standard-rgb),0.12)', color: 'var(--color-depth-standard)' },
  deep:     { background: 'rgba(var(--color-depth-deep-rgb),0.12)',     color: 'var(--color-depth-deep)' },
} as const;

export function DepthBadge({ depth }: { depth: 'quick' | 'standard' | 'deep' }) {
  const style = depthMap[depth] ?? depthMap.quick;
  return <span className="vs-badge" style={{ flexShrink: 0, ...style }}>{DEPTH_LABEL[depth]}</span>;
}

// ─── Tier ────────────────────────────────────────────────────────────────────

export function TierLabel({ tier }: { tier: 1 | 2 | 3 | 4 }) {
  return (
    <span
      className="vs-badge"
      style={{
        flexShrink: 0,
        background: 'var(--color-bg-overlay)',
        color: `var(--color-tier-${tier})`,
        fontWeight: 600,
      }}
    >
      T{tier}
    </span>
  );
}
