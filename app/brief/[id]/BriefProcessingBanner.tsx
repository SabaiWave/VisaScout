'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const POLL_INTERVAL_MS = 5000;
const TIMEOUT_MS = 8 * 60 * 1000;
// Minimum skeleton display time before revealing content — ensures
// the GENERATING card → skeleton → content sequence is always visible.
const MIN_DISPLAY_MS = 10000;

// Cartographic Dark tokens — matches BriefDocument design system
const C = {
  stage:      '#060c12',
  groundUp:   '#0a1520',
  groundSub:  '#0e1c28',
  rim:        '#1e3040',
  rimSoft:    '#16242f',
  accent:     '#c8780a',
  accentRim:  'rgba(200,120,10,0.34)',
  ink:        '#dceaf6',
  ink2:       '#8fb2c8',
  ink3:       '#5f849e',
  ink4:       '#54809d',
} as const;

const MONO = "'JetBrains Mono', monospace";
const BARLOW = "'Barlow Condensed', sans-serif";

const NavTriangle = () => (
  <svg width="5" height="8" viewBox="0 0 5 8" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M0 0L5 4L0 8Z" />
  </svg>
);

const INJECTED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800;900&display=swap');
@keyframes bpb-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

const SK: React.CSSProperties = {
  background: `linear-gradient(90deg, ${C.groundSub} 25%, ${C.rimSoft} 50%, ${C.groundSub} 75%)`,
  backgroundSize: '200% 100%',
  animation: 'bpb-shimmer 1.8s infinite',
  borderRadius: 0,
  display: 'block',
};

// ── RP panel header row ───────────────────────────────────────────────────────

