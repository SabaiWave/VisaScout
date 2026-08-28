import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';

import { getSupabase } from '@/src/lib/supabase';
import { getOrCreateUser } from '@/src/lib/users';
import { isAdminUser } from '@/src/lib/adminAccess';
import { BriefGrid } from './BriefGrid';
import { DashboardAutoRefresh } from './DashboardAutoRefresh';

const PAGE_SIZE = 12;

interface BriefRow {
  id: string;
  created_at: string;
  nationality: string;
  destination: string;
  depth: string;
  overall_confidence: string | null;
  payment_status: string;
  degraded: boolean;
  rerun_count: number;
}

async function getUserBriefs(internalUserId: string, page: number): Promise<{ briefs: BriefRow[]; total: number }> {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await getSupabase()
    .from('briefs')
    .select('id, created_at, nationality, destination, depth, overall_confidence, payment_status, degraded, rerun_count', { count: 'exact' })
    .eq('user_id', internalUserId)
    .neq('payment_status', 'awaiting_payment')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) return { briefs: [], total: 0 };
  return { briefs: (data ?? []) as BriefRow[], total: count ?? 0 };
}

function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: '52vh',
    }}>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-tertiary)',
        margin: 0,
        letterSpacing: '0.04em',
      }}>
        No briefs saved yet.
      </p>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sim?: string }>;
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  const params = await searchParams;

  // Admin-only: sim=error-row renders a fixture row with payment_status='error' (no DB)
  if (params.sim === 'error-row' && isAdminUser(clerkUser.id)) {
    const simBrief = {
      id: 'sim-error',
      created_at: new Date().toISOString(),
      nationality: 'United States',
      destination: 'Italy',
      depth: 'quick',
      overall_confidence: null,
      payment_status: 'error',
      degraded: false,
      rerun_count: 0,
    };
    return (
      <div className="px-4 sm:px-6 py-6 sm:py-8" style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: '2rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.05 }}>
            My Briefs
          </h1>
          <a href="/app" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-neutral)', background: 'var(--color-secondary)', border: '1px solid var(--color-secondary)', padding: '10px 22px', textDecoration: 'none' }}>
            Generate New Brief
          </a>
        </div>
        <BriefGrid briefs={[simBrief]} total={1} page={1} />
      </div>
    );
  }

  // Admin-only: sim=empty bypasses DB and renders the empty state
  if (params.sim === 'empty' && isAdminUser(clerkUser.id)) {
    return (
      <div className="px-4 sm:px-6 py-6 sm:py-8" style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: '2rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.05 }}>
            My Briefs
          </h1>
          <a href="/app" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-neutral)', background: 'var(--color-secondary)', border: '1px solid var(--color-secondary)', padding: '10px 22px', textDecoration: 'none' }}>
            Generate New Brief
          </a>
        </div>
        <EmptyState />
      </div>
    );
  }

  // briefs.user_id is the internal UUID from visascout.users, not the Clerk user ID
  const userRecord = await getOrCreateUser(clerkUser.id).catch(() => null);

  const page = Math.max(1, parseInt(params.page ?? '1', 10));

  const { briefs, total } = await getUserBriefs(userRecord?.id ?? '', page);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveGeneration = briefs.some(b => ['queued', 'processing', 'pending'].includes(b.payment_status));

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8" style={{ maxWidth: '1120px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: '2rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.05 }}>
          My Briefs
        </h1>
        <a
          href="/app"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-neutral)', background: 'var(--color-secondary)', border: '1px solid var(--color-secondary)', padding: '10px 22px', textDecoration: 'none', whiteSpace: 'nowrap' as const }}
        >
          Generate New Brief
        </a>
      </div>

      <DashboardAutoRefresh hasGenerating={hasActiveGeneration} />
      {briefs.length === 0 ? (
        <EmptyState />
      ) : (
        <BriefGrid briefs={briefs} total={total} page={page} />
      )}
    </div>
  );
}
