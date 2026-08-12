'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BriefRailSkeleton } from './BriefRailSkeleton';
import { C, MONO, BARLOW, SK, SECTIONS } from './briefConstants';

const POLL_INTERVAL_MS = 5000;
const TIMEOUT_MS = 8 * 60 * 1000;
const MIN_DISPLAY_MS = 10000;

const NavTriangle = () => (
  <svg width="5" height="8" viewBox="0 0 5 8" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M0 0L5 4L0 8Z" />
  </svg>
);

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
    <div style={{ display: 'grid', gridTemplateColumns: '268px minmax(0,1fr)', gap: 40, alignItems: 'start' }}>

      {/* ── RAIL ── */}
      <BriefRailSkeleton briefId={briefId} depthLabel={depthLabel} agentRunning />

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
              <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}><NavTriangle /></span>
              Dashboard
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
            <Link href="/dashboard" style={{ color: C.accent, textDecoration: 'underline', textDecorationColor: 'rgba(200,120,10,0.4)' }}>
              Navigate away safely.
            </Link>
          </p>
        </div>

        {/* Section skeletons */}
        {SECTIONS.map((sec, i) => (
          <div key={sec.n} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 12 }}>
              <span style={{ fontFamily: BARLOW, fontWeight: 900, fontSize: 52, color: C.accent, lineHeight: 0.78 }}>
                {sec.n}
              </span>
              <span style={{ fontFamily: BARLOW, fontWeight: 800, fontSize: 30, textTransform: 'uppercase', color: C.ink }}>
                {sec.t}
              </span>
              <span style={{ flex: 1, height: 1, background: C.rim, alignSelf: 'center' }} />
            </div>
            <div style={{ border: `1px solid ${C.rim}`, background: C.groundUp, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: sec.lines }).map((_, j) => (
                <span key={j} style={{ ...SK, height: 13, width: j === sec.lines - 1 ? '60%' : '100%' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