function RpH({ label, meta }: { label: string; meta?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: C.groundUp, borderBottom: `1px solid ${C.rim}` }}>
      <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${C.accentRim}, transparent)` }} />
      {meta && (
        <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.14em', color: C.ink4, whiteSpace: 'nowrap' }}>
          {meta}
        </span>
      )}
    </div>
  );
}

// ── Animated scanning dots ────────────────────────────────────────────────────

function ScanDots() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % 3), 450);
    return () => clearInterval(id);
  }, []);
  return <span style={{ display: 'inline-block', width: '3ch', textAlign: 'left' }}>{'...'.slice(0, tick + 1)}</span>;
}

// ── Data ─────────────────────────────────────────────────────────────────────

const AGENTS = [
  { label: 'OFFICIAL POLICY',    tier: 'T1',    queued: false },
  { label: 'RECENT CHANGES',     tier: 'T1·T2', queued: false },
  { label: 'ENTRY REQUIREMENTS', tier: 'T1',    queued: false },
  { label: 'COMMUNITY INTEL',    tier: 'T4',    queued: false },
  { label: 'BORDER RUN',         tier: 'T1·T4', queued: false },
];

const SECTIONS = [
  { n: '01', t: 'PARSED SITUATION',    lines: 2 },
  { n: '02', t: 'RECOMMENDED ACTION',  lines: 3 },
  { n: '03', t: 'VISA OPTIONS',        lines: 3 },
  { n: '04', t: 'ENTRY REQUIREMENTS',  lines: 2 },
  { n: '05', t: 'BORDER RUN ANALYSIS', lines: 2 },
  { n: '06', t: 'RECENT CHANGES',      lines: 2 },
  { n: '07', t: 'CONFLICT REPORT',     lines: 2 },
  { n: '08', t: 'CITATIONS',           lines: 1 },
];

// ── Timeout state ─────────────────────────────────────────────────────────────

function TimeoutState({ briefId }: { briefId: string }) {
  const router = useRouter();
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.accent, marginBottom: 12 }}>
        Taking Longer Than Expected
      </p>
      <p style={{ fontFamily: MONO, fontSize: 10, color: C.ink3, maxWidth: 360, margin: '0 auto 12px', lineHeight: 1.7 }}>
        Your brief is still running. Check your dashboard in a few minutes. If it doesn't appear, get in touch and we'll sort it out.
      </p>
      <p style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, marginBottom: 20 }}>Ref: {briefId}</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: C.accent, color: C.stage, border: 'none', padding: '8px 18px', cursor: 'pointer' }}
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => router.push(`/contact?ref=${briefId}`)}
          style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'transparent', color: C.ink3, border: `1px solid ${C.rim}`, padding: '8px 18px', cursor: 'pointer' }}
        >
          Contact Us
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BriefProcessingBanner({
  briefId,
  isActuallyDone = false,
  pollForJob = false,
  nationality,
  destination,
  depth = 'quick',
  showDashboardLink = false,
}: {
  briefId: string;
  isActuallyDone?: boolean;
  pollForJob?: boolean;
  nationality?: string;
  destination?: string;
  depth?: string;
  showDashboardLink?: boolean;
}) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    if (isActuallyDone) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      const t = setTimeout(() => {
        router.replace(`/brief/${briefId}`);
      }, remaining);
      return () => clearTimeout(t);
    }

    const tick = () => {
      if (Date.now() - startTime > TIMEOUT_MS) {
        setTimedOut(true);
        return false;
      }
      if (pollForJob) {
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

  if (timedOut) return <TimeoutState briefId={briefId} />;

  const depthLabel = depth === 'quick' ? 'SCOUT' : depth === 'standard' ? 'INTEL' : 'DOSSIER';
  const natDisplay = nationality?.toUpperCase() ?? 'PASSPORT';
  const destDisplay = destination?.toUpperCase() ?? 'DESTINATION';

  return (
    <>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style dangerouslySetInnerHTML={{ __html: INJECTED_CSS }} />
      <div style={{ display: 'grid', gridTemplateColumns: '268px minmax(0,1fr)', gap: 40, alignItems: 'start' }}>

        {/* ── RAIL ── */}
        <div style={{ position: 'sticky', top: 52, maxHeight: 'calc(100vh - 72px)', overflowY: 'auto' }}>

          {/* Panel 1: Brief Identity */}
          <div style={{ border: `1px solid ${C.rim}`, marginBottom: 12 }}>
            <RpH label="BRIEF IDENTITY" meta={depthLabel} />
            <div style={{ padding: '14px 16px', background: C.groundUp }}>
              <div style={{ fontFamily: BARLOW, fontWeight: 900, fontSize: 15, letterSpacing: '0.04em', marginBottom: 6, lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: C.accent }}>{natDisplay}</span>
                <span style={{ color: C.ink3, display: 'flex', alignItems: 'center' }}><NavTriangle /></span>
                <span style={{ color: C.ink }}>{destDisplay}</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.08em', wordBreak: 'break-all' }}>
                {briefId}
              </div>
            </div>
          </div>

          {/* Panel 2: Pipeline */}
          <div style={{ border: `1px solid ${C.rim}`, marginBottom: 12 }}>
            <RpH label="PIPELINE" meta="5 AGENTS" />
            <div style={{ borderLeft: `2px solid ${C.accent}` }}>
              {AGENTS.map((agent, i) => (
                <div key={agent.label} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 12px',
                  borderBottom: i < AGENTS.length - 1 ? `1px solid ${C.rimSoft}` : 'none',
                  background: agent.queued ? 'transparent' : C.groundUp,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: agent.queued ? C.ink4 : C.accent }} />
                  <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: agent.queued ? C.ink4 : C.ink, flex: 1 }}>
                    {agent.label}
                  </span>
                  {agent.tier && (
                    <span style={{ fontFamily: MONO, fontSize: 7, color: C.ink4, letterSpacing: '0.06em' }}>{agent.tier}</span>
                  )}
                  <span style={{ fontFamily: MONO, fontSize: 8, color: agent.queued ? C.ink4 : C.accent, letterSpacing: '0.04em' }}>
                    {agent.queued ? 'QUEUED' : <ScanDots />}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 3: Contents */}
          <div style={{ border: `1px solid ${C.rim}` }}>
            <RpH label="CONTENTS" meta="LOADING" />
            <div style={{ padding: '6px 0' }}>
              {SECTIONS.map((sec, i) => (
                <div key={sec.n} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 12px',
                  borderLeft: i === 0 ? `2px solid ${C.accent}` : '2px solid transparent',
                }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: i === 0 ? C.accent : C.ink4, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                    §{sec.n}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 8, color: i === 0 ? C.ink2 : C.ink4, letterSpacing: '0.04em', flex: 1 }}>
                    {sec.t}
                  </span>
                  <span style={{ ...SK, width: 60, height: 6, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div>
          {/* Brief header */}
          <div style={{ marginBottom: 24 }}>
            {showDashboardLink && (
              <Link href="/dashboard" style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontFamily: MONO, fontSize: 9, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ink4, textDecoration: 'none',
                marginBottom: 10,
              }}>
                &larr; Dashboard
              </Link>
            )}
            <div style={{ fontFamily: BARLOW, fontWeight: 900, fontSize: 28, color: C.ink, textTransform: 'uppercase', lineHeight: 1, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: C.accent }}>{natDisplay}</span>
              <span style={{ color: C.ink3, display: 'flex', alignItems: 'center' }}><NavTriangle /></span>
              <span>{destDisplay}</span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: C.ink4, letterSpacing: '0.1em', marginBottom: 10 }}>
              {depthLabel} DEPTH
            </div>
            <p style={{ fontFamily: MONO, fontSize: 12, color: C.ink3, lineHeight: 1.7 }}>
              Brief generating in background.{' '}
              <Link href="/dashboard" style={{ color: C.ink2, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Navigate away safely <NavTriangle />
              </Link>
            </p>
          </div>

          {/* Section skeletons */}
          {SECTIONS.map((sec, i) => (
            <div key={sec.n} style={{ marginBottom: 24 }}>
              {/* Section heading — visible, not skeleton */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 12 }}>
                <span style={{ fontFamily: BARLOW, fontWeight: 900, fontSize: 52, color: C.accent, lineHeight: 0.78 }}>
                  {sec.n}
                </span>
                <span style={{ fontFamily: BARLOW, fontWeight: 800, fontSize: 30, textTransform: 'uppercase', color: C.ink }}>
                  {sec.t}
                </span>
                <span style={{ flex: 1, height: 1, background: C.rim, alignSelf: 'center' }} />
              </div>
              {/* Skeleton card */}
              <div style={{ border: `1px solid ${C.rim}`, background: C.groundUp, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from({ length: sec.lines }).map((_, j) => (
                  <span key={j} style={{ ...SK, height: 13, width: j === sec.lines - 1 ? '60%' : '100%' }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
