'use client';

import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { VisaScoutUserButton } from './VisaScoutUserButton';
import { Wordmark } from './ui/Wordmark';
import { NavLink } from './ui/NavLink';
import { Button } from './ui/Button';

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
        <Wordmark />

        <div className="flex items-center gap-3">
          {!isLoaded ? (
            <div className="w-8 h-8" />
          ) : isSignedIn ? (
            <>
              {isAdmin && (
                <NavLink href="/admin">Admin</NavLink>
              )}
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
      </div>
    </nav>
  );
}
