interface BrandGlyphProps {
  size?: number;
  color?: string;
  className?: string;
}

// Crosshair-in-circle mark — the chart-instrument signature next to the
// wordmark. Used by LandingNav, AppSidebar, and UtilityNav.
export function BrandGlyph({ size = 20, color = 'var(--color-amber)', className }: BrandGlyphProps) {
  return (
    <span
      aria-hidden
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <span style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: color }} />
      <span style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: color }} />
      <span style={{ position: 'absolute', inset: '3px', border: `1px solid ${color}`, borderRadius: '50%' }} />
    </span>
  );
}
