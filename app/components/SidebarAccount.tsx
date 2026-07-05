'use client';

import { useUser } from '@clerk/nextjs';
import { VisaScoutUserButton } from '@/app/components/VisaScoutUserButton';

export function SidebarAccount() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const displayName = email ? email.split('@')[0] : 'My Account';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.75rem 1rem',
        borderTop: '1px solid var(--color-border-muted)',
        minWidth: 0,
      }}
    >
      <VisaScoutUserButton />
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.72rem',
        fontWeight: 500,
        color: 'var(--color-text-tertiary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
        flex: 1,
      }}>
        {displayName}
      </span>
    </div>
  );
}
