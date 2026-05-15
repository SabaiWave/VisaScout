'use client';

import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';

export function HeaderAuth() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <div className="w-8 h-8" />;

  if (isSignedIn) {
    return <UserButton />;
  }

  return (
    <SignInButton mode="modal">
      <button
        className="text-sm font-semibold px-4 py-2 rounded-lg border transition-colors"
        style={{
          borderColor: 'var(--color-border-strong)',
          color: 'var(--color-text-primary)',
          background: 'transparent',
        }}
      >
        Sign in
      </button>
    </SignInButton>
  );
}
