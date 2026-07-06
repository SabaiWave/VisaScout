import { DEPTH_LABEL, type BriefDepth } from '@/src/lib/depth';

interface BriefMetaProps {
  depth: string;
  generatedAt: string;
  degraded?: boolean;
  center?: boolean;
  className?: string;
}

export function BriefMeta({ depth, generatedAt, degraded, center, className = '' }: BriefMetaProps) {
  const d = new Date(generatedAt);
  const date = d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false,
  });

  return (
    <p
      className={`text-xs ${center ? 'text-center' : ''} ${className}`}
      style={{
        color: 'var(--color-text-tertiary)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {DEPTH_LABEL[depth as BriefDepth] ?? depth} depth · Generated {date} · {time} UTC
      {degraded && <span style={{ color: 'var(--color-amber)' }}> · degraded output</span>}
    </p>
  );
}
