'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';

const MAX_WAIT_MS = 10 * 60 * 1000;
const POLL_INTERVAL_MS = 3000;
const MIN_DISPLAY_MS = 6000;
const DEV_MIN_DISPLAY_MS = 3000;

const DEV_BRIEF_INPUTS = {
  nationality: 'American',
  destination: 'Thailand',
  visaType: 'Visa Exemption',
  freeform: "I'm planning a 2 week trip to Thailand. How many days am I permitted to stay on a visa exemption? What are my visa options if I wanted to stay longer? What are the costs involved?",
  depth: 'quick',
};

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
        padding: '0 1.5rem',
      }}
    >
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}

function HudHeading({ children, color = 'var(--color-text-primary)' }: { children: React.ReactNode; color?: string }) {
  return (
    <>
      <h1
        className="text-xl font-bold mb-2"
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
      className="inline-flex items-center justify-center w-14 h-14 mb-6"
      style={{ background: bg, borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {children}
    </div>
  );
}

// ─── States ───────────────────────────────────────────────────────────────────

function GeneratingState() {
  return (
    <PendingShell>
      <div className="text-center">
        <IconBox bg="var(--color-secondary-subtle)">
          <div
            className="w-6 h-6 rounded-full animate-spin"
            style={{ border: '2px solid rgba(99,102,241,0.25)', borderTopColor: 'var(--color-secondary)' }}
          />
        </IconBox>
        <HudHeading>Generating Your Brief</HudHeading>
        <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Payment confirmed. Our agents are researching your situation now.
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          This takes 2–4 minutes. Don&apos;t close this tab.
        </p>
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
          Your brief may still be generating — try refreshing in a few minutes.
          If it&apos;s been a while, get in touch and we&apos;ll sort it out.
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
          Something went wrong while generating your brief. Please reach out and
          we&apos;ll investigate and make it right.
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

  const isDev = process.env.NODE_ENV === 'development' && searchParams.get('dev') === 'true';
  // dev-only error simulation via ?sim=error or ?sim=timeout
  const sim = process.env.NODE_ENV === 'development' ? searchParams.get('sim') : null;

  const [state, setState] = useState<'generating' | 'error' | 'timeout'>(
    sim === 'error' ? 'error' : sim === 'timeout' ? 'timeout' : 'generating',
  );
  const startTime = useRef(Date.now());

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

        const elapsed = Date.now() - startTime.current;
        const delay = Math.max(0, DEV_MIN_DISPLAY_MS - elapsed);
        setTimeout(() => router.replace(`/brief/${foundBriefId}`), delay);
      } catch {
        setState('error');
      }
    };

    void run();
  }, [isDev, sim, router]);

  // Real payment flow: poll for brief status
  useEffect(() => {
    if (isDev || !briefId || sim) return;

    const poll = async () => {
      if (Date.now() - startTime.current > MAX_WAIT_MS) {
        setState('timeout');
        return;
      }

      try {
        const res = await fetch(`/api/brief/poll?brief_id=${briefId}`);
        if (!res.ok) return;
        const data = await res.json() as { status: string };

        if (data.status === 'paid') {
          const elapsed = Date.now() - startTime.current;
          const delay = Math.max(0, MIN_DISPLAY_MS - elapsed);
          setTimeout(() => router.replace(`/brief/${briefId}`), delay);
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
  }, [isDev, briefId, sim, router]);

  if (state === 'timeout') return <TimedOutState briefId={briefId} />;
  if (state === 'error')   return <ErrorState briefId={briefId} />;
  return <GeneratingState />;
}

// ─── Suspense shell ───────────────────────────────────────────────────────────

function PendingFallback() {
  return <GeneratingState />;
}

export default function PendingPage() {
  return (
    <Suspense fallback={<PendingFallback />}>
      <PendingContent />
    </Suspense>
  );
}
