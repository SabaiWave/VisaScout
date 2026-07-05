'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Archive, ShieldCheck, Terminal, Zap } from 'lucide-react';
import { Wordmark } from './ui/Wordmark';
import { SidebarAccount } from './SidebarAccount';

interface AppSidebarProps {
  isAdmin: boolean;
  showDev: boolean;
}

export function AppSidebar({ isAdmin, showDev }: AppSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'MY BRIEFS', icon: Archive },
    { href: '/app', label: 'GENERATE BRIEF', icon: Zap },
    ...(isAdmin ? [{ href: '/admin', label: 'ADMIN', icon: ShieldCheck }] : []),
    ...(showDev ? [{ href: '/dev', label: 'DEV', icon: Terminal }] : []),
  ];

  return (
    <aside
      className="hidden lg:flex"
      style={{
        width: '240px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        background: 'var(--color-bg-subtle)',
        borderRight: '1px solid var(--color-border-muted)',
        flexDirection: 'column',
        padding: '2rem 1rem 1.5rem',
        gap: '0.25rem',
      }}
    >
      <Wordmark className="block px-2 mb-6" />

      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: active ? 'var(--color-secondary-light)' : 'var(--color-text-secondary)',
              background: active ? 'var(--color-secondary-subtle)' : 'transparent',
              textDecoration: 'none',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            <Icon size={14} />
            {label}
          </Link>
        );
      })}

      <div style={{ flex: 1 }} />
      <SidebarAccount />
    </aside>
  );
}
