import { redirect } from 'next/navigation';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { getSupabase } from '@/src/lib/supabase';
import { isAdminUser } from '@/src/lib/adminAccess';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { Wordmark } from '@/app/components/ui/Wordmark';
import { NavLink } from '@/app/components/ui/NavLink';

async function getAdminMetrics() {
  const supabase = getSupabase();

  const [briefs, ipLogs, jobs, freeTierToday, freeTierWeek, freeTierAllTime, paidUsers] = await Promise.all([
    supabase
      .from('briefs')
      .select('depth, estimated_cost_usd, agent_statuses, destination, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('ip_abuse_log')
      .select('ip, user_id, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('brief_jobs')
      .select('status, created_at, error')
      .order('created_at', { ascending: false })
      .limit(20),
    // Free tier today
    supabase
      .from('free_brief_daily')
      .select('count')
      .eq('date', new Date().toISOString().slice(0, 10)),
    // Free tier this week
    supabase
      .from('free_brief_daily')
      .select('count')
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)),
    // Free tier all time
    supabase
      .from('free_brief_daily')
      .select('count'),
    // Distinct users who paid
    supabase
      .from('briefs')
      .select('user_id')
      .eq('payment_status', 'paid')
      .not('user_id', 'is', null),
  ]);

  const sumCounts = (rows: Array<{ count: number }> | null) =>
    (rows ?? []).reduce((s, r) => s + (r.count ?? 0), 0);

  const paidUserIds = new Set((paidUsers.data ?? []).map((r: { user_id: string }) => r.user_id));

  return {
    briefs: (briefs.data ?? []) as Array<{
      depth: string;
      estimated_cost_usd: number | null;
      agent_statuses: Array<{ agent: string; status: string; sourceTier: number }> | null;
      destination: string;
      created_at: string;
    }>,
    ipLogs: (ipLogs.data ?? []) as Array<{
      ip: string;
      user_id: string | null;
      reason: string | null;
      created_at: string;
    }>,
    jobs: (jobs.data ?? []) as Array<{
      status: string;
      created_at: string;
      error: string | null;
    }>,
    freeTierToday: sumCounts(freeTierToday.data as Array<{ count: number }> | null),
    freeTierWeek:  sumCounts(freeTierWeek.data  as Array<{ count: number }> | null),
    freeTierAllTime: sumCounts(freeTierAllTime.data as Array<{ count: number }> | null),
    subscriberCount: paidUserIds.size,
  };
}

