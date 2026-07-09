import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';

import { getSupabase } from '@/src/lib/supabase';
import { getOrCreateUser } from '@/src/lib/users';
import { isAdminUser } from '@/src/lib/adminAccess';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { NavLink } from '@/app/components/ui/NavLink';
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
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '52vh',
      gap: 0,
      textAlign: 'center',
    }}>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-secondary)',
        margin: '0 0 24px',
      }}>
        No briefs saved yet.
      </p>
      <Link
        href="/app"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--color-text-secondary)',
          textDecoration: 'none',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 'var(--radius-md)',
          background: 'transparent',
        }}
      >
        + Generate Brief
      </Link>
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

  // Admin-only: sim=empty bypasses DB and renders the empty state
  if (params.sim === 'empty' && isAdminUser(clerkUser.id)) {
    return (
      <>
        <div className="hidden lg:flex items-center justify-end gap-1 px-4" style={{ height: '52px', borderBottom: '1px solid var(--color-border-muted)' }}>
          <NavLink href="/">Home</NavLink>
          <NavLink href="/contact">Contact</NavLink>
        </div>
        <div className="px-4 sm:px-6 py-6 sm:py-8" style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <SectionHeading size="md" as="h1" subtitle="Your saved visa intelligence briefs">MY BRIEFS</SectionHeading>
          </div>
          <EmptyState />
        </div>
      </>
    );
  }

  // briefs.user_id is the internal UUID from visascout.users, not the Clerk user ID
  const userRecord = await getOrCreateUser(clerkUser.id).catch(() => null);

  const page = Math.max(1, parseInt(params.page ?? '1', 10));

  const { briefs, total } = await getUserBriefs(userRecord?.id ?? '', page);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveGeneration = briefs.some(b => ['queued', 'processing', 'pending'].includes(b.payment_status));

  return (
    <>
      {/* Desktop top bar */}
      <div
        className="hidden lg:flex items-center justify-end gap-1 px-4"
        style={{
          height: '52px',
          borderBottom: '1px solid var(--color-border-muted)',
        }}
      >
        <NavLink href="/">Home</NavLink>
        <NavLink href="/contact">Contact</NavLink>
      </div>

      <div className="px-4 sm:px-6 py-6 sm:py-8" style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <SectionHeading size="md" as="h1" subtitle="Your saved visa intelligence briefs">
            MY BRIEFS
          </SectionHeading>
        </div>

        <DashboardAutoRefresh hasGenerating={hasActiveGeneration} />
        {briefs.length === 0 ? (
          <EmptyState />
        ) : (
          <BriefGrid briefs={briefs} total={total} page={page} />
        )}
      </div>
    </>
  );
}
