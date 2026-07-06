'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Home, LayoutDashboard, HelpCircle, Zap } from 'lucide-react';
import { Wordmark } from './ui/Wordmark';
import { NavLink } from './ui/NavLink';
import { Button } from './ui/Button';
import { NavDrawer, HamburgerButton, navDrawerSecondaryStyle, navDrawerLinkStyle, navDrawerPrimaryStyle } from './ui/MobileDrawer';
import { SidebarAccount } from './SidebarAccount';
import { VisaScoutUserButton } from './VisaScoutUserButton';

export function LandingNav() {
  const { isSignedIn, isLoaded } = useAuth();
  const [open, setOpen] = useState(false);

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
                <NavLink href="/dashboard">Dashboard</NavLink>
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
            <Link href="/" onClick={() => setOpen(false)} style={navDrawerSecondaryStyle}>
              <Home size={16} aria-hidden /> Home
            </Link>
            <Link href="/dashboard" onClick={() => setOpen(false)} style={navDrawerSecondaryStyle}>
              <LayoutDashboard size={16} aria-hidden /> Dashboard
            </Link>
            <Link href="/how-it-works" onClick={() => setOpen(false)} style={navDrawerSecondaryStyle}>
              <HelpCircle size={16} aria-hidden /> How It Works
            </Link>
            <div style={{ borderTop: '1px solid var(--color-border-muted)', margin: '4px 0' }} />
            <Link href="/app" onClick={() => setOpen(false)} style={navDrawerPrimaryStyle}>
              <Zap size={15} aria-hidden /> Generate Brief
            </Link>
            <div style={{ flex: 1 }} />
            <SidebarAccount />
          </>
        ) : (
          <>
            <Link href="/" onClick={() => setOpen(false)} style={navDrawerSecondaryStyle}>
              <Home size={16} aria-hidden /> Home
            </Link>
            <Link href="/how-it-works" onClick={() => setOpen(false)} style={navDrawerSecondaryStyle}>
              <HelpCircle size={16} aria-hidden /> How It Works
            </Link>
            <div style={{ borderTop: '1px solid var(--color-border-muted)', margin: '4px 0' }} />
            <Link href="/sign-in" onClick={() => setOpen(false)} style={navDrawerLinkStyle}>Sign in</Link>
            <Link href="/sign-up" onClick={() => setOpen(false)} style={navDrawerPrimaryStyle}>Get Started</Link>
          </>
        ))}
      </NavDrawer>
    </>
  );
}
