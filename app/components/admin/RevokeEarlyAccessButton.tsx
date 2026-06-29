'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';

export function RevokeEarlyAccessButton({ userId }: { userId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<string | null>(null);

  async function handleClick() {
    if (!confirm(`Revoke invite code access for ${userId}? The code cannot be re-used.`)) return;
    setState('loading');
    setResult(null);
    try {
      const res = await fetch('/api/admin/revoke-early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json() as { error?: string; ok?: boolean };
      if (!res.ok) {
        setState('error');
        setResult(data.error ?? 'Failed');
      } else {
        setState('done');
        setResult('revoked');
      }
    } catch {
      setState('error');
      setResult('Network error');
    }
  }

  const color = state === 'done' ? 'var(--color-success)' : state === 'error' ? 'var(--color-error)' : 'var(--color-error)';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <Button
        variant="danger"
        size="xs"
        type="button"
        onClick={() => void handleClick()}
        disabled={state === 'loading' || state === 'done'}
        style={{ whiteSpace: 'nowrap' }}
      >
        {state === 'loading' ? '…' : 'Revoke'}
      </Button>
      {result && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color }}>{result}</span>
      )}
    </div>
  );
}
