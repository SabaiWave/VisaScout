import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSupabase } from '@/src/lib/supabase';
import BriefActions from '@/app/components/BriefActions';
import BriefRenderer from '@/app/components/BriefRenderer';
import type { VisaBrief } from '@/src/types/index';
import { Wordmark } from '@/app/components/ui/Wordmark';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { Button } from '@/app/components/ui/Button';
import { HeaderAuth } from '@/app/components/HeaderAuth';

interface BriefRow {
  id: string;
  created_at: string;
  nationality: string;
  destination: string;
  depth: string;
  brief_markdown: string | null;
  payment_status: string;
}

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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
      <nav
        className="sticky top-0 z-50 border-b px-4 sm:px-6 py-3 sm:py-4"
        style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-muted)' }}
      >
        <div className="max-w-[1120px] mx-auto flex items-center justify-between">
          <Wordmark />
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/app">Generate Brief</Link>
            </Button>
            <HeaderAuth />
          </div>
        </div>
      </nav>

      <main className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-[760px] mx-auto">
          <div className="mb-8">
            <SectionHeading size="md" as="h1">
              {row.nationality} → {row.destination}
            </SectionHeading>
            <p className="text-xs -mt-3" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {row.depth.toUpperCase()} DEPTH · {new Date(row.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <BriefActions url={shareUrl} briefId={row.id} depth={row.depth} />

          <div className="mt-8">
            {isProcessing ? (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded"
                style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}
              >
                <div
                  className="w-4 h-4 rounded-full animate-spin flex-shrink-0"
                  style={{ border: '2px solid var(--color-border-strong)', borderTopColor: 'var(--color-secondary)' }}
                />
                Brief is being generated — refresh in a minute.
              </div>
            ) : brief ? (
              <BriefRenderer brief={brief} />
            ) : (
              <div
                className="px-4 py-3 rounded"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-error)' }}
              >
                Brief content unavailable. Contact support at hello@visascout.io with reference: {row.id}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
