'use client';

import { useEffect, useRef } from 'react';
import { Archive, X } from 'lucide-react';
import Link from 'next/link';
import { Wordmark } from './Wordmark';
import { SidebarAccount } from '@/app/dashboard/SidebarAccount';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
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
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          width: '260px',
          background: 'var(--color-bg-subtle)',
          borderRight: '1px solid var(--color-border-muted)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem 1rem',
          gap: '0.25rem',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          willChange: 'transform',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingLeft: '0.5rem' }}>
          <Wordmark />
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

        {/* Nav items */}
        <Link
          href="/dashboard"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--color-secondary-light)',
            background: 'var(--color-secondary-subtle)',
            textDecoration: 'none',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            minHeight: '44px',
          }}
        >
          <Archive size={14} />
          History
        </Link>

        <div style={{ flex: 1 }} />
        <SidebarAccount />
      </div>
    </>
  );
}

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
