'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { BrandGlyph } from './ui/BrandGlyph';
import { Wordmark } from './ui/Wordmark';
import { SidebarAccount } from './SidebarAccount';

interface AppSidebarProps {
  isAdmin: boolean;
  showDev: boolean;
  isSignedIn?: boolean;
}

const NAV_ITEM: React.CSSProperties = {
  position: 'relative',
  display: 'block',
  padding: '11px 18px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-mono)',
  textDecoration: 'none',
  color: 'var(--color-text-tertiary)',
  background: 'transparent',
  borderLeft: '2px solid transparent',
  cursor: 'pointer',
  width: '100%',
  textAlign: 'left' as const,
};

const NAV_ITEM_ACTIVE: React.CSSProperties = {
  ...NAV_ITEM,
  color: 'var(--color-secondary)',
  background: 'var(--color-bg-elevated)',
  borderLeft: '2px solid var(--color-secondary)',
};

export function AppSidebar({ isAdmin, showDev, isSignedIn = true }: AppSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();

  const userItems = [
    ...(isSignedIn ? [{ href: '/dashboard', label: 'MY BRIEFS' }] : []),
    { href: '/app', label: 'GENERATE BRIEF' },
  ];

  const systemItems = [
    ...(isAdmin ? [{ href: '/admin', label: 'ADMIN' }] : []),
    ...(showDev ? [{ href: '/dev', label: 'DEV' }] : []),
  ];

  function NavLink({ href, label }: { href: string; label: string }) {
    const active = pathname === href || (href !== '/app' && pathname.startsWith(href + '/'));
    return (
      <Link
        href={href}
        style={active ? NAV_ITEM_ACTIVE : NAV_ITEM}
        onMouseOver={e => {
          if (!active) {
            e.currentTarget.style.color = 'var(--color-text-secondary)';
            e.currentTarget.style.background = 'var(--color-bg-elevated)';
          }
        }}
        onMouseOut={e => {
          if (!active) {
            e.currentTarget.style.color = 'var(--color-text-tertiary)';
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        {label}
      </Link>
    );
  }

  function NavButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
      <button
        onClick={onClick}
        style={{ ...NAV_ITEM, border: 'none' }}
        onMouseOver={e => {
          e.currentTarget.style.color = 'var(--color-text-secondary)';
          e.currentTarget.style.background = 'var(--color-bg-elevated)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.color = 'var(--color-text-tertiary)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <aside
      className="hidden lg:flex"
      style={{
        width: '200px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        background: 'var(--color-bg-subtle)',
        borderRight: '1px solid var(--color-border)',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 18px 18px', borderBottom: '1px solid var(--color-border)' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BrandGlyph size={16} />
          <Wordmark noLink />
        </Link>
      </div>

      {/* Nav */}
      <div style={{ padding: '14px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Operations group */}
        <div>
          <div style={{
            padding: '10px 18px 8px',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-tertiary)', opacity: 0.7,
          }}>
            Operations
          </div>
          {userItems.map(item => <NavLink key={item.href} {...item} />)}
        </div>

        {/* System group */}
        {systemItems.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{
              padding: '10px 18px 8px',
              fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-tertiary)', opacity: 0.7,
            }}>
              System
            </div>
            {systemItems.map(item => <NavLink key={item.href} {...item} />)}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Account items — anchored to nav bottom */}
        {isSignedIn && (
          <div style={{ borderTop: '1px solid var(--color-border-muted)', paddingTop: 4 }}>
            <NavLink href="/dashboard/account" label="Account Settings" />
            <NavButton label="Sign Out" onClick={() => signOut({ redirectUrl: '/' })} />
          </div>
        )}

        {!isSignedIn && (
          <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Link
              href="/sign-in"
              style={{
                display: 'block', padding: '8px 0',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase', textDecoration: 'none', textAlign: 'center',
              }}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              style={{
                display: 'block', padding: '8px 0',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                color: 'var(--color-secondary)', background: 'var(--color-bg-elevated)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase', textDecoration: 'none', textAlign: 'center',
              }}
            >
              Get Started
            </Link>
          </div>
        )}
      </div>

      {/* Identity footer */}
      {isSignedIn && <SidebarAccount isAdmin={isAdmin} />}
    </aside>
  );
}
