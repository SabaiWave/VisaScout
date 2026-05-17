'use client';

import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { VisaScoutUserButton } from './VisaScoutUserButton';

const ADMIN_EMAIL = 'admin@sabaiwave.com';

export function LandingNav() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  const isAdmin = user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;

  return (
    <nav
      className="sticky top-0 z-50 border-b px-6 py-4"
      style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-muted)' }}
    >
      <div className="max-w-[1120px] mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="text-base font-bold uppercase tracking-widest"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
        >
          <span style={{ color: 'var(--color-secondary)' }}>//</span>{' '}VisaScout
        </Link>

        <div className="flex items-center gap-3">
          {!isLoaded ? (
            <div className="w-8 h-8" />
          ) : isSignedIn ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm font-bold px-4 py-2 rounded-lg uppercase tracking-wider transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}
                >
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className="text-sm font-bold px-4 py-2 rounded-lg uppercase tracking-wider transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}
              >
                My Briefs
              </Link>
              <Link
                href="/app"
                className="text-sm font-bold px-4 py-2 rounded-lg uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ background: 'var(--color-secondary)', color: '#fff', fontFamily: 'var(--font-mono)' }}
              >
                Generate Brief
              </Link>
              <VisaScoutUserButton />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-bold px-4 py-2 rounded-lg uppercase tracking-wider transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="text-sm font-bold px-4 py-2 rounded-lg uppercase tracking-wider transition-opacity hover:opacity-80"
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
