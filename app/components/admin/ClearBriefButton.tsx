'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';

export function ClearBriefButton({ userId }: { userId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<string | null>(null);

  async function handleClick() {
    setState('loading');
    setResult(null);
    try {
      const res = await fetch('/api/admin/clear-briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json() as { error?: string; cleared?: Record<string, number> };
      if (!res.ok) {
        setState('error');
        setResult(data.error ?? 'Failed');
      } else {
        setState('done');
        const c = data.cleared ?? {};
        setResult(`briefs:${c.briefs ?? 0} jobs:${c.brief_jobs ?? 0} cap:${c.free_brief_daily ?? 0}`);
      }
    } catch {
      setState('error');
      setResult('Network error');
    }
  }

  const color = state === 'done' ? 'rgba(99,102,241,0.8)' : state === 'error' ? 'var(--color-error)' : 'var(--color-text-tertiary)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Button
        variant="admin"
        size="xs"
        type="button"
        onClick={() => void handleClick()}
        disabled={state === 'loading'}
        style={{ whiteSpace: 'nowrap' }}
      >
        {state === 'loading' ? '…' : 'Clear Briefs'}
      </Button>
      {result && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color }}>{result}</span>
      )}
    </div>
  );
}
