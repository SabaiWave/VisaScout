'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const POLL_INTERVAL_MS = 5000;
const TIMEOUT_MS = 15 * 60 * 1000;

export function BriefProcessingBanner({ briefId }: { briefId: string }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - startTime > TIMEOUT_MS) {
        setTimedOut(true);
        clearInterval(id);
        return;
      }
      router.refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router, startTime]);

  if (timedOut) {
    return (
      <div
        className="px-4 py-3 rounded"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-error)', textTransform: 'uppercase', letterSpacing: '0.04em' }}
      >
        BRIEF GENERATION TOOK LONGER THAN EXPECTED.{' '}
        <a href={`/contact?ref=${briefId}`} style={{ color: 'var(--color-error)', textDecoration: 'underline' }}>
          CONTACT US
        </a>{' '}
        WITH REF: {briefId}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded"
      style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}
    >
      <div
        className="w-4 h-4 rounded-full animate-spin flex-shrink-0"
        style={{ border: '2px solid var(--color-border-strong)', borderTopColor: 'var(--color-secondary)' }}
      />
      BRIEF IS BEING GENERATED — CHECKING AUTOMATICALLY.
    </div>
  );
}
