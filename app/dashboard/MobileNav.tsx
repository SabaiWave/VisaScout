'use client';

import { useState } from 'react';
import { Wordmark } from '@/app/components/ui/Wordmark';
import { VisaScoutUserButton } from '@/app/components/VisaScoutUserButton';
import { MobileDrawer, HamburgerButton } from '@/app/components/ui/MobileDrawer';

export function MobileNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav
        className="flex lg:hidden items-center justify-between"
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--color-border-muted)',
          minHeight: '56px',
        }}
      >
        <HamburgerButton onClick={() => setDrawerOpen(true)} />
        <Wordmark />
        <VisaScoutUserButton />
      </nav>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
