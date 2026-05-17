'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { Archive, Zap, LayoutDashboard } from 'lucide-react';

const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID ?? '';

export function VisaScoutUserButton() {
  const { user } = useUser();
  const pathname = usePathname();

  const isAdmin = !!ADMIN_USER_ID && user?.id === ADMIN_USER_ID;
  const onDashboard = pathname.startsWith('/dashboard');
  const onApp = pathname.startsWith('/app');
  const onAdmin = pathname.startsWith('/admin');

  return (
    <UserButton>
      <UserButton.MenuItems>
        {!onDashboard && (
          <UserButton.Link label="My Briefs" labelIcon={<Archive size={14} />} href="/dashboard" />
        )}
        {!onApp && (
          <UserButton.Link label="Generate Brief" labelIcon={<Zap size={14} />} href="/app" />
        )}
        {isAdmin && !onAdmin && (
          <UserButton.Link label="Admin Dashboard" labelIcon={<LayoutDashboard size={14} />} href="/admin" />
        )}
      </UserButton.MenuItems>
    </UserButton>
  );
}
