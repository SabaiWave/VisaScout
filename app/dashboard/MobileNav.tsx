'use client';

import { useState } from 'react';
import { Archive, Zap } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Wordmark } from '@/app/components/ui/Wordmark';
import { VisaScoutUserButton } from '@/app/components/VisaScoutUserButton';
import { NavDrawer, HamburgerButton, navDrawerLinkStyle } from '@/app/components/ui/MobileDrawer';
import { SidebarAccount } from './SidebarAccount';

export function MobileNav({ isAdmin, showDev, isSignedIn = true }: { isAdmin: boolean; showDev: boolean; isSignedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
        {isSignedIn ? (
          <VisaScoutUserButton />
        ) : (
          <Link
            href="/sign-in"
            style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-secondary-light)', textDecoration: 'none' }}
          >
            Sign In
          </Link>
        )}
      </nav>

      <NavDrawer open={open} onClose={() => setOpen(false)} side="left">
        {isSignedIn && (
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            style={{ ...navDrawerLinkStyle, ...(pathname.startsWith('/dashboard') ? { color: 'var(--color-secondary-light)', background: 'var(--color-secondary-subtle)', border: 'none' } : {}) }}
          >
            <Archive size={14} style={{ marginRight: '8px', flexShrink: 0 }} />
            My Briefs
          </Link>
        )}
        <Link
          href="/app"
          onClick={() => setOpen(false)}
          style={{ ...navDrawerLinkStyle, ...(pathname.startsWith('/app') ? { color: 'var(--color-secondary-light)', background: 'var(--color-secondary-subtle)', border: 'none' } : {}) }}
        >
          <Zap size={14} style={{ marginRight: '8px', flexShrink: 0 }} />
          Generate Brief
        </Link>
        {isAdmin && <Link href="/admin" onClick={() => setOpen(false)} style={navDrawerLinkStyle}>Admin</Link>}
        {showDev && <Link href="/dev" onClick={() => setOpen(false)} style={navDrawerLinkStyle}>Dev</Link>}
        <div style={{ flex: 1 }} />
        {isSignedIn ? (
          <SidebarAccount />
        ) : (
          <div style={{ borderTop: '1px solid var(--color-border-muted)', padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Link href="/sign-in" onClick={() => setOpen(false)} style={{ ...navDrawerLinkStyle, justifyContent: 'center' }}>Sign In</Link>
            <Link href="/sign-up" onClick={() => setOpen(false)} style={{ ...navDrawerLinkStyle, justifyContent: 'center', color: 'var(--color-secondary-light)', background: 'var(--color-secondary-subtle)', border: 'none' }}>Get Started</Link>
          </div>
        )}
      </NavDrawer>
    </>
  );
}
