'use client';

import { useState } from 'react';

export function RetryBriefButton({ briefId, jobId }: { briefId: string; jobId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<string | null>(null);

  async function handleClick() {
    setState('loading');
    setResult(null);
    try {
      const res = await fetch('/api/admin/retry-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefId, jobId }),
      });
      const data = await res.json() as { error?: string; ok?: boolean };
      if (!res.ok) {
        setState('error');
        setResult(data.error ?? 'Failed');
      } else {
        setState('done');
        setResult('reset → queued');
      }
    } catch {
      setState('error');
      setResult('Network error');
    }
  }

  const color = state === 'done' ? 'var(--color-success)' : state === 'error' ? 'var(--color-error)' : 'var(--color-amber)';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={state === 'loading' || state === 'done'}
        style={{
          padding: '0.2rem 0.6rem',
          borderRadius: '4px',
          border: '1px solid rgba(245,158,11,0.4)',
          background: 'rgba(245,158,11,0.08)',
          color: 'var(--color-amber)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          cursor: state === 'loading' || state === 'done' ? 'not-allowed' : 'pointer',
          opacity: state === 'loading' || state === 'done' ? 0.5 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {state === 'loading' ? '…' : 'Retry'}
      </button>
      {result && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color }}>{result}</span>
      )}
    </div>
  );
}
