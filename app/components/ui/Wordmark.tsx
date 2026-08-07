import Link from 'next/link';

interface WordmarkProps {
  className?: string;
  style?: React.CSSProperties;
  /** Render as a plain span instead of a self-linking <Link> — required when
   * an ancestor element is already a link (nested <a> is invalid HTML). */
  noLink?: boolean;
}

export function Wordmark({ className = '', style, noLink = false }: WordmarkProps) {
  const combinedClassName = `text-base font-bold uppercase tracking-widest whitespace-nowrap ${className}`;
  const combinedStyle: React.CSSProperties = { color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', textDecoration: 'none', ...style };

  if (noLink) {
    return (
      <span className={combinedClassName} style={combinedStyle}>
        VisaScout
      </span>
    );
  }

  return (
    <Link href="/" className={combinedClassName} style={combinedStyle}>
      VisaScout
    </Link>
  );
}
