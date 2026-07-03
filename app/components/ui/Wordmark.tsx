import Link from 'next/link';

interface WordmarkProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Wordmark({ className = '', style }: WordmarkProps) {
  return (
    <Link
      href="/"
      className={`text-base font-bold uppercase tracking-widest whitespace-nowrap ${className}`}
      style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', textDecoration: 'none', ...style }}
    >
      VisaScout
    </Link>
  );
}
