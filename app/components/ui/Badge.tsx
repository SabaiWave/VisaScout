const badgeBase: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  padding: '2px 8px',
  borderRadius: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
};

// ─── Confidence ──────────────────────────────────────────────────────────────

const confidenceMap = {
  high:   { background: 'rgba(34,197,94,0.15)',  color: '#22c55e' },
  medium: { background: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  low:    { background: 'rgba(239,68,68,0.15)',  color: '#ef4444' },
} as const;

export function ConfidenceBadge({
  level,
  prefixed = true,
}: {
  level: 'high' | 'medium' | 'low';
  prefixed?: boolean;
}) {
  return (
    <span style={{ ...badgeBase, ...confidenceMap[level] }}>
      {prefixed ? `CONF · ${level.toUpperCase()}` : level.toUpperCase()}
    </span>
  );
}

// ─── Depth ───────────────────────────────────────────────────────────────────

const depthMap = {
  quick:    { background: 'rgba(99,102,241,0.12)',  color: '#818cf8' },
  standard: { background: 'rgba(168,85,247,0.12)',  color: '#c084fc' },
  deep:     { background: 'rgba(245,158,11,0.12)',  color: '#fbbf24' },
} as const;

export function DepthBadge({ depth }: { depth: 'quick' | 'standard' | 'deep' }) {
  const style = depthMap[depth] ?? depthMap.quick;
  return <span style={{ ...badgeBase, ...style }}>{depth}</span>;
}

// ─── Tier ────────────────────────────────────────────────────────────────────

export function TierLabel({ tier }: { tier: 1 | 2 | 3 | 4 }) {
  const isTop = tier <= 1;
  return (
    <span
      style={{
        ...badgeBase,
        background: isTop ? 'var(--color-secondary-subtle)' : 'var(--color-bg-overlay)',
        color: isTop ? 'var(--color-secondary-light)' : 'var(--color-text-tertiary)',
        fontWeight: isTop ? 600 : 400,
      }}
    >
      Tier {tier}
    </span>
  );
}
