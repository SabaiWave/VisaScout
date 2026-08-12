'use client';

import { useEffect, useState } from 'react';
import { C, MONO, SK, AGENTS, SECTIONS } from './briefConstants';

const INJECTED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800;900&display=swap');
@keyframes bpb-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

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

function ScanDots() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % 3), 450);
    return () => clearInterval(id);
  }, []);
  return <span style={{ display: 'inline-block', width: '3ch', textAlign: 'left' }}>{'...'.slice(0, tick + 1)}</span>;
}

export function BriefRailSkeleton({
  briefId,
  depthLabel,
  agentRunning = false,
}: {
  briefId?: string;
  depthLabel?: string;
  agentRunning?: boolean;
}) {
  return (
    <>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style dangerouslySetInnerHTML={{ __html: INJECTED_CSS }} />
      <div style={{ position: 'sticky', top: 52, maxHeight: 'calc(100vh - 72px)', overflowY: 'auto' }}>

        {/* Panel 1: Brief ID */}
        <div style={{ border: `1px solid ${C.rim}`, marginBottom: 16 }}>
          <RpH label="BRIEF ID" meta={depthLabel} />
          <div style={{ padding: '12px 11px', background: C.groundUp }}>
            {briefId ? (
              <div style={{ fontFamily: MONO, fontSize: 8.5, color: C.ink4, letterSpacing: '0.11em', textTransform: 'uppercase', fontWeight: 700, lineHeight: 1.95, wordBreak: 'break-all' }}>
                {briefId}
              </div>
            ) : (
              <span style={{ ...SK, height: 8, width: '90%' }} />
            )}
          </div>
        </div>

        {/* Panel 2: Pipeline */}
        <div style={{ border: `1px solid ${C.rim}`, marginBottom: 16 }}>
          <RpH label="PIPELINE" meta="5 AGENTS" />
          <div style={{ borderLeft: `2px solid ${C.accent}` }}>
            {AGENTS.map((agent, i) => (
              <div key={agent.label} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 12px',
                borderBottom: i < AGENTS.length - 1 ? `1px solid ${C.rimSoft}` : 'none',
                background: agentRunning ? C.groundUp : 'transparent',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: agentRunning ? C.accent : C.ink4 }} />
                <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: agentRunning ? C.ink : C.ink4, flex: 1 }}>
                  {agent.label}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 8, color: agentRunning ? C.accent : C.ink4, letterSpacing: '0.04em' }}>
                  {agentRunning ? <ScanDots /> : 'QUEUED'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 3: Contents */}
        <div style={{ border: `1px solid ${C.rim}` }}>
          <RpH label="CONTENTS" meta="LOADING" />
          <div>
            {SECTIONS.map((sec, i) => (
              <div key={sec.n} style={{
                display: 'grid', gridTemplateColumns: '19px minmax(0,1fr) auto',
                alignItems: 'center', gap: 9,
                padding: '7px 11px 7px 9px',
                borderLeft: i === 0 ? `2px solid ${C.accent}` : '2px solid transparent',
                borderBottom: i < SECTIONS.length - 1 ? `1px solid ${C.rimSoft}` : 'none',
                background: i === 0 ? C.groundUp : 'transparent',
              }}>
                <span style={{ fontFamily: MONO, fontSize: 8, color: i === 0 ? C.accent : C.ink4, letterSpacing: '0.13em' }}>
                  {sec.n}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: i === 0 ? C.ink : C.ink3, letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sec.t}
                </span>
                <span style={{ ...SK, width: 40, height: 6, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
