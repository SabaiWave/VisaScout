'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const MAX_WAIT_MS    = 6 * 60 * 1000; // 6 min → timeout state
const HANDOFF_MS     = 90 * 1000;     // 90s → handoff message
const POLL_INTERVAL  = 3000;

type PageState = 'generating' | 'handoff' | 'timeout' | 'error';

// ─── CSS ─────────────────────────────────────────────────────────────────────

const PAGE_CSS = `
  @keyframes pd-pulse   { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
  @keyframes pd-shimmer { 0% { background-position:-200px 0; } 100% { background-position:260px 0; } }
  .pd-agent-card { border:1px solid var(--color-border); background:var(--color-bg-elevated); }
  .pd-card-head {
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 16px; border-bottom:1px solid var(--color-border);
    font-family:var(--font-mono); font-size:10px; font-weight:700;
    letter-spacing:0.08em; text-transform:uppercase; color:var(--color-text-tertiary);
  }
  .pd-card-count { font-weight:400; letter-spacing:0.04em; }
  .pd-agent-row {
    display:flex; align-items:center; gap:12px;
    height:40px; padding:0 16px;
    border-left:3px solid var(--color-border);
    border-bottom:1px solid var(--color-border);
  }
  .pd-agent-row:last-child { border-bottom:none; }
  .pd-agent-row.running { border-left-color:var(--color-secondary); }
  .pd-agent-row.failed  { border-left-color:var(--color-error); }
  .pd-dot { width:8px; height:8px; border-radius:9999px; background:var(--color-border); flex-shrink:0; }
  .pd-agent-row.running .pd-dot { background:var(--color-secondary); animation:pd-pulse 1.4s ease-in-out infinite; }
  .pd-agent-row.failed  .pd-dot { background:var(--color-error); }
  .pd-agent-name {
    font-family:var(--font-mono); font-size:11px; font-weight:700;
    letter-spacing:0.04em; text-transform:uppercase; color:var(--color-text-tertiary);
  }
  .pd-agent-row.running .pd-agent-name { color:var(--color-text-secondary); }
  .pd-shimmer {
    margin-left:auto; width:120px; height:8px;
    background:linear-gradient(90deg,rgba(30,48,64,0.5) 0%,rgba(200,120,10,0.16) 50%,rgba(30,48,64,0.5) 100%);
    background-size:260px 100%; animation:pd-shimmer 1.8s linear infinite;
  }
  .pd-agent-row.queued .pd-shimmer,
  .pd-agent-row:not(.running):not(.failed):not(.queued) .pd-shimmer {
    animation:none; background:rgba(22,36,47,0.9);
  }
  .pd-agent-row.failed .pd-shimmer { animation:none; background:rgba(61,21,21,0.9); }
`;

// ─── Shared styles ────────────────────────────────────────────────────────────

const STATE_H: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 900, fontSize: 36, lineHeight: 1.05,
  letterSpacing: '0.01em', textTransform: 'uppercase',
  color: 'var(--color-text-primary)', marginBottom: 16,
};
const BODY: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7,
  color: 'var(--color-text-secondary)', maxWidth: 600, marginBottom: 24,
};
const ESCAPE: React.CSSProperties = {
  display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 12,
  fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
  color: 'var(--color-secondary)', textDecoration: 'none',
  borderBottom: '1px solid rgba(200,120,10,0.4)', paddingBottom: 2, marginBottom: 40,
};
const BTN_OUT: React.CSSProperties = {
  display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 11,
  fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
  color: 'var(--color-secondary)', background: 'transparent',
  border: '1px solid var(--color-secondary)', padding: '11px 22px',
  textDecoration: 'none', cursor: 'pointer',
};
const BTN_GHOST: React.CSSProperties = {
  display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 11,
  fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
  color: 'var(--color-text-secondary)', background: 'transparent',
  border: '1px solid var(--color-border-strong)', padding: '11px 22px',
  textDecoration: 'none', cursor: 'pointer',
};

// ─── AgentCard ────────────────────────────────────────────────────────────────

const AGENT_NAMES = [
  'Official Policy', 'Recent Changes', 'Community Intel',
  'Entry Requirements', 'Border Run', 'Conflict Resolver',
] as const;

type AgentSt = 'running' | 'queued' | 'failed' | 'idle';

function AgentCard({ label, statuses }: { label: string; statuses: AgentSt[] }) {
  return (
    <div className="pd-agent-card">
      <div className="pd-card-head">
        <span>Pipeline</span>
        <span className="pd-card-count">{label}</span>
      </div>
      {AGENT_NAMES.map((name, i) => {
        const st = statuses[i] ?? 'idle';
        return (
          <div key={name} className={`pd-agent-row${st !== 'idle' ? ` ${st}` : ''}`}>
            <span className="pd-dot" />
            <span className="pd-agent-name">{name}</span>
            <span className="pd-shimmer" />
          </div>
        );
      })}
    </div>
  );
}

// ─── Page content ─────────────────────────────────────────────────────────────

function PendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const briefId = searchParams.get('brief_id');
  const sim = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'
    ? searchParams.get('sim') : null;

  const [pageState, setPageState] = useState<PageState>(
    sim === 'error' ? 'error'
    : sim === 'timeout' ? 'timeout'
    : sim === 'handoff' ? 'handoff'
    : 'generating'
  );
  const [startTime] = useState(() => Date.now());

  // State timer — drives handoff / timeout thresholds
  useEffect(() => {
    if (pageState === 'error' || pageState === 'timeout') return;
    const id = setInterval(() => {
      const ms = Date.now() - startTime;
      if (ms >= MAX_WAIT_MS) { setPageState('timeout'); return; }
      if (ms >= HANDOFF_MS && pageState === 'generating') setPageState('handoff');
    }, 1000);
    return () => clearInterval(id);
  }, [pageState, startTime]);

  // Poll for paid/error status (real paid-brief flow only)
  useEffect(() => {
    if (!briefId || sim || pageState === 'error' || pageState === 'timeout') return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/brief/poll?brief_id=${briefId}`);
        if (!res.ok) return;
        const data = await res.json() as { status: string };
        if (data.status === 'paid') { router.replace(`/brief/${briefId}`); return; }
        if (data.status === 'error') setPageState('error');
      } catch { /* network blip */ }
    };
    void poll();
    const id = setInterval(() => { void poll(); }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [briefId, sim, pageState, router]);

  const contactHref = `/contact${briefId ? `?ref=${briefId}` : ''}`;

  if (pageState === 'generating') {
    return (
      <>
        <h1 style={STATE_H}>Agents Deployed</h1>
        <p style={BODY}>
          We&apos;re pulling from official immigration sources, recent enforcement reports,
          and what travelers are actually seeing on the ground. Your brief is generating
          in the background. Feel free to head to My Briefs and check back.
        </p>
        <a style={ESCAPE} href="/dashboard">Go to My Briefs &rarr;</a>
        <AgentCard
          label="5 agents · parallel"
          statuses={['running', 'running', 'running', 'running', 'running', 'queued']}
        />
      </>
    );
  }

  if (pageState === 'handoff') {
    return (
      <>
        <svg style={{ display: 'block', marginBottom: 24 }} width="36" height="36" viewBox="0 0 24 24"
          fill="none" stroke="var(--color-secondary)" strokeWidth="1.5" strokeLinecap="square">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" />
        </svg>
        <h1 style={STATE_H}>Still Working</h1>
        <p style={BODY}>
          Your brief is still generating in the background. Head to My Briefs.
          We&apos;ll show your brief there as soon as it&apos;s ready.
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
          <a style={BTN_OUT} href="/dashboard">Go to My Briefs &rarr;</a>
        </div>
        <AgentCard
          label="6 agents · parallel"
          statuses={['running', 'running', 'running', 'running', 'running', 'running']}
        />
      </>
    );
  }

  if (pageState === 'timeout') {
    const ms = Date.now() - startTime;
    const elapsedStr = `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return (
      <>
        <svg style={{ display: 'block', marginBottom: 24 }} width="36" height="36" viewBox="0 0 24 24"
          fill="none" stroke="var(--color-secondary)" strokeWidth="1.5"
          strokeLinecap="square" strokeLinejoin="miter">
          <path d="M12 3 L22 20 L2 20 Z" /><path d="M12 9v5" /><path d="M12 17h.01" />
        </svg>
        <h1 style={STATE_H}>Taking Longer Than Expected</h1>
        <p style={BODY}>
          Your brief may still be processing. Check My Briefs in a few minutes.
          If it hasn&apos;t appeared after 10 minutes, contact support.
        </p>
        <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
          <a style={BTN_OUT} href="/dashboard">Go to My Briefs &rarr;</a>
          <a style={BTN_GHOST} href={contactHref}>Contact Support</a>
        </div>
        <AgentCard
          label={`elapsed ${elapsedStr}`}
          statuses={['running', 'running', 'running', 'running', 'running', 'queued']}
        />
      </>
    );
  }

  // error state
  return (
    <>
      <svg style={{ display: 'block', marginBottom: 24 }} width="36" height="36" viewBox="0 0 24 24"
        fill="none" stroke="var(--color-error)" strokeWidth="1.5" strokeLinecap="square">
        <circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" />
      </svg>
      <h1 style={{ ...STATE_H, color: 'var(--color-error)' }}>Something Went Wrong</h1>
      <p style={BODY}>
        We hit an issue generating your brief. Your payment has been noted.
        Contact support with your ref ID and we&apos;ll make it right.
      </p>
      {briefId && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-text-tertiary)', marginBottom: 28 }}>
          Ref: {briefId}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
        <a style={BTN_OUT} href={contactHref}>Contact Support &rarr;</a>
      </div>
      <AgentCard
        label="halted"
        statuses={['idle', 'idle', 'failed', 'idle', 'idle', 'failed']}
      />
    </>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function PendingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '56px 32px 96px' }}>
        <Suspense>
          <PendingContent />
        </Suspense>
      </main>
    </>
  );
}
