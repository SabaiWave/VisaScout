'use client';

import { useAuth, SignInButton } from '@clerk/nextjs';
import { VisaScoutUserButton } from './VisaScoutUserButton';
import { Button } from '@/app/components/ui/Button';

export function HeaderAuth() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <div className="w-8 h-8" />;

  if (isSignedIn) {
    return <VisaScoutUserButton />;
  }

  return (
    <SignInButton mode="modal">
      <Button variant="secondary">Sign in</Button>
    </SignInButton>
  );
}
