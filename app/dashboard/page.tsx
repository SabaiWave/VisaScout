import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { ArrowRight, ArrowLeft, Archive } from 'lucide-react';
import { SidebarAccount } from './SidebarAccount';
import { MobileNav } from './MobileNav';
import { getSupabase } from '@/src/lib/supabase';
import { isAdminUser } from '@/src/lib/adminAccess';
import { Wordmark } from '@/app/components/ui/Wordmark';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { Button } from '@/app/components/ui/Button';
import { NavLink } from '@/app/components/ui/NavLink';
import { BriefCard } from './BriefCard';

const PAGE_SIZE = 10;

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

async function getUserBriefs(userId: string, page: number): Promise<{ briefs: BriefRow[]; total: number }> {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await getSupabase()
    .from('briefs')
    .select('id, created_at, nationality, destination, depth, overall_confidence, payment_status, degraded', { count: 'exact' })
    .eq('user_id', userId)
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
      <Button asChild>
        <Link href="/app">+ New Brief</Link>
      </Button>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect('/sign-in');

  const isAdmin = isAdminUser(user.id);
  const showDev = isAdmin && process.env.NODE_ENV === 'development';

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));

  const { briefs, total } = await getUserBriefs(user.id, page);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-base)' }}>
      {/* Sidebar — desktop only */}
      <aside
        className="hidden lg:flex"
        style={{
          width: '240px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          background: 'var(--color-bg-subtle)',
          borderRight: '1px solid var(--color-border-muted)',
          flexDirection: 'column',
          padding: '2rem 1rem 1.5rem',
          gap: '0.25rem',
        }}
      >
        <Wordmark className="block px-2 mb-6" />

        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--color-secondary-light)',
            background: 'var(--color-secondary-subtle)',
            textDecoration: 'none',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          <Archive size={14} />
          History
        </Link>

        <div style={{ flex: 1 }} />

        <SidebarAccount />
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bloom-app-bg)' }}>
        <MobileNav isAdmin={isAdmin} showDev={showDev} />

        {/* Desktop top bar — utility nav (Resend pattern) */}
        <div
          className="hidden lg:flex items-center justify-end gap-1 px-4"
          style={{
            height: '52px',
            borderBottom: '1px solid var(--color-border-muted)',
          }}
        >
          <NavLink href="/">Home</NavLink>
          <NavLink href="/contact">Contact</NavLink>
          {isAdmin && <NavLink href="/admin">Admin</NavLink>}
          {showDev && <NavLink href="/dev">Dev</NavLink>}
        </div>

        <div className="px-4 sm:px-6 py-6 sm:py-8" style={{ maxWidth: '1120px', margin: '0 auto' }}>
          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
            <SectionHeading size="md" as="h1" subtitle="Your saved visa intelligence briefs">
              MY BRIEFS
            </SectionHeading>
            {briefs.length > 0 && (
              <Button asChild style={{ whiteSpace: 'nowrap' }}>
                <Link href="/app">+ New Brief</Link>
              </Button>
            )}
          </div>

          {briefs.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
              }}>
                {briefs.map((brief) => (
                  <BriefCard key={brief.id} brief={brief} />
                ))}
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                  {page > 1 && (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="dash-pagination-btn inline-flex items-center gap-1.5 py-2"
                      style={{ borderColor: 'var(--color-border-strong)' }}
                    >
                      <Link href={`/dashboard?page=${page - 1}`}>
                        <ArrowLeft size={13} />
                        Prev
                      </Link>
                    </Button>
                  )}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', padding: '0 0.5rem' }}>
                    {page} / {totalPages}
                  </span>
                  {page < totalPages && (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="dash-pagination-btn inline-flex items-center gap-1.5 py-2"
                      style={{ borderColor: 'var(--color-border-strong)' }}
                    >
                      <Link href={`/dashboard?page=${page + 1}`}>
                        Next
                        <ArrowRight size={13} />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