export default async function AdminPage() {
  const { userId } = await auth();

  const isDev = process.env.ENVIRONMENT === 'development';
  if (!userId || (!isAdminUser(userId) && !isDev)) {
    redirect('/');
  }

  const client = await clerkClient();
  const [userCount, recentSignupsResult, metrics] = await Promise.all([
    client.users.getCount(),
    client.users.getUserList({ limit: 10, orderBy: '-created_at' }),
    getAdminMetrics(),
  ]);

  const { briefs, ipLogs, jobs, freeTierToday, freeTierWeek, freeTierAllTime, subscriberCount } = metrics;

  const totalCost = briefs.reduce((sum, b) => sum + (b.estimated_cost_usd ?? 0), 0);

  const byDepth = ['quick', 'standard', 'deep'].map(d => {
    const subset = briefs.filter(b => b.depth === d);
    const costs = subset.map(b => b.estimated_cost_usd ?? 0).filter(c => c > 0);
    const avg = costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
    return { depth: d, count: subset.length, avgCost: avg };
  });

  const tier1Coverage = briefs.length > 0
    ? (briefs.filter(b =>
        (b.agent_statuses ?? []).some(a => a.sourceTier === 1)
      ).length / briefs.length * 100).toFixed(1)
    : '0';

  const avgCost = totalCost / (briefs.length || 1);
  const outliers = briefs.filter(b => (b.estimated_cost_usd ?? 0) > avgCost * 2);

  const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'processing');
  const failedJobs = jobs.filter(j => j.status === 'failed');

  const recentUsers = recentSignupsResult.data ?? [];

  return (
    <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <nav
        className="sticky top-0 z-50 border-b px-6 py-4"
        style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-muted)' }}
      >
        <div className="max-w-[1000px] mx-auto flex items-center justify-between">
          <Wordmark />
          <div className="flex items-center gap-2">
            <NavLink href="/">Home</NavLink>
            {process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' && <NavLink href="/dev">Dev</NavLink>}
          </div>
        </div>
      </nav>

    <main className="px-4 sm:px-8 py-6 sm:py-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <SectionHeading size="md" as="h1" className="mb-8">
          Operations Dashboard
        </SectionHeading>

        {/* Summary row — users + revenue */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'TOTAL USERS',    value: userCount },
            { label: 'PAID USERS',     value: subscriberCount },
            { label: 'TOTAL REPORTS',  value: briefs.length },
            { label: 'TOTAL COST',     value: `$${totalCost.toFixed(4)}` },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: 'var(--shadow-card)',
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                {label}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Free tier usage row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'FREE TIER TODAY',     value: freeTierToday },
            { label: 'FREE TIER THIS WEEK', value: freeTierWeek },
            { label: 'FREE TIER ALL TIME',  value: freeTierAllTime },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: 'var(--shadow-card)',
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                {label}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-secondary-light)', margin: 0 }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Recent signups */}
        <Section title="RECENT SIGNUPS">
          {recentUsers.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>No users yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '400px', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                    {['Email', 'Signed Up'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border-muted)', color: 'var(--color-text-secondary)' }}>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        {u.emailAddresses[0]?.emailAddress ?? '—'}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                        {new Date(u.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Cost by depth */}
        <Section title="REPORTS BY DEPTH">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '360px', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Depth', 'Reports', 'Avg Cost', 'Baseline'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byDepth.map(({ depth, count, avgCost: ac }) => {
                  const baseline = depth === 'quick' ? '$0.23' : depth === 'standard' ? '$0.36' : '$0.65';
                  return (
                    <tr key={depth} style={{ borderBottom: '1px solid var(--color-border-muted)', color: 'var(--color-text-secondary)' }}>
                      <td style={{ padding: '0.6rem 0.75rem', textTransform: 'capitalize' }}>{depth}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>{count}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>{ac > 0 ? `$${ac.toFixed(4)}` : '—'}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-tertiary)' }}>{baseline}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.75rem', marginBottom: 0 }}>
            TIER 1 COVERAGE: {tier1Coverage}% · OUTLIER REPORTS ({">"} 2× avg): {outliers.length}
          </p>
        </Section>

        {/* Outlier reports */}
        {outliers.length > 0 && (
          <Section title="OUTLIER REPORTS (>2× AVG COST)">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '360px', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                    {['Destination', 'Depth', 'Cost', 'Date'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {outliers.slice(0, 20).map((b, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border-muted)', color: 'var(--color-amber)' }}>
                      <td style={{ padding: '0.6rem 0.75rem' }}>{b.destination}</td>
                      <td style={{ padding: '0.6rem 0.75rem', textTransform: 'capitalize' }}>{b.depth}</td>
                      <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>${(b.estimated_cost_usd ?? 0).toFixed(4)}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>{new Date(b.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Background jobs */}
        {(pendingJobs.length > 0 || failedJobs.length > 0) && (
          <Section title="BACKGROUND JOBS">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              {pendingJobs.length > 0 && (
                <p style={{ color: 'var(--color-amber)', marginBottom: '0.5rem' }}>
                  ⚠ {pendingJobs.length} job(s) pending / processing
                </p>
              )}
              {failedJobs.map((j, i) => (
                <p key={i} style={{ color: 'var(--color-error)', marginBottom: '0.25rem' }}>
                  ✗ FAILED — {new Date(j.created_at).toLocaleString()}: {j.error ?? 'unknown error'}
                </p>
              ))}
            </div>
          </Section>
        )}

        {/* IP abuse log */}
        <Section title="FLAGGED IPS">
          {ipLogs.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>No flagged IPs.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '480px', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                    {['IP', 'User ID', 'Reason', 'Date'].map(h => (
                      <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ipLogs.map((entry, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border-muted)', color: 'var(--color-text-secondary)' }}>
                      <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>{entry.ip}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-tertiary)' }}>{entry.user_id ?? '—'}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>{entry.reason ?? '—'}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>{new Date(entry.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <SectionHeading size="sm" className="mb-3">{title}</SectionHeading>
      <div style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '1rem',
        boxShadow: 'var(--shadow-card)',
      }}>
        {children}
      </div>
    </div>
  );
}
