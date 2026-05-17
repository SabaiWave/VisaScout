import Link from 'next/link';

interface WordmarkProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Wordmark({ className = '', style }: WordmarkProps) {
  return (
    <Link
      href="/"
      className={`text-base font-bold uppercase tracking-widest ${className}`}
      style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', textDecoration: 'none', ...style }}
    >
      <span style={{ color: 'var(--color-secondary)' }}>//</span>{' '}VisaScout
    </Link>
  );
}
