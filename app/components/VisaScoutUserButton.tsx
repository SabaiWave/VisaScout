'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { Archive, Zap, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

export function VisaScoutUserButton() {
  const { user } = useUser();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme !== 'light';
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
        <UserButton.Action
          label={isDark ? 'Switch to Light' : 'Switch to Dark'}
          labelIcon={isDark ? <Sun size={14} /> : <Moon size={14} />}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}
