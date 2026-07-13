'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useClerk } from '@clerk/nextjs';
import { Settings, LogOut } from 'lucide-react';

const navRowBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: 600,
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  color: 'var(--color-text-secondary)',
  transition: 'background 0.15s ease, color 0.15s ease',
};

function AccountLink({ icon, href, children }: { icon: React.ReactNode; href: string; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...navRowBase,
        background: hovered ? 'var(--color-secondary-subtle)' : 'transparent',
        color: hovered ? 'var(--color-secondary-light)' : 'var(--color-text-secondary)',
      }}
    >
      {icon}
      {children}
    </Link>
  );
}

function AccountButton({ icon, onClick, children }: { icon: React.ReactNode; onClick: () => void; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...navRowBase,
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        background: hovered ? 'var(--color-secondary-subtle)' : 'transparent',
        color: hovered ? 'var(--color-secondary-light)' : 'var(--color-text-secondary)',
      }}
    >
      {icon}
      {children}
    </button>
  );
}

export function SidebarAccount() {
  const { signOut } = useClerk();

  return (
    <div style={{ borderTop: '1px solid var(--color-border-muted)', paddingTop: '0.5rem' }}>
      <AccountLink icon={<Settings size={13} />} href="/dashboard/account">
        Account Settings
      </AccountLink>
      <AccountButton icon={<LogOut size={13} />} onClick={() => signOut({ redirectUrl: '/' })}>
        Sign Out
      </AccountButton>
    </div>
  );
}
