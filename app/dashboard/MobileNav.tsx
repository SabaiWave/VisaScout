'use client';

import { useState } from 'react';
import { Archive } from 'lucide-react';
import Link from 'next/link';
import { Wordmark } from '@/app/components/ui/Wordmark';
import { VisaScoutUserButton } from '@/app/components/VisaScoutUserButton';
import { NavDrawer, HamburgerButton, navDrawerLinkStyle } from '@/app/components/ui/MobileDrawer';
import { SidebarAccount } from './SidebarAccount';

export function MobileNav({ isAdmin, showDev }: { isAdmin: boolean; showDev: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav
        className="flex lg:hidden items-center justify-between"
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--color-border-muted)',
          minHeight: '56px',
        }}
      >
        <HamburgerButton onClick={() => setOpen(true)} />
        <Wordmark />
        <VisaScoutUserButton />
      </nav>

      <NavDrawer open={open} onClose={() => setOpen(false)}>
        <Link
          href="/dashboard"
          onClick={() => setOpen(false)}
          style={{ ...navDrawerLinkStyle, color: 'var(--color-secondary-light)', background: 'var(--color-secondary-subtle)', border: 'none' }}
        >
          <Archive size={14} style={{ marginRight: '8px', flexShrink: 0 }} />
          Dashboard
        </Link>
        {isAdmin && <Link href="/admin" onClick={() => setOpen(false)} style={navDrawerLinkStyle}>Admin</Link>}
        {showDev && <Link href="/dev" onClick={() => setOpen(false)} style={navDrawerLinkStyle}>Dev</Link>}
        <div style={{ flex: 1 }} />
        <SidebarAccount />
      </NavDrawer>
    </>
  );
}
