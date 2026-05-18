'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Wordmark } from './ui/Wordmark';
import { Button } from './ui/Button';
import { NavDrawer, HamburgerButton, navDrawerLinkStyle, navDrawerPrimaryStyle } from './ui/MobileDrawer';
import { SidebarAccount } from './SidebarAccount';
import { HeaderAuth } from './HeaderAuth';

export function BriefHeader() {
  const { isSignedIn, isLoaded } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav
        className="sticky top-0 z-50 border-b px-4 sm:px-6 py-3 sm:py-4"
        style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-muted)' }}
      >
        <div className="max-w-[1120px] mx-auto flex items-center justify-between">
          <Wordmark />

          {/* Desktop nav (md+) */}
          <div className="hidden md:flex items-center gap-2">
            <Button asChild>
              <Link href="/app">Generate Brief</Link>
            </Button>
            <HeaderAuth />
          </div>

          {/* Mobile: hamburger only (below md) */}
          <div className="flex md:hidden">
            <HamburgerButton onClick={() => setOpen(true)} />
          </div>
        </div>
      </nav>

      <NavDrawer open={open} onClose={() => setOpen(false)}>
        <Link href="/app" onClick={() => setOpen(false)} style={navDrawerPrimaryStyle}>Generate Brief</Link>
        {isLoaded && (isSignedIn ? (
          <>
            <div style={{ flex: 1 }} />
            <SidebarAccount />
          </>
        ) : (
          <Link href="/sign-in" onClick={() => setOpen(false)} style={navDrawerLinkStyle}>Sign in</Link>
        ))}
      </NavDrawer>
    </>
  );
}
