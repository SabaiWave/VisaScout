interface ChartCornerMarksProps {
  topLeft?: string;
  bottomRight?: string;
  /** Extra className merged onto the top-left mark — used to override its
   * `left` offset via a responsive CSS rule (e.g. clearing the app sidebar). */
  leftClassName?: string;
}

const DEFAULT_TOP_LEFT = "13°45'24\"N 100°31'12\"E · VS-CHART-2026-SEA-01";
const DEFAULT_BOTTOM_RIGHT = 'SOURCE: T1 VERIFIED · AGENTS 5/5';

// Fixed, page-wide coordinate-style chrome — the chart-instrument signature
// in every screen's corners. Desktop-only (hidden below lg, matches the
// sidebar/nav breakpoints so nothing competes for space on mobile).
export function ChartCornerMarks({
  topLeft = DEFAULT_TOP_LEFT,
  bottomRight = DEFAULT_BOTTOM_RIGHT,
  leftClassName,
}: ChartCornerMarksProps) {
  const markStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.55rem',
    letterSpacing: '0.1em',
    color: 'var(--color-text-tertiary)',
    lineHeight: 1.7,
  };
  return (
    <>
      <div
        aria-hidden
        className={`hidden lg:block fixed z-50 pointer-events-none${leftClassName ? ` ${leftClassName}` : ''}`}
        style={{ top: '68px', left: '20px', ...markStyle }}
      >
        {topLeft}
      </div>
      <div aria-hidden className="hidden lg:block fixed z-50 pointer-events-none text-right" style={{ bottom: '20px', right: '20px', ...markStyle }}>
        {bottomRight}
      </div>
    </>
  );
}
