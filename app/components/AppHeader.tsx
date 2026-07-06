'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Home, LayoutDashboard, Zap } from 'lucide-react';
import { Wordmark } from './ui/Wordmark';
import { NavLink } from './ui/NavLink';
import { NavDrawer, HamburgerButton, navDrawerSecondaryStyle, navDrawerPrimaryStyle } from './ui/MobileDrawer';
import { SidebarAccount } from './SidebarAccount';
import { VisaScoutUserButton } from './VisaScoutUserButton';

export function AppHeader() {
  const { isSignedIn, isLoaded } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b px-6 py-4"
        style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-muted)' }}
      >
        <div className="max-w-[1120px] mx-auto flex items-center justify-between">
          <Wordmark />

          {/* Desktop nav (md+) */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/dashboard">Dashboard</NavLink>
            {isLoaded && (isSignedIn
              ? <VisaScoutUserButton />
              : <Link href="/sign-in" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Sign in</Link>
            )}
          </div>

          {/* Mobile: hamburger only (below md) */}
          <div className="flex md:hidden">
            <HamburgerButton onClick={() => setOpen(true)} />
          </div>
        </div>
      </header>

      <NavDrawer open={open} onClose={() => setOpen(false)}>
        <Link href="/" onClick={() => setOpen(false)} style={navDrawerSecondaryStyle}>
          <Home size={16} aria-hidden /> Home
        </Link>
        <Link href="/dashboard" onClick={() => setOpen(false)} style={navDrawerSecondaryStyle}>
          <LayoutDashboard size={16} aria-hidden /> Dashboard
        </Link>
        <div style={{ borderTop: '1px solid var(--color-border-muted)', margin: '4px 0' }} />
        {isLoaded && (isSignedIn ? (
          <>
            <Link href="/app" onClick={() => setOpen(false)} style={navDrawerPrimaryStyle}>
              <Zap size={15} aria-hidden /> Generate Brief
            </Link>
            <div style={{ flex: 1 }} />
            <SidebarAccount />
          </>
        ) : (
          <Link href="/sign-in" onClick={() => setOpen(false)} style={navDrawerPrimaryStyle}>Sign in</Link>
        ))}
      </NavDrawer>
    </>
  );
}
