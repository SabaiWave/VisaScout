import Link from 'next/link';
import { ComponentProps } from 'react';

export function FooterLink({ className = '', style, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={`text-sm transition-opacity hover:opacity-70 ${className}`}
      style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em', ...style }}
      {...props}
    />
  );
}
