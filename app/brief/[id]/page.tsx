import { notFound } from 'next/navigation';
import { supabase } from '@/src/lib/supabase';
import BriefRenderer from '@/app/components/BriefRenderer';
import BriefActions from '@/app/components/BriefActions';
import type { VisaBrief } from '@/src/types/index';
import { clientConfig } from '@/config/client';

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

  const { data, error } = await supabase
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
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-[1120px] mx-auto flex items-center justify-between">
          <a href="/" className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}>
            {clientConfig.brandName}
          </a>
          <span className="text-xs text-gray-400">{clientConfig.tagline}</span>
        </div>
      </nav>

      <main className="max-w-[1120px] mx-auto px-6 py-10">
        <div className="max-w-[760px] mx-auto">
          {/* Brief header */}
          <div className="mb-6">
            <h1
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}
            >
              {row.nationality} → {row.destination}
            </h1>
            <p className="text-xs text-gray-400 font-mono">
              {row.depth} depth · {new Date(row.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <BriefRenderer brief={brief} />

          <BriefActions url={shareUrl} />
        </div>
      </main>
    </div>
  );
}
