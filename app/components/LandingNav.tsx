'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Home, LayoutDashboard, HelpCircle, Zap, LogIn } from 'lucide-react';
import { NavDrawer, HamburgerButton, navDrawerSecondaryStyle, navDrawerPrimaryStyle } from './ui/MobileDrawer';
import { SidebarAccount } from './SidebarAccount';
import { BrandGlyph } from './ui/BrandGlyph';
import { navLinkStyle, ctaLinkStyle } from './ui/navLinkStyles';

// Shared with app/page.tsx sections so the vertical axis rule stays aligned.
export const LANDING_AXIS = '38%';

export function LandingNav() {
  const { isSignedIn, isLoaded } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav
        className="sticky top-0 z-50 grid"
        style={{
          gridTemplateColumns: `${LANDING_AXIS} 1fr`,
          height: '56px',
          background: 'rgba(6,12,18,0.94)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div
          className="flex items-center"
          style={{ paddingLeft: '24px', borderRight: '1px solid var(--color-border)' }}
        >
          <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
            <BrandGlyph />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.05rem',
                fontWeight: 900,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-text-primary)',
              }}
            >
              VisaScout
            </span>
          </Link>
        </div>

        <div className="flex items-center justify-between" style={{ padding: '0 24px 0 32px' }}>
          {/* Desktop nav (md+) */}
          <ul className="hidden md:flex items-center gap-7 list-none">
            <li><Link href="/how-it-works" style={navLinkStyle}>How It Works</Link></li>
            <li><Link href="/#brief" style={navLinkStyle}>Sample Brief</Link></li>
          </ul>

          <div className="hidden md:flex items-center gap-4 ml-auto">
            {!isLoaded ? (
              <div className="w-8 h-8" />
            ) : isSignedIn ? (
              <>
                <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
                <Link href="/app" style={ctaLinkStyle}>
                  Generate Brief
                </Link>
              </>
            ) : (
              <>
                <Link href="/sign-in" style={navLinkStyle}>Sign In</Link>
                <Link href="/sign-up" style={ctaLinkStyle}>
                  Get Brief
                </Link>
              </>
            )}
          </div>

          {/* Mobile: hamburger only (below md) */}
          <div className="flex md:hidden ml-auto">
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
