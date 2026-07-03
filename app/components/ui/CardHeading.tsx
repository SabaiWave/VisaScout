interface CardHeadingProps {
  children: React.ReactNode;
  badge?: React.ReactNode;
}

export function CardHeading({ children, badge }: CardHeadingProps) {
  return (
    <span
      className="font-bold text-base uppercase tracking-wide"
      style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
    >
      {children}
      {badge && <span className="ml-2 text-sm normal-case tracking-normal">{badge}</span>}
    </span>
  );
}
