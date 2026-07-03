'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { NavLink } from '@/app/components/ui/NavLink';

const MAX_WAIT_MS = 6 * 60 * 1000;
const SOFT_HANDOFF_MS = 90 * 1000;
const POLL_INTERVAL_MS = 3000;
const MIN_DISPLAY_MS = 10000;
const DEV_MIN_DISPLAY_MS = 3000;

// When brief is ready: stagger each agent green, then redirect after COMPLETION_ANIM_MS
const COMPLETION_STAGGER_MS = [0, 250, 500, 750, 1000, 1600];
const COMPLETION_ANIM_MS = 1600 + 400;

const DEV_BRIEF_INPUTS = {
  nationality: 'American',
  destination: 'Thailand',
  visaType: 'Visa Exemption',
  freeform: "I'm planning a 2 week trip to Thailand. How many days am I permitted to stay on a visa exemption? What are my visa options if I wanted to stay longer? What are the costs involved?",
  depth: 'quick',
};

const SKELETON_AGENTS = [
  'Official Policy',
  'Recent Changes',
  'Community Intel',
  'Entry Requirements',
  'Border Run',
  'Conflict Resolver',
];

// ─── Scanning dots ────────────────────────────────────────────────────────────

function ScanningDots({ label }: { label: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % 3), 450);
    return () => clearInterval(id);
  }, []);
  return (
    <span>
      {label}
      <span style={{ display: 'inline-block', width: '3ch', textAlign: 'left' }}>
        {'...'.slice(0, tick + 1)}
      </span>
    </span>
  );
}

// ─── Shared layout shell ──────────────────────────────────────────────────────

function PendingShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--color-bg-base)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 1.5rem',
      }}
    >
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

function HudHeading({ children, color = 'var(--color-text-primary)' }: { children: React.ReactNode; color?: string }) {
  return (
    <>
      <h1
        className="text-2xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-mono)', color, textTransform: 'uppercase', letterSpacing: '0.04em' }}
      >
        <span style={{ color: 'var(--color-secondary)', marginRight: '0.5rem' }}>//</span>
        {children}
      </h1>
      <div
        className="mb-5"
        style={{ height: 1, background: 'linear-gradient(to right, rgba(99,102,241,0.4), transparent)' }}
      />
    </>
  );
}

function IconBox({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <div
      className="inline-flex items-center justify-center w-20 h-20 mb-6"
      style={{ background: bg, borderRadius: '4px', border: '1px solid var(--color-border-muted)' }}
    >
      {children}
    </div>
  );
}

// ─── States ───────────────────────────────────────────────────────────────────

function SkeletonAgentRow({ label, index, done, completedCount }: { label: string; index: number; done: boolean; completedCount: number }) {
  const isResolver = index === 5;
  const isResolving = isResolver && completedCount >= 5 && !done;
  const isQueued = isResolver && completedCount < 5 && !done;
  const isRunning = !done && !isQueued && !isResolving;

  const borderColor = done
    ? 'var(--color-border)'
    : isQueued
    ? 'var(--color-border-muted)'
    : 'rgba(99,102,241,0.15)';

  const iconColor = done ? 'var(--color-success)' : isQueued ? 'var(--color-text-tertiary)' : 'var(--color-secondary)';
  const StatusIcon = done ? CheckCircle2 : isQueued ? Clock : Loader2;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg mb-1.5"
      style={{
        border: `1px solid ${borderColor}`,
        background: done ? 'var(--color-bg-elevated)' : isQueued ? 'transparent' : 'var(--color-secondary-subtle)',
      }}
    >
      <StatusIcon
        aria-hidden="true"
        size={14}
        className={(isRunning || isResolving) ? 'animate-spin' : ''}
        style={{ color: iconColor, flexShrink: 0 }}
      />
      <span
        className="text-xs font-bold uppercase flex-1"
        style={{
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.04em',
          color: isQueued ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
        }}
      >
        {label}
      </span>
      <span
        className="text-xs uppercase"
        style={{
          fontFamily: 'var(--font-mono)',
          color: done
            ? 'var(--color-success)'
            : isQueued
            ? 'var(--color-text-tertiary)'
            : 'var(--color-secondary-light)',
        }}
      >
        {done ? 'complete' : isQueued ? 'queued' : <ScanningDots label={isResolving ? 'resolving' : 'scanning'} />}
      </span>
    </div>
  );
}

