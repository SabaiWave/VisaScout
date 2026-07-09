import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { isAdminUser } from '@/src/lib/adminAccess';
import { getSupabase } from '@/src/lib/supabase';
import BriefActions from '@/app/components/BriefActions';
import BriefRenderer from '@/app/components/BriefRenderer';
import { BriefHeader } from '@/app/components/BriefHeader';
import { BriefCopyLink } from '@/app/components/BriefCopyLink';
import type { VisaBrief } from '@/src/types/index';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { BriefMeta } from '@/app/components/ui/BriefMeta';
import visaBriefFixture from '@/src/__fixtures__/visaBrief.json';
import { BriefProcessingBanner } from './BriefProcessingBanner';

const SIM_PDF_ERROR_ID = 'sim-pdf-error';
const SIM_CONFIDENCE_HIGH_ID   = 'sim-confidence-high';
const SIM_CONFIDENCE_MEDIUM_ID = 'sim-confidence-medium';
const SIM_CONFIDENCE_LOW_ID    = 'sim-confidence-low';
const SIM_DEGRADED_ID          = 'sim-degraded';
const SIM_RERUN_CAP_ID         = 'sim-rerun-cap';
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
  const simPdfError = sp?.sim === 'pdf-error';
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    return (
      <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
        {showHeader && <BriefHeader />}
        <main className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="max-w-[760px] mx-auto">
            <div className="mb-8">
              <SectionHeading size="md" as="h1">American <ArrowRight size={20} style={{ display: 'inline', verticalAlign: 'middle', position: 'relative', top: '-1px' }} /> Thailand</SectionHeading>
              <BriefMeta depth="quick" generatedAt={new Date().toISOString()} className="mt-3" />
            </div>
            <div className="mt-8">
              <BriefRenderer brief={brief} hideMetadata />
            </div>
            <BriefActions url={`${appUrl}/brief/${id}`} briefId={id} depth="quick" />
          </div>
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    return (
      <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
        {showHeader && <BriefHeader />}
        <main className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="max-w-[760px] mx-auto">
            <div className="mb-8">
              <SectionHeading size="md" as="h1">American <ArrowRight size={20} style={{ display: 'inline', verticalAlign: 'middle', position: 'relative', top: '-1px' }} /> Portugal</SectionHeading>
              <BriefMeta depth="standard" generatedAt={new Date().toISOString()} degraded className="mt-3" />
            </div>
            <div className="mt-8">
              <BriefRenderer brief={brief} hideMetadata briefId={SIM_RERUN_CAP_ID} isPaidBrief canRerun={false} />
            </div>
            <BriefActions url={`${appUrl}/brief/${SIM_RERUN_CAP_ID}`} briefId={SIM_RERUN_CAP_ID} depth="standard" />
          </div>
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    return (
      <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
        {showHeader && <BriefHeader />}
        <main className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="max-w-[760px] mx-auto">
            <div className="mb-8">
              <SectionHeading size="md" as="h1">American <ArrowRight size={20} style={{ display: 'inline', verticalAlign: 'middle', position: 'relative', top: '-1px' }} /> Portugal</SectionHeading>
              <BriefMeta depth="standard" generatedAt={new Date().toISOString()} degraded className="mt-3" />
            </div>
            <div className="mt-8">
              <BriefRenderer brief={brief} hideMetadata briefId={SIM_DEGRADED_ID} isPaidBrief canRerun />
            </div>
            <BriefActions url={`${appUrl}/brief/${SIM_DEGRADED_ID}`} briefId={SIM_DEGRADED_ID} depth="standard" />
          </div>
        </main>
      </div>
    );
  }

  // Dev sim sentinel — no DB lookup, uses fixture brief
  if (id === SIM_PDF_ERROR_ID) {
    if (!isAdmin) notFound();
    const brief = visaBriefFixture as unknown as VisaBrief;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    return (
      <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
        {showHeader && <BriefHeader />}
        <main className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="max-w-[760px] mx-auto">
            <div className="mb-8">
              <SectionHeading size="md" as="h1">American <ArrowRight size={20} style={{ display: 'inline', verticalAlign: 'middle', position: 'relative', top: '-1px' }} /> Thailand</SectionHeading>
              <BriefMeta depth="quick" generatedAt={new Date().toISOString()} className="mt-3" />
            </div>
            <div className="mt-8">
              <BriefRenderer brief={brief} hideMetadata />
            </div>
            <BriefActions url={`${appUrl}/brief/${SIM_PDF_ERROR_ID}`} briefId={SIM_PDF_ERROR_ID} depth="quick" forceError={true} />
          </div>
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const shareUrl = `${appUrl}/brief/${row.id}`;

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

      <main className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-[760px] mx-auto">
          <div className="mb-6">
            {userId && (
              <a
                href="/dashboard"
                className="inline-flex items-center gap-1 mb-4 text-xs font-bold uppercase"
                style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textDecoration: 'none' }}
              >
                <ChevronLeft size={12} />
                Dashboard
              </a>
            )}
            <SectionHeading size="md" as="h1">
              {row.nationality} <ArrowRight size={20} style={{ display: 'inline', verticalAlign: 'middle', position: 'relative', top: '-1px' }} /> {row.destination}
            </SectionHeading>
            <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
              <BriefMeta depth={row.depth} generatedAt={row.created_at} />
              {brief && <BriefCopyLink url={shareUrl} />}
            </div>
          </div>

          <div>
            {paymentNotCompleted ? (
              <div
                className="px-4 py-3 rounded-lg"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--color-amber)' }}
              >
                Payment was not completed. No brief was generated.{' '}
                <a href="/app" style={{ color: 'var(--color-amber)', textDecoration: 'underline' }}>
                  Start a new brief
                </a>
              </div>
            ) : isProcessing ? (
              <BriefProcessingBanner briefId={row.id} isActuallyDone={isActuallyDone} pollForJob={row.payment_status === 'queued'} />
            ) : brief ? (
              <BriefRenderer brief={brief} hideMetadata briefId={row.id} isPaidBrief={row.depth !== 'quick' && row.payment_status === 'paid'} canRerun={row.depth !== 'quick' && row.payment_status === 'paid' && (row.rerun_count ?? 0) < 1} />
            ) : (
              <div
                className="px-4 py-3 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--color-error)' }}
              >
                Brief content unavailable.{' '}
                <a href={`/contact?ref=${row.id}`} style={{ color: 'var(--color-error)', textDecoration: 'underline' }}>
                  Contact support
                </a>{' '}
                with reference: {row.id}
              </div>
            )}
          </div>

          {brief && <BriefActions url={shareUrl} briefId={row.id} depth={row.depth} forceError={simPdfError} />}
        </div>
      </main>
    </div>
  );
}
