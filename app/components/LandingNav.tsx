'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { Wordmark } from './ui/Wordmark';
import { NavLink } from './ui/NavLink';
import { Button } from './ui/Button';
import { NavDrawer, HamburgerButton, navDrawerLinkStyle, navDrawerPrimaryStyle } from './ui/MobileDrawer';
import { SidebarAccount } from './SidebarAccount';
import { VisaScoutUserButton } from './VisaScoutUserButton';

const ADMIN_EMAIL = 'admin@sabaiwave.com';

export function LandingNav() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

  return (
    <>
      <nav
        className="sticky top-0 z-50 border-b px-6 py-4"
        style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-muted)' }}
      >
        <div className="max-w-[1120px] mx-auto flex items-center justify-between">
          <Wordmark />

          {/* Desktop nav (md+) */}
          <div className="hidden md:flex items-center gap-3">
            {!isLoaded ? (
              <div className="w-8 h-8" />
            ) : isSignedIn ? (
              <>
                {isAdmin && <NavLink href="/admin">Admin</NavLink>}
                <NavLink href="/dashboard">My Briefs</NavLink>
                <Button asChild>
                  <Link href="/app">Generate Brief</Link>
                </Button>
                <VisaScoutUserButton />
              </>
            ) : (
              <>
                <NavLink href="/sign-in">Sign in</NavLink>
                <Button asChild>
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile: hamburger only (below md) */}
          <div className="flex md:hidden">
            <HamburgerButton onClick={() => setOpen(true)} />
          </div>
        </div>
      </nav>

      <NavDrawer open={open} onClose={() => setOpen(false)}>
        {isLoaded && (isSignedIn ? (
          <>
            {isAdmin && (
              <Link href="/admin" onClick={() => setOpen(false)} style={navDrawerLinkStyle}>Admin</Link>
            )}
            <Link href="/dashboard" onClick={() => setOpen(false)} style={navDrawerLinkStyle}>My Briefs</Link>
            <Link href="/app" onClick={() => setOpen(false)} style={navDrawerPrimaryStyle}>Generate Brief</Link>
            <div style={{ flex: 1 }} />
            <SidebarAccount />
          </>
        ) : (
          <>
            <Link href="/sign-in" onClick={() => setOpen(false)} style={navDrawerLinkStyle}>Sign in</Link>
            <Link href="/sign-up" onClick={() => setOpen(false)} style={navDrawerPrimaryStyle}>Get Started</Link>
          </>
        ))}
      </NavDrawer>
    </>
  );
}
