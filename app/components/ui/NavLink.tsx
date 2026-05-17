import Link from 'next/link';
import type { ComponentProps } from 'react';

type NavLinkProps = ComponentProps<typeof Link>;

export function NavLink({ className = '', style, ...props }: NavLinkProps) {
  return (
    <Link
      className={`text-sm font-bold px-4 py-2 rounded-lg uppercase tracking-wider transition-opacity hover:opacity-70 ${className}`}
      style={{
        color: 'var(--color-text-secondary)',
        fontFamily: 'var(--font-mono)',
        textDecoration: 'none',
        ...style,
      }}
      {...props}
    />
  );
}
