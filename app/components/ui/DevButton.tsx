'use client';

import React from 'react';

interface DevButtonProps {
  label: string;
  sublabel?: string;
  onClick?: () => void;
  href?: string;
  newTab?: boolean;
  accent?: boolean;
}

export function DevButton({ label, sublabel, onClick, href, newTab = false, accent = false }: DevButtonProps) {
  const base: React.CSSProperties = {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '0.625rem 0.75rem',
    borderRadius: '6px',
    border: `1px solid ${accent ? 'rgba(99,102,241,0.3)' : 'var(--color-border)'}`,
    background: accent ? 'var(--color-secondary-subtle)' : 'var(--color-bg-base)',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    textDecoration: 'none',
  };

  const inner = (
    <>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: accent ? 'var(--color-secondary-light)' : 'var(--color-text-primary)' }}>
        {label}
      </span>
      {sublabel && (
        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '0.1rem', letterSpacing: '0.03em', textTransform: 'none', fontWeight: 400 }}>
          {sublabel}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} target={newTab ? '_blank' : undefined} rel={newTab ? 'noreferrer' : undefined} style={base}>
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} style={base}>
      {inner}
    </button>
  );
}
