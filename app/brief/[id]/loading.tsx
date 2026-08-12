// Renders instantly while /brief/[id]/page.tsx resolves (auth + Supabase query).
// Prevents the blank flash between form submit → BriefProcessingBanner skeleton.

import { BriefRailSkeleton } from './BriefRailSkeleton';
import { C, BARLOW, SK, SECTIONS } from './briefConstants';

export default function BriefLoading() {
  return (
    <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <main style={{ paddingTop: '24px' }}>
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8">
          <div style={{ display: 'grid', gridTemplateColumns: '268px minmax(0,1fr)', gap: 40, alignItems: 'start' }}>

            {/* ── RAIL — single source of truth ── */}
            <BriefRailSkeleton />

            {/* ── BODY ── */}
            <div>
              <div style={{ marginBottom: 24 }}>
                <span style={{ ...SK, height: 28, width: '55%', marginBottom: 8 }} />
                <span style={{ ...SK, height: 9, width: '25%', marginBottom: 10 }} />
                <span style={{ ...SK, height: 12, width: '70%' }} />
              </div>

              {SECTIONS.map((sec) => (
                <div key={sec.n} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 12 }}>
                    <span style={{ fontFamily: BARLOW, fontWeight: 900, fontSize: 52, color: C.accent, lineHeight: 0.78 }}>{sec.n}</span>
                    <span style={{ fontFamily: BARLOW, fontWeight: 800, fontSize: 30, textTransform: 'uppercase', color: C.ink }}>{sec.t}</span>
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
        </div>
      </main>
    </div>
  );
}
