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
      <button className="text-sm font-semibold px-4 py-2 rounded-lg border border-[#1e3a5f] text-[#1e3a5f] hover:bg-gray-50 transition-colors">
        Sign in
      </button>
    </SignInButton>
  );
}
