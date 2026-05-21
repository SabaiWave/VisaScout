'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { Wordmark } from './ui/Wordmark';
import { NavLink } from './ui/NavLink';
import { NavDrawer, HamburgerButton, navDrawerLinkStyle, navDrawerPrimaryStyle } from './ui/MobileDrawer';
import { SidebarAccount } from './SidebarAccount';
import { VisaScoutUserButton } from './VisaScoutUserButton';

export function AppHeader() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  const isAdmin = user?.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID;
  const showDev = isAdmin && process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';

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
            <NavLink href="/dashboard">My Briefs</NavLink>
            {isAdmin && <NavLink href="/admin">Admin</NavLink>}
            {showDev && <NavLink href="/dev">Dev</NavLink>}
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
        <Link href="/" onClick={() => setOpen(false)} style={navDrawerLinkStyle}>Home</Link>
        <Link href="/dashboard" onClick={() => setOpen(false)} style={navDrawerLinkStyle}>My Briefs</Link>
        {isAdmin && <Link href="/admin" onClick={() => setOpen(false)} style={navDrawerLinkStyle}>Admin</Link>}
        {showDev && <Link href="/dev" onClick={() => setOpen(false)} style={navDrawerLinkStyle}>Dev</Link>}
        {isLoaded && (isSignedIn ? (
          <>
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
