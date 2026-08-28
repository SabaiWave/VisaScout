'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export function BriefErrorState({ briefId }: { briefId: string }) {
  useEffect(() => {
    Sentry.captureMessage('brief.error_state_viewed', {
      level: 'warning',
      extra: { briefId },
    });
  }, [briefId]);

  return (
    <div className="max-w-[760px] mx-auto px-4">
      <div style={{ background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', padding: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-error)', marginBottom: 6 }}>
          Brief Generation Failed
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.65, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
          This brief could not be completed. Generate a new brief to try again.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginBottom: 14 }}>
          <a href="/app" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: 'var(--color-secondary)', color: 'var(--color-bg-base)', border: '1px solid var(--color-secondary)', padding: '8px 20px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Generate New Brief
          </a>
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-text-tertiary)', margin: 0 }}>
          If this was unexpected,{' '}
          <a href={`/contact?ref=${briefId}`} style={{ color: 'var(--color-text-tertiary)', textDecoration: 'underline' }}>
            contact support
          </a>{' '}
          with reference: {briefId}
        </p>
      </div>
    </div>
  );
}
