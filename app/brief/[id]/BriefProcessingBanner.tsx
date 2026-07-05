'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const POLL_INTERVAL_MS = 5000;
const TIMEOUT_MS = 8 * 60 * 1000;
// Minimum time skeleton is shown before content is revealed — ensures the
// GENERATING card → skeleton → content sequence is always visible even when
// the brief completes faster than the user can navigate.
const MIN_DISPLAY_MS = 10000;

function SkeletonLine({ width = '100%', height = '14px' }: { width?: string; height?: string }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{ width, height, borderRadius: '4px' }}
    />
  );
}

function SkeletonCard({ lines = 3, headingWidth = '40%' }: { lines?: number; headingWidth?: string }) {
  return (
    <div
      style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Card heading row: heading bar only — no // prefix in skeleton */}
      <div style={{ marginBottom: '4px' }}>
        <SkeletonLine width={headingWidth} height="13px" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? '70%' : '100%'} />
      ))}
    </div>
  );
}

export function BriefProcessingBanner({ briefId, isActuallyDone = false }: { briefId: string; isActuallyDone?: boolean }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    if (isActuallyDone) {
      // Brief is ready — enforce minimum skeleton display time before revealing content
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      const t = setTimeout(() => {
        router.replace(`/brief/${briefId}`);
      }, remaining);
      return () => clearTimeout(t);
    }

    // Brief still running — poll until done
    const id = setInterval(() => {
      if (Date.now() - startTime > TIMEOUT_MS) {
        setTimedOut(true);
        clearInterval(id);
        return;
      }
      router.refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isActuallyDone, briefId, router, startTime]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Status pill */}
      <div
        className="flex items-center gap-2"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}
      >
        <span className="animate-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-amber)', display: 'inline-block', flexShrink: 0 }} />
        Generating brief — checking automatically
      </div>

      {/* Skeleton cards mimicking brief section layout */}
      <SkeletonCard headingWidth="55%" lines={2} />
      <SkeletonCard headingWidth="35%" lines={4} />
      <SkeletonCard headingWidth="45%" lines={3} />
      <SkeletonCard headingWidth="40%" lines={3} />
      <SkeletonCard headingWidth="50%" lines={2} />
    </div>
  );
}
