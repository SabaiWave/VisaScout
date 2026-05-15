import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSupabase } from '@/src/lib/supabase';
import BriefRenderer from '@/app/components/BriefRenderer';
import BriefActions from '@/app/components/BriefActions';
import type { VisaBrief } from '@/src/types/index';

interface BriefRow {
  id: string;
  created_at: string;
  nationality: string;
  destination: string;
  depth: string;
  brief_markdown: string;
}

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await getSupabase()
    .from('briefs')
    .select('id, created_at, nationality, destination, depth, brief_markdown')
    .eq('id', id)
    .single();

  if (error || !data) notFound();

  const row = data as BriefRow;
  let brief: VisaBrief;
  try {
    brief = JSON.parse(row.brief_markdown) as VisaBrief;
  } catch {
    notFound();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const shareUrl = `${appUrl}/brief/${row.id}`;

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

          <BriefRenderer brief={brief} />

          <BriefActions url={shareUrl} />
        </div>
      </main>
    </div>
  );
}
