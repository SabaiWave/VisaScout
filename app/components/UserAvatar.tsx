'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

export function UserAvatar() {
  const { user } = useUser();

  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const initial = (email.split('@')[0]?.[0] ?? 'A').toUpperCase();

  return (
    <Link
      href="/dashboard/account"
      aria-label="Account settings"
      title="Account settings"
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: 'var(--color-secondary-subtle)',
        border: '1px solid var(--color-border-strong)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.72rem',
        fontWeight: 700,
        color: 'var(--color-secondary-light)',
        textDecoration: 'none',
        flexShrink: 0,
      }}
    >
      {initial}
    </Link>
  );
}
