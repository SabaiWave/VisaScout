'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';

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

export function BriefProcessingBanner({ briefId, isActuallyDone = false, pollForJob = false }: { briefId: string; isActuallyDone?: boolean; pollForJob?: boolean }) {
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

    // Brief still running — claim the job (if queued) and poll for completion
    const tick = () => {
      if (Date.now() - startTime > TIMEOUT_MS) {
        setTimedOut(true);
        return false;
      }
      if (pollForJob) {
        // Triggers job claim + pipeline start in poll route; fire-and-forget
        void fetch(`/api/brief/poll?brief_id=${briefId}`);
      }
      router.refresh();
      return true;
    };

    if (!tick()) return;
    const id = setInterval(() => {
      if (!tick()) clearInterval(id);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isActuallyDone, briefId, pollForJob, router, startTime]);

  if (timedOut) {
    return (
      <div className="rounded-lg border text-center px-5 py-10" style={{ background: 'var(--color-bg-elevated)', borderColor: 'rgba(245,158,11,0.3)' }}>
        <div className="inline-flex items-center justify-center w-16 h-16 mb-5 mx-auto" style={{ background: 'rgba(245,158,11,0.1)', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.2)' }}>
          <Clock size={28} style={{ color: 'var(--color-amber)' }} />
        </div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-amber)', letterSpacing: '0.04em' }}>
          Taking Longer Than Expected
        </h2>
        <div className="mb-5 mx-auto" style={{ height: 1, maxWidth: '200px', background: 'linear-gradient(to right, transparent, rgba(245,158,11,0.3), transparent)' }} />
        <p className="text-sm leading-relaxed mb-4 mx-auto" style={{ color: 'var(--color-text-secondary)', maxWidth: '360px' }}>
          Your brief is still running. Check your dashboard in a few minutes. If it doesn&apos;t appear, get in touch and we&apos;ll sort it out.
        </p>
        <p className="text-xs mb-6" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          Ref: {briefId}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          <Button variant="secondary" onClick={() => router.push(`/contact?ref=${briefId}`)}>Contact Us</Button>
        </div>
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
