'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Home, LayoutDashboard, LogIn } from 'lucide-react';
import { BrandGlyph } from './ui/BrandGlyph';
import { Wordmark } from './ui/Wordmark';
import { navLinkStyle, ctaLinkStyle } from './ui/navLinkStyles';
import { NavDrawer, HamburgerButton, navDrawerSecondaryStyle, navDrawerPrimaryStyle } from './ui/MobileDrawer';

interface UtilityNavProps {
  /** Matches the page's own <main> max-width so the nav's inner row aligns
   * with the content below it. */
  maxWidth?: string;
}

// Landing-nav-derived top bar for legal/utility pages (How It Works, Terms,
// Privacy, Contact) — same glyph + auth-aware links as LandingNav, minus the
// landing-specific nav links and the asymmetric axis-grid (these pages stay
// single-column, centered).
export function UtilityNav({ maxWidth = '860px' }: UtilityNavProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav
        className="relative z-10 border-b px-6 py-4"
        style={{ borderColor: 'var(--color-border-muted)', background: 'rgba(6,12,18,0.94)', backdropFilter: 'blur(10px)' }}
      >
        <div className="mx-auto flex items-center justify-between" style={{ maxWidth }}>
          <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
            <BrandGlyph size={18} />
            <Wordmark noLink />
          </Link>

          <div className="hidden md:flex items-center gap-4">
            {!isLoaded ? (
              <div className="w-8 h-8" />
            ) : isSignedIn ? (
              <>
                <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
                <Link href="/app" style={ctaLinkStyle}>Generate Brief</Link>
              </>
            ) : (
              <>
                <Link href="/sign-in" style={navLinkStyle}>Sign In</Link>
                <Link href="/sign-up" style={ctaLinkStyle}>Get Brief</Link>
              </>
            )}
          </div>

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
            <div style={{ borderTop: '1px solid var(--color-border-muted)', margin: '4px 0' }} />
            <Link href="/app" onClick={() => setOpen(false)} style={navDrawerPrimaryStyle}>
              Generate Brief
            </Link>
          </>
        ) : (
          <>
            <Link href="/" onClick={() => setOpen(false)} style={navDrawerSecondaryStyle}>
              <Home size={16} aria-hidden /> Home
            </Link>
            <Link href="/sign-in" onClick={() => setOpen(false)} style={{ ...navDrawerSecondaryStyle, justifyContent: 'center', gap: '8px' }}>
              <LogIn size={15} aria-hidden /> Sign In
            </Link>
            <Link href="/sign-up" onClick={() => setOpen(false)} style={navDrawerPrimaryStyle}>
              Get Started
            </Link>
          </>
        ))}
      </NavDrawer>
    </>
  );
}
