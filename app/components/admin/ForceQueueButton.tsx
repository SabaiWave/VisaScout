'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';

export function ForceQueueButton({ briefId }: { briefId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<string | null>(null);

  async function handleClick() {
    setState('loading');
    setResult(null);
    try {
      const res = await fetch('/api/admin/force-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefId }),
      });
      const data = await res.json() as { error?: string; ok?: boolean };
      if (!res.ok) {
        setState('error');
        setResult(data.error ?? 'Failed');
      } else {
        setState('done');
        setResult('job created → pipeline fires on next poll');
      }
    } catch {
      setState('error');
      setResult('Network error');
    }
  }

  const color = state === 'done' ? 'var(--color-success)' : state === 'error' ? 'var(--color-error)' : 'var(--color-secondary-light)';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <Button
        variant="admin"
        size="xs"
        type="button"
        onClick={() => void handleClick()}
        disabled={state === 'loading' || state === 'done'}
        style={{ whiteSpace: 'nowrap' }}
      >
        {state === 'loading' ? '…' : 'Force Queue'}
      </Button>
      {result && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color }}>{result}</span>
      )}
    </div>
  );
}
