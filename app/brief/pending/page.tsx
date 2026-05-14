'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const MAX_WAIT_MS = 10 * 60 * 1000; // 10 minutes
const POLL_INTERVAL_MS = 3000;

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm">No brief ID found.</p>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 mb-5">
            <span className="text-amber-600 text-2xl">⏱</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            This is taking longer than expected
          </h1>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Your payment was received. Your brief may still be generating — try refreshing in a few minutes,
            or contact support at{' '}
            <a href="mailto:support@visascout.io" className="text-[#1e3a5f] underline">
              support@visascout.io
            </a>{' '}
            with reference: <span className="font-mono text-xs">{briefId}</span>
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (pipelineError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-5">
            <span className="text-red-600 text-2xl">✕</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Brief generation failed
          </h1>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Your payment was received, but the pipeline encountered an error. We will refund your payment.
            Contact{' '}
            <a href="mailto:support@visascout.io" className="text-[#1e3a5f] underline">
              support@visascout.io
            </a>{' '}
            with reference: <span className="font-mono text-xs">{briefId}</span>
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#e8eef5] mb-5">
          <div className="w-6 h-6 border-2 border-[#c3d3e8] border-t-[#1e3a5f] rounded-full animate-spin" />
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}>
          Generating your brief
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-1">
          Payment confirmed. Our agents are researching your situation now.
        </p>
        <p className="text-xs text-gray-400">This takes 2–4 minutes. Don&apos;t close this tab.</p>
      </div>
    </div>
  );
}

const PendingSpinner = () => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1e3a5f] rounded-full animate-spin" />
  </div>
);

export default function PendingPage() {
  return (
    <Suspense fallback={<PendingSpinner />}>
      <PendingContent />
    </Suspense>
  );
}
