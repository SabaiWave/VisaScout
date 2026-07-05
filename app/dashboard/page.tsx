import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { getSupabase } from '@/src/lib/supabase';
import { getOrCreateUser } from '@/src/lib/users';
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
}

async function getUserBriefs(internalUserId: string, page: number): Promise<{ briefs: BriefRow[]; total: number }> {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await getSupabase()
    .from('briefs')
    .select('id, created_at, nationality, destination, depth, overall_confidence, payment_status, degraded', { count: 'exact' })
    .eq('user_id', internalUserId)
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
      padding: '5rem 2rem',
      gap: '1rem',
      textAlign: 'center',
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
        <circle cx="12" cy="12" r="10"/>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
      </svg>
      <p className="uppercase" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: 0 }}>
        No briefs saved yet.
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', margin: 0 }}>
        Use <strong>GENERATE BRIEF</strong> in the sidebar to get started.
      </p>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/sign-in');

  // briefs.user_id is the internal UUID from visascout.users, not the Clerk user ID
  const userRecord = await getOrCreateUser(clerkUser.id).catch(() => null);

  const params = await searchParams;
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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
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
