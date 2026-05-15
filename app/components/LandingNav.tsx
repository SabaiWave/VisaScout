'use client';

import Link from 'next/link';
import { useAuth, UserButton } from '@clerk/nextjs';

export function LandingNav() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <nav
      className="sticky top-0 z-50 border-b px-6 py-4"
      style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-muted)' }}
    >
      <div className="max-w-[1120px] mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-bold uppercase tracking-widest"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
        >
          <span style={{ color: 'var(--color-secondary)' }}>//</span>{' '}VisaScout
        </Link>

        <div className="flex items-center gap-3">
          {!isLoaded ? (
            <div className="w-8 h-8" />
          ) : isSignedIn ? (
            <>
              <Link
                href="/app"
                className="text-xs font-bold px-4 py-2 rounded-lg uppercase tracking-wider transition-colors"
                style={{ background: 'var(--color-secondary)', color: '#fff', fontFamily: 'var(--font-mono)' }}
              >
                Generate Brief
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-xs font-bold px-4 py-2 rounded-lg uppercase tracking-wider transition-colors"
                style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="text-xs font-bold px-4 py-2 rounded-lg uppercase tracking-wider transition-colors"
                style={{ background: 'var(--color-secondary)', color: '#fff', fontFamily: 'var(--font-mono)' }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
