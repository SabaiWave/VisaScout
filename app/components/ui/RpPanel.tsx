interface RpPanelProps {
  title: string;
  meta?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function RpPanel({ title, meta, children, footer, className }: RpPanelProps) {
  return (
    <div
      className={className}
      style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)' }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 11px',
          background: 'var(--color-bg-overlay)',
          borderBottom: '1px solid var(--color-border)',
          fontSize: '0.625rem', letterSpacing: '0.22em',
          textTransform: 'uppercase', color: 'var(--color-secondary)',
          whiteSpace: 'nowrap',
        }}
      >
        <span>{title}</span>
        <i style={{ flex: 1, height: 1, minWidth: 10, display: 'block', background: 'linear-gradient(to right, rgba(var(--color-secondary-rgb),0.34), transparent)' }} aria-hidden="true" />
        {meta && (
          <span style={{ color: 'var(--color-text-tertiary)', letterSpacing: '0.14em', fontSize: '0.625rem' }}>
            {meta}
          </span>
        )}
      </div>
      <div style={{ padding: '12px 11px' }}>
        {children}
      </div>
      {footer && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 11px',
            borderTop: '1px solid var(--color-border-muted)',
            fontSize: '0.625rem', letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--color-text-tertiary)',
            lineHeight: 1.8,
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
