import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { ArrowRight, ArrowLeft, Archive } from 'lucide-react';
import { SidebarAccount } from './SidebarAccount';
import { VisaScoutUserButton } from '@/app/components/VisaScoutUserButton';
import { getSupabase } from '@/src/lib/supabase';
import { Wordmark } from '@/app/components/ui/Wordmark';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { ConfidenceBadge, DepthBadge } from '@/app/components/ui/Badge';
import { Button } from '@/app/components/ui/Button';
import { NavLink } from '@/app/components/ui/NavLink';

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
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
        <circle cx="12" cy="12" r="10"/>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
      </svg>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: 0 }}>
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
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {/* Mobile top nav — wordmark + UserButton (sidebar hidden on mobile) */}
        <nav
          className="flex lg:hidden items-center justify-between"
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--color-border-muted)',
          }}
        >
          <Wordmark />
          <VisaScoutUserButton />
        </nav>

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
        </div>

        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
            <SectionHeading size="md" as="h1" subtitle="Your saved visa intelligence briefs">
              MY BRIEFS
            </SectionHeading>
            <Button asChild style={{ whiteSpace: 'nowrap' }}>
              <Link href="/app">+ New Brief</Link>
            </Button>
          </div>

          {briefs.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
              }}>
                {briefs.map((brief) => (
                  <Link key={brief.id} href={`/brief/${brief.id}`} style={{ textDecoration: 'none' }}>
                    <div
                      className="visa-track-card"
                      style={{
                        background: 'var(--color-bg-elevated)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                        padding: '20px',
                        cursor: 'pointer',
                      }}
                    >
                      <p style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                        margin: '0 0 2px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}>
                        {brief.destination}
                      </p>
                      <p style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.8rem',
                        color: 'var(--color-text-tertiary)',
                        margin: '0 0 12px',
                      }}>
                        {brief.nationality}
                      </p>

                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <DepthBadge depth={brief.depth as 'quick' | 'standard' | 'deep'} />
                        {brief.overall_confidence && (
                          <ConfidenceBadge level={brief.overall_confidence as 'high' | 'medium' | 'low'} />
                        )}
                        {brief.degraded && (
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.05em',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(245,158,11,0.12)',
                            color: '#f59e0b',
                          }}>
                            DEGRADED
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                          {new Date(brief.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                          {' · '}
                          {new Date(brief.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false })} UTC
                        </span>
                        <ArrowRight size={15} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                  {page > 1 && (
                    <Link
                      href={`/dashboard?page=${page - 1}`}
                      className="dash-pagination-btn inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg border"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-text-secondary)',
                        textDecoration: 'none',
                        borderColor: 'var(--color-border-strong)',
                      }}
                    >
                      <ArrowLeft size={13} />
                      Prev
                    </Link>
                  )}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', padding: '0 0.5rem' }}>
                    {page} / {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={`/dashboard?page=${page + 1}`}
                      className="dash-pagination-btn inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg border"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--color-text-secondary)',
                        textDecoration: 'none',
                        borderColor: 'var(--color-border-strong)',
                      }}
                    >
                      Next
                      <ArrowRight size={13} />
                    </Link>
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
