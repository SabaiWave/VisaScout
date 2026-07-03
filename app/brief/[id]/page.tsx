import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { ArrowRight } from 'lucide-react';
import { isAdminUser } from '@/src/lib/adminAccess';
import { getSupabase } from '@/src/lib/supabase';
import BriefActions from '@/app/components/BriefActions';
import BriefRenderer from '@/app/components/BriefRenderer';
import { BriefHeader } from '@/app/components/BriefHeader';
import type { VisaBrief } from '@/src/types/index';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { BriefMeta } from '@/app/components/ui/BriefMeta';
import visaBriefFixture from '@/src/__fixtures__/visaBrief.json';
import { BriefProcessingBanner } from './BriefProcessingBanner';

const SIM_PDF_ERROR_ID = 'sim-pdf-error';
const SIM_CONFIDENCE_HIGH_ID   = 'sim-confidence-high';
const SIM_CONFIDENCE_MEDIUM_ID = 'sim-confidence-medium';
const SIM_CONFIDENCE_LOW_ID    = 'sim-confidence-low';
const CONFIDENCE_SIM_IDS = [SIM_CONFIDENCE_HIGH_ID, SIM_CONFIDENCE_MEDIUM_ID, SIM_CONFIDENCE_LOW_ID] as const;

interface BriefRow {
  id: string;
  created_at: string;
  nationality: string;
  destination: string;
  depth: string;
  brief_markdown: string | null;
  payment_status: string;
}

export default async function BriefPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const simPdfError = sp?.sim === 'pdf-error';

  const { userId } = await auth();
  const isAdmin = isAdminUser(userId ?? '');

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
        <BriefHeader />
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

  // Dev sim sentinel — no DB lookup, uses fixture brief
  if (id === SIM_PDF_ERROR_ID) {
    if (!isAdmin) notFound();
    const brief = visaBriefFixture as unknown as VisaBrief;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    return (
      <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
        <BriefHeader />
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
    .select('id, created_at, nationality, destination, depth, brief_markdown, payment_status')
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

  const isProcessing = !brief && (row.payment_status === 'queued' || row.payment_status === 'pending');

  return (
    <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <BriefHeader />

      <main className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-[760px] mx-auto">
          <div className="mb-8">
            <SectionHeading size="md" as="h1">
              {row.nationality} <ArrowRight size={20} style={{ display: 'inline', verticalAlign: 'middle', position: 'relative', top: '-1px' }} /> {row.destination}
            </SectionHeading>
            <BriefMeta depth={row.depth} generatedAt={row.created_at} className="mt-3" />
          </div>

          <div className="mt-8">
            {isProcessing ? (
              <BriefProcessingBanner briefId={row.id} />
            ) : brief ? (
              <BriefRenderer brief={brief} hideMetadata />
            ) : (
              <div
                className="px-4 py-3 rounded"
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