function GeneratingState({ completedCount }: { completedCount: number }) {
  return (
    <PendingShell>
      <div>
        <div className="text-center mb-6">
          <IconBox bg="var(--color-secondary-subtle)">
            <div
              className="w-10 h-10 rounded-full animate-spin"
              style={{ border: '3px solid rgba(99,102,241,0.25)', borderTopColor: 'var(--color-secondary)' }}
            />
          </IconBox>
          <HudHeading>Agents Deployed</HudHeading>
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            We&apos;re pulling from official immigration sources, recent enforcement reports, and what real travelers are seeing on the ground.
          </p>
          <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Standard research takes about 1 to 3 minutes, deep research a bit longer. Your brief is generating in the background so you can head to your dashboard whenever and it&apos;ll be there when it&apos;s done.
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            We&apos;ll send you an email when it&apos;s ready.
          </p>
        </div>
        <div>
          {SKELETON_AGENTS.map((label, i) => (
            <SkeletonAgentRow key={label} label={label} index={i} done={i < completedCount} completedCount={completedCount} />
          ))}
        </div>
        <div className="mt-4 text-center">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm"
            style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}
          >
            Go to Dashboard <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </PendingShell>
  );
}

function HandoffState({ briefId, depth }: { briefId: string | null; depth: string }) {
  const router = useRouter();
  return (
    <PendingShell>
      <div className="text-center">
        <IconBox bg="var(--color-secondary-subtle)">
          <div
            className="w-10 h-10 rounded-full animate-spin"
            style={{ border: '3px solid rgba(99,102,241,0.25)', borderTopColor: 'var(--color-secondary)' }}
          />
        </IconBox>
        <HudHeading>Still Working</HudHeading>
        <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Your brief is still being put together. {depth === 'deep' ? 'Deep research can take a few minutes' : 'This one is taking a little longer than usual'}, and that&apos;s completely normal.
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          You can head to your dashboard whenever — we&apos;ll email you when it&apos;s ready. No need to stay on this page.
        </p>
        {briefId && (
          <p className="text-xs mb-5" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            Ref: {briefId}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          <Button variant="secondary" onClick={() => router.push('/')}>Back to Home</Button>
        </div>
      </div>
    </PendingShell>
  );
}

function TimedOutState({ briefId }: { briefId: string | null }) {
  const router = useRouter();
  const contactHref = `/contact${briefId ? `?ref=${briefId}` : ''}`;
  return (
    <PendingShell>
      <div className="text-center">
        <IconBox bg="rgba(245,158,11,0.1)">
          <span style={{ color: 'var(--color-amber)', fontSize: '1.4rem' }}>⏱</span>
        </IconBox>
        <HudHeading color="var(--color-amber)">Taking Longer Than Expected</HudHeading>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Your brief is taking longer than expected but it&apos;s still running. Check your dashboard in a few minutes and it should be there. If it&apos;s not showing up, reach out and we&apos;ll take a look.
        </p>
        {briefId && (
          <p
            className="text-xs mb-6"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}
          >
            Ref: {briefId}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          <Button variant="secondary" onClick={() => router.push(contactHref)}>Contact Us</Button>
        </div>
      </div>
    </PendingShell>
  );
}

function ErrorState({ briefId }: { briefId: string | null }) {
  const router = useRouter();
  const contactHref = `/contact${briefId ? `?ref=${briefId}` : ''}`;
  return (
    <PendingShell>
      <div className="text-center">
        <IconBox bg="rgba(239,68,68,0.1)">
          <span style={{ color: 'var(--color-error)', fontSize: '1.4rem', fontWeight: 700 }}>✕</span>
        </IconBox>
        <HudHeading color="var(--color-error)">Brief Generation Failed</HudHeading>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Something went wrong while putting your brief together. Get in touch and we&apos;ll look into it and make it right.
        </p>
        {briefId && (
          <p
            className="text-xs mb-6"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}
          >
            Ref: {briefId}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push(contactHref)}>Contact Us</Button>
          <Button variant="secondary" onClick={() => router.push('/')}>Back to Home</Button>
        </div>
      </div>
    </PendingShell>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function PendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const briefId = searchParams.get('brief_id');
  const depth = searchParams.get('depth') ?? 'standard';

  const isDev = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' && searchParams.get('dev') === 'true';
  // dev-only error simulation via ?sim=error or ?sim=timeout
  const sim = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' ? searchParams.get('sim') : null;

  const [state, setState] = useState<'generating' | 'handoff' | 'error' | 'timeout'>(
    sim === 'error' ? 'error' : sim === 'timeout' ? 'timeout' : sim === 'handoff' ? 'handoff' : 'generating',
  );
  const [completedCount, setCompletedCount] = useState(0);
  const [startTime] = useState(() => Date.now());
  const completionStartedRef = useRef(false);

  // Trigger rapid sequential completion animation, then redirect after animation finishes
  function triggerCompletionAndRedirect(redirectFn: (delay: number) => void) {
    COMPLETION_STAGGER_MS.forEach((ms, i) => {
      setTimeout(() => setCompletedCount(i + 1), ms);
    });
    const elapsed = Date.now() - startTime;
    // Wait for animation to finish, also respect any remaining minimum display time
    const delay = Math.max(COMPLETION_ANIM_MS, 0);
    redirectFn(delay);
    // Suppress elapsed — MIN_DISPLAY_MS already accounted for by caller
    void elapsed;
  }

  // Dev mode: fire brief generation from this page, redirect after min display time
  useEffect(() => {
    if (!isDev || sim) return;

    const run = async () => {
      try {
        const response = await fetch('/api/brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(DEV_BRIEF_INPUTS),
        });

        if (!response.ok || !response.body) {
          setState('error');
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let foundBriefId: string | null = null;

        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6)) as Record<string, unknown>;
              if (data.type === 'complete') {
                if (data.briefId) foundBriefId = data.briefId as string;
                break outer;
              }
              if (data.type === 'error') {
                setState('error');
                return;
              }
            } catch { continue; }
          }
        }

        if (!foundBriefId) { setState('error'); return; }

        const elapsed = Date.now() - startTime;
        triggerCompletionAndRedirect((animDelay) => {
          const totalDelay = Math.max(animDelay, DEV_MIN_DISPLAY_MS - elapsed);
          setTimeout(() => router.replace(`/brief/${foundBriefId}`), totalDelay);
        });
      } catch {
        setState('error');
      }
    };

    void run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDev, sim, router, startTime]);

  // Real payment flow: poll for brief status
  useEffect(() => {
    if (isDev || !briefId || sim) return;

    const poll = async () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_WAIT_MS) {
        setState('timeout');
        return;
      }
      if (elapsed > SOFT_HANDOFF_MS) {
        setState((prev) => prev === 'generating' ? 'handoff' : prev);
      }

      try {
        const res = await fetch(`/api/brief/poll?brief_id=${briefId}`);
        if (!res.ok) return;
        const data = await res.json() as { status: string };

        if (data.status === 'paid') {
          if (completionStartedRef.current) return;
          completionStartedRef.current = true;
          const elapsed = Date.now() - startTime;
          triggerCompletionAndRedirect((animDelay) => {
            const totalDelay = Math.max(animDelay, MIN_DISPLAY_MS - elapsed);
            setTimeout(() => router.replace(`/brief/${briefId}`), totalDelay);
          });
          return;
        }
        if (data.status === 'error') {
          setState('error');
          return;
        }
      } catch { /* network blip — keep polling */ }
    };

    void poll();
    const interval = setInterval(() => { void poll(); }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDev, briefId, sim, router, startTime]);

  if (state === 'timeout') return <TimedOutState briefId={briefId} />;
  if (state === 'error')   return <ErrorState briefId={briefId} />;
  if (state === 'handoff') return <HandoffState briefId={briefId} depth={depth} />;
  return <GeneratingState completedCount={completedCount} />;
}

// ─── Suspense shell ───────────────────────────────────────────────────────────

function PendingFallback() {
  return <GeneratingState completedCount={0} />;
}

export default function PendingPage() {
  return (
    <Suspense fallback={<PendingFallback />}>
      <PendingContent />
    </Suspense>
  );
}
