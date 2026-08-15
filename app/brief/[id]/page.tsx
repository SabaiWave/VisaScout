import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { AlertTriangle } from 'lucide-react';
import { isAdminUser } from '@/src/lib/adminAccess';
import { getSupabase } from '@/src/lib/supabase';
import BriefRenderer from '@/app/components/BriefRenderer';
import { BriefHeader } from '@/app/components/BriefHeader';
import type { VisaBrief } from '@/src/types/index';
import visaBriefFixture from '@/src/__fixtures__/visaBrief.json';
import { BriefProcessingBanner } from './BriefProcessingBanner';

const SIM_PDF_ERROR_ID = 'sim-pdf-error';
const SIM_CONFIDENCE_HIGH_ID   = 'sim-confidence-high';
const SIM_CONFIDENCE_MEDIUM_ID = 'sim-confidence-medium';
const SIM_CONFIDENCE_LOW_ID    = 'sim-confidence-low';
const SIM_DEGRADED_ID          = 'sim-degraded';
const SIM_RERUN_CAP_ID         = 'sim-rerun-cap';
// Fixture describes a US passport holder in Thailand
const SIM_NATIONALITY = 'United States';
const SIM_DESTINATION = 'Thailand';
const CONFIDENCE_SIM_IDS = [SIM_CONFIDENCE_HIGH_ID, SIM_CONFIDENCE_MEDIUM_ID, SIM_CONFIDENCE_LOW_ID] as const;

interface BriefRow {
  id: string;
  created_at: string;
  nationality: string;
  destination: string;
  depth: string;
  brief_markdown: string | null;
  payment_status: string;
  rerun_count: number;
}

