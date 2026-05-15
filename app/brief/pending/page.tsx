'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const MAX_WAIT_MS = 10 * 60 * 1000;
const POLL_INTERVAL_MS = 3000;

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

const PAGE: React.CSSProperties = {
  background: 'var(--color-bg-base)',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 1.5rem',
};

function PendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const briefId = searchParams.get('brief_id');
  const [timedOut, setTimedOut] = useState(false);
  const [pipelineError, setPipelineError] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (!briefId) return;

    const poll = async () => {
      if (Date.now() - startTime.current > MAX_WAIT_MS) {
        setTimedOut(true);
        return;
      }

      try {
        const res = await fetch(`/api/brief/poll?brief_id=${briefId}`);
        if (!res.ok) return;
        const data = await res.json() as { status: string; briefId?: string };

        if (data.status === 'paid') {
          router.replace(`/brief/${briefId}`);
          return;
        }
        if (data.status === 'error') {
          setPipelineError(true);
          return;
        }
        // 'pending' — keep polling
      } catch {
        // network error — keep polling
      }
    };

    void poll();
    const interval = setInterval(() => { void poll(); }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [briefId, router]);

  if (!briefId) {
    return (
      <div style={PAGE}>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)', ...MONO }}>No brief ID found.</p>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div style={PAGE}>
        <div className="max-w-md text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 mb-5"
            style={{ background: 'rgba(245,158,11,0.1)', borderRadius: '4px' }}
          >
            <span style={{ color: 'var(--color-warning)', fontSize: '1.5rem' }}>⏱</span>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)', ...MONO }}>
            Taking longer than expected
          </h1>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Your payment was received. Your brief may still be generating — try refreshing in a few minutes,
            or contact support at{' '}
            <a href="mailto:hello@visascout.io" style={{ color: 'var(--color-secondary-light)' }}>
              hello@visascout.io
            </a>{' '}
            with reference:{' '}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{briefId}</span>
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider border transition-colors"
            style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)', borderRadius: '4px', ...MONO }}
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (pipelineError) {
    return (
      <div style={PAGE}>
        <div className="max-w-md text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 mb-5"
            style={{ background: 'rgba(239,68,68,0.1)', borderRadius: '4px' }}
          >
            <span style={{ color: 'var(--color-error)', fontSize: '1.5rem' }}>✕</span>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)', ...MONO }}>
            Brief generation failed
          </h1>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Your payment was received, but the pipeline encountered an error. We will refund your payment.
            Contact{' '}
            <a href="mailto:hello@visascout.io" style={{ color: 'var(--color-secondary-light)' }}>
              hello@visascout.io
            </a>{' '}
            with reference:{' '}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{briefId}</span>
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider border transition-colors"
            style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)', borderRadius: '4px', ...MONO }}
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={PAGE}>
      <div className="max-w-sm text-center">
        <div
          className="inline-flex items-center justify-center w-14 h-14 mb-5"
          style={{ background: 'var(--color-bg-elevated)', borderRadius: '4px' }}
        >
          <div
            className="w-6 h-6 rounded-full animate-spin"
            style={{
              border: '2px solid var(--color-border-strong)',
              borderTopColor: 'var(--color-secondary)',
            }}
          />
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)', ...MONO }}>
          Generating your brief
        </h1>
        <p className="text-sm leading-relaxed mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Payment confirmed. Our agents are researching your situation now.
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>This takes 2–4 minutes. Don&apos;t close this tab.</p>
      </div>
    </div>
  );
}

const PendingSpinner = () => (
  <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div
      className="w-6 h-6 rounded-full animate-spin"
      style={{ border: '2px solid var(--color-border-strong)', borderTopColor: 'var(--color-secondary)' }}
    />
  </div>
);

export default function PendingPage() {
  return (
    <Suspense fallback={<PendingSpinner />}>
      <PendingContent />
    </Suspense>
  );
}
