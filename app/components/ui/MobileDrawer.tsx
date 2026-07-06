'use client';

import { CSSProperties, ReactNode, useEffect, useState } from 'react';
import { X } from 'lucide-react';

// Shared style constants for drawer nav links — use these in every page's drawer
export const navDrawerLinkStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 14px',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textDecoration: 'none',
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  minHeight: '44px',
  border: '1px solid var(--color-border)',
};

// Borderless secondary nav link — for non-CTA items (Home, Dashboard, How It Works)
export const navDrawerSecondaryStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textDecoration: 'none',
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  minHeight: '44px',
  border: 'none',
  background: 'transparent',
};

export const navDrawerPrimaryStyle: CSSProperties = {
  ...navDrawerLinkStyle,
  background: 'var(--color-secondary)',
  color: '#ffffff',
  border: 'none',
  justifyContent: 'center',
  gap: '8px',
};

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: 'left' | 'right';
}

export function NavDrawer({ open, onClose, children, side = 'right' }: NavDrawerProps) {
  // Block pointer events during the open transition so Clerk's UserButton doesn't
  // receive a click mid-animation. getBoundingClientRect() returns the in-progress
  // position when clicked during transition — Clerk places the popover there, then
  // the drawer finishes moving and the popover appears displaced. 270ms > transition.
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    if (!open) {
      setInteractive(false);
      return;
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => setInteractive(true), 270);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      clearTimeout(t);
    };
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Panel */}
      {/* Animate left/right offset instead of transform — CSS transform creates a new containing
          block for position:fixed descendants (e.g. Clerk UserButton popover), causing
          incorrect popover positioning. left/right animation avoids this stacking context issue. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        style={{
          position: 'fixed',
          top: 0,
          ...(side === 'left'
            ? { left: open ? 0 : '-260px' }
            : { right: open ? 0 : '-260px' }),
          bottom: 0,
          zIndex: 50,
          width: '260px',
          background: 'var(--color-bg-subtle)',
          [side === 'left' ? 'borderRight' : 'borderLeft']: '1px solid var(--color-border-muted)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.25rem 1rem',
          gap: '0.5rem',
          transition: `${side === 'left' ? 'left' : 'right'} 0.25s ease`,
          pointerEvents: open && interactive ? 'auto' : 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: side === 'left' ? 'flex-start' : 'flex-end', marginBottom: '0.75rem' }}>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-tertiary)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </>
  );
}

// Keep MobileDrawer as an alias so the dashboard MobileNav import doesn't break
// until we update it below
export { NavDrawer as MobileDrawer };

export function HamburgerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open menu"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '5px',
        width: '40px',
        height: '40px',
        padding: '8px',
        borderRadius: '8px',
        border: 'none',
        background: 'transparent',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <span style={{ display: 'block', height: '2px', background: 'currentColor', borderRadius: '1px' }} />
      <span style={{ display: 'block', height: '2px', background: 'currentColor', borderRadius: '1px' }} />
      <span style={{ display: 'block', height: '2px', background: 'currentColor', borderRadius: '1px' }} />
    </button>
  );
}