export default async function BriefPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const pendingParam = sp?.pending === '1';

  const { userId } = await auth();
  const isAdmin = isAdminUser(userId ?? '');
  const showHeader = !userId;

  // Dev sim sentinels — confidence label states (no DB lookup, overrides fixture confidence fields)
  if ((CONFIDENCE_SIM_IDS as readonly string[]).includes(id)) {
    if (!isAdmin) notFound();
    const level = id === SIM_CONFIDENCE_HIGH_ID ? 'high' : id === SIM_CONFIDENCE_MEDIUM_ID ? 'medium' : 'low';
    const base = visaBriefFixture as unknown as VisaBrief;
    const brief: VisaBrief = {
      ...base,
      confidenceScore: { ...base.confidenceScore, overall: level },
      conflictReport:  { ...base.conflictReport,  overallConfidence: level },
    };
    return (
      <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
        {showHeader && <BriefHeader />}
        <main style={{ paddingTop: 24 }}>
          <BriefRenderer brief={brief} nationality={SIM_NATIONALITY} destination={SIM_DESTINATION} briefId={id} />
        </main>
      </div>
    );
  }

  // Dev sim sentinel — degraded brief with cap hit (no Re-run button, no DB lookup)
  if (id === SIM_RERUN_CAP_ID) {
    if (!isAdmin) notFound();
    const base = visaBriefFixture as unknown as VisaBrief;
    const brief: VisaBrief = {
      ...base,
      metadata: {
        ...base.metadata,
        depth: 'standard',
        degraded: true,
        agentStatuses: [
          { agent: 'OfficialPolicy',    status: 'failed',  confidence: 'low',    sourceTier: 4, durationMs: 3200 },
          { agent: 'RecentChanges',     status: 'success', confidence: 'high',   sourceTier: 1, durationMs: 980  },
          { agent: 'CommunityIntel',    status: 'success', confidence: 'medium', sourceTier: 4, durationMs: 1100 },
          { agent: 'EntryRequirements', status: 'success', confidence: 'high',   sourceTier: 1, durationMs: 870  },
          { agent: 'BorderRun',         status: 'success', confidence: 'medium', sourceTier: 2, durationMs: 1050 },
        ],
      },
    };
    return (
      <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
        {showHeader && <BriefHeader />}
        <main style={{ paddingTop: 24 }}>
          <BriefRenderer brief={brief} nationality={SIM_NATIONALITY} destination={SIM_DESTINATION} briefId={SIM_RERUN_CAP_ID} isPaidBrief canRerun={false} />
        </main>
      </div>
    );
  }

  // Dev sim sentinel — degraded brief with Re-run button (no DB lookup)
  if (id === SIM_DEGRADED_ID) {
    if (!isAdmin) notFound();
    const base = visaBriefFixture as unknown as VisaBrief;
    const brief: VisaBrief = {
      ...base,
      metadata: {
        ...base.metadata,
        depth: 'standard',
        degraded: true,
        agentStatuses: [
          { agent: 'OfficialPolicy',    status: 'failed',  confidence: 'low',    sourceTier: 4, durationMs: 3200 },
          { agent: 'RecentChanges',     status: 'success', confidence: 'high',   sourceTier: 1, durationMs: 980  },
          { agent: 'CommunityIntel',    status: 'success', confidence: 'medium', sourceTier: 4, durationMs: 1100 },
          { agent: 'EntryRequirements', status: 'success', confidence: 'high',   sourceTier: 1, durationMs: 870  },
          { agent: 'BorderRun',         status: 'success', confidence: 'medium', sourceTier: 2, durationMs: 1050 },
        ],
      },
    };
    return (
      <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
        {showHeader && <BriefHeader />}
        <main style={{ paddingTop: 24 }}>
          <BriefRenderer brief={brief} nationality={SIM_NATIONALITY} destination={SIM_DESTINATION} briefId={SIM_DEGRADED_ID} isPaidBrief canRerun />
        </main>
      </div>
    );
  }

  // Dev sim sentinel — no DB lookup, uses fixture brief
  if (id === SIM_PDF_ERROR_ID) {
    if (!isAdmin) notFound();
    const brief = visaBriefFixture as unknown as VisaBrief;
    return (
      <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
        {showHeader && <BriefHeader />}
        <main style={{ paddingTop: 24 }}>
          <BriefRenderer brief={brief} nationality={SIM_NATIONALITY} destination={SIM_DESTINATION} briefId={SIM_PDF_ERROR_ID} initialPdfError="PDF generation failed. Try again." />
        </main>
      </div>
    );
  }

  const { data, error } = await getSupabase()
    .from('briefs')
    .select('id, created_at, nationality, destination, depth, brief_markdown, payment_status, rerun_count')
    .eq('id', id)
    .single();

  if (error || !data) notFound();

  const row = data as BriefRow;

  let brief: VisaBrief | null = null;
  if (row.brief_markdown) {
    try {
      brief = JSON.parse(row.brief_markdown) as VisaBrief;
    } catch {
      brief = null;
    }
  }

  const paymentNotCompleted = row.payment_status === 'awaiting_payment';
  const isStillPending = !['unpaid', 'paid', 'error', 'awaiting_payment'].includes(row.payment_status);
  // pendingParam: user navigated from a GENERATING card — enforce skeleton gate even if brief is already done
  const isProcessing = !paymentNotCompleted && (pendingParam || (!brief && isStillPending));
  const isActuallyDone = pendingParam && !isStillPending;

  return (
    <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
      {showHeader && <BriefHeader />}

      <main style={{ paddingTop: '24px' }}>
        {isProcessing ? (
          <>
            {userId && (
              <div style={{ padding: '0 24px 12px' }}>
                <a
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5"
                  style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 700 }}
                >
                  <span aria-hidden style={{ display: 'inline-block', width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderRight: '5px solid currentColor', flexShrink: 0 }} />
                  Dashboard
                </a>
              </div>
            )}
            <div className="max-w-[1120px] mx-auto px-4 sm:px-6 pb-8">
              <BriefProcessingBanner
                briefId={row.id}
                isActuallyDone={isActuallyDone}
                pollForJob={row.payment_status === 'queued'}
                nationality={row.nationality}
                destination={row.destination}
                depth={row.depth}
                showDashboardLink={false}
              />
            </div>
          </>
        ) : (
          <>
            {/* Nav bar: back link */}
            {userId && (
              <div style={{ padding: '0 24px 12px' }}>
                <a
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5"
                  style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 700 }}
                >
                  <span aria-hidden style={{ display: 'inline-block', width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderRight: '5px solid currentColor', flexShrink: 0 }} />
                  Dashboard
                </a>
              </div>
            )}

            {/* Brief body — full width for BriefDocument's 1180px layout */}
            {paymentNotCompleted ? (
              /* State 5 Var A — Payment Not Completed card */
              <div className="max-w-[760px] mx-auto px-4" style={{ border: '1px solid var(--color-error-border)', background: 'var(--color-error-bg)', padding: 20 }}>
                <div className="flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-secondary)', marginBottom: 6 }}>
                  <AlertTriangle size={16} aria-hidden="true" style={{ color: 'var(--color-secondary)' }} />
                  Payment Not Completed
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.65, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
                  Your payment wasn&apos;t completed. The brief has not been generated.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                  <a href="/app" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: 'var(--color-secondary)', color: 'var(--color-bg-base)', border: '1px solid var(--color-secondary)', padding: '8px 20px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                    Complete Payment
                  </a>
                  <a href="/app" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-strong)', padding: '8px 20px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                    New Brief
                  </a>
                </div>
              </div>
            ) : brief ? (
              <BriefRenderer brief={brief} nationality={row.nationality} destination={row.destination} briefId={row.id} isPaidBrief={row.depth !== 'quick' && row.payment_status === 'paid'} canRerun={row.depth !== 'quick' && row.payment_status === 'paid' && (row.rerun_count ?? 0) < 1} />
            ) : (
              <div
                className="max-w-[760px] mx-auto px-4 py-3"
                style={{ background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--color-error)' }}
              >
                Brief content unavailable.{' '}
                <a href={`/contact?ref=${row.id}`} style={{ color: 'var(--color-error)', textDecoration: 'underline' }}>
                  Contact support
                </a>{' '}
                with reference: {row.id}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
