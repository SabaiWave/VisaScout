import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSupabase } from '@/src/lib/supabase';
import BriefActions from '@/app/components/BriefActions';
import BriefRenderer from '@/app/components/BriefRenderer';
import type { VisaBrief } from '@/src/types/index';

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
        className="sticky top-0 z-50 border-b px-6 py-4"
        style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-muted)' }}
      >
        <div className="max-w-[1120px] mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-bold uppercase tracking-widest no-underline"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
          >
            <span style={{ color: 'var(--color-secondary)' }}>//</span>{' '}VisaScout
          </Link>
          <Link
            href="/app"
            className="text-xs font-bold px-4 py-2 rounded uppercase tracking-wider transition-colors"
            style={{ background: 'var(--color-secondary)', color: '#fff', fontFamily: 'var(--font-mono)' }}
          >
            Generate Brief
          </Link>
        </div>
      </nav>

      <main className="max-w-[1120px] mx-auto px-6 py-10">
        <div className="max-w-[760px] mx-auto">
          <div className="mb-8">
            <h1
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}
            >
              <span style={{ color: 'var(--color-secondary)', marginRight: '0.5rem' }}>//</span>
              {row.nationality} → {row.destination}
            </h1>
            <div className="mb-4 h-px" style={{ background: 'linear-gradient(to right, rgba(99,102,241,0.5), transparent)' }} />
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {row.depth.toUpperCase()} DEPTH · {new Date(row.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <BriefActions url={shareUrl} />

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
