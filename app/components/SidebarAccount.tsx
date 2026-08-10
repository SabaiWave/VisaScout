'use client';

import { useUser } from '@clerk/nextjs';

function initials(first?: string | null, last?: string | null, email?: string): string {
  if (first && last) return (first[0] + last[0]).toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return '??';
}

export function SidebarAccount({ isAdmin }: { isAdmin?: boolean }) {
  const { user } = useUser();

  const email = user?.emailAddresses?.[0]?.emailAddress ?? '';
  const init = initials(user?.firstName, user?.lastName, email);

  return (
    <div style={{ borderTop: '1px solid var(--color-border)', padding: '16px 18px' }}>
      {/* Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 26, height: 26, flexShrink: 0,
          borderRadius: '50%',
          border: '1px solid var(--color-border-strong)',
          background: 'var(--color-bg-elevated)',
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
          letterSpacing: '0.04em', color: 'var(--color-text-secondary)',
        }}>
          {init}
        </div>
        <div style={{ minWidth: 0 }}>
          <span style={{
            display: 'block',
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.02em',
            color: 'var(--color-text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{email || '—'}</span>
          {isAdmin && (
            <span className="vs-badge vs-badge-outline" style={{ marginTop: 5, fontSize: 8, color: 'var(--color-secondary)' }}>
              ADMIN
            </span>
          )}
        </div>
      </div>

      {/* Env status */}
      <div style={{
        marginTop: 14, display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
        letterSpacing: '0.07em', textTransform: 'uppercase',
        color: 'var(--color-text-tertiary)',
      }}>
        <div style={{ width: 6, height: 6, background: 'var(--color-success)', flexShrink: 0 }} />
        <span>Operational</span>
      </div>
    </div>
  );
}
