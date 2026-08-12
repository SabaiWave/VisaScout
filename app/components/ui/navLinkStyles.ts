import type { CSSProperties } from 'react';

// Shared by LandingNav, UtilityNav, AppTopBar — keeps every top-bar nav link
// (marketing, utility, app shell) visually identical.
export const navLinkStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6875rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
  textDecoration: 'none',
};

export const ctaLinkStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6875rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-neutral)',
  background: 'var(--color-amber)',
  padding: '9px 18px',
  textDecoration: 'none',
};
