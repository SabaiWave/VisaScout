'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { Archive, Zap } from 'lucide-react';

export function VisaScoutUserButton() {
  const { user } = useUser();
  const pathname = usePathname();

  const onDashboard = pathname.startsWith('/dashboard');
  const onApp = pathname.startsWith('/app');

  return (
    <UserButton>
      <UserButton.MenuItems>
        {!onDashboard && (
          <UserButton.Link label="Dashboard" labelIcon={<Archive size={14} />} href="/dashboard" />
        )}
        {!onApp && (
          <UserButton.Link label="Generate Brief" labelIcon={<Zap size={14} />} href="/app" />
        )}
      </UserButton.MenuItems>
    </UserButton>
  );
}
