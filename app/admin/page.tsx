import { redirect } from 'next/navigation';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { Check, X, ArrowRight, AlertTriangle } from 'lucide-react';
import { getSupabase } from '@/src/lib/supabase';
import { isAdminUser } from '@/src/lib/adminAccess';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { NavLink } from '@/app/components/ui/NavLink';
import { ClearBriefButton } from '@/app/components/admin/ClearBriefButton';
import { RetryBriefButton } from '@/app/components/admin/RetryBriefButton';
import { ForceQueueButton } from '@/app/components/admin/ForceQueueButton';
import { RevokeEarlyAccessButton } from '@/app/components/admin/RevokeEarlyAccessButton';

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
      .select('id, brief_id, status, created_at, started_at, error')
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
      id: string;
      brief_id: string;
      status: string;
      created_at: string;
      started_at: string | null;
      error: string | null;
    }>,
    freeTierToday: sumCounts(freeTierToday.data as Array<{ count: number }> | null),
    freeTierWeek:  sumCounts(freeTierWeek.data  as Array<{ count: number }> | null),
    freeTierAllTime: sumCounts(freeTierAllTime.data as Array<{ count: number }> | null),
    subscriberCount: paidUserIds.size,
  };
}

interface StuckBrief {
  id: string;
  created_at: string;
  nationality: string;
  destination: string;
  depth: string;
  payment_status: string;
  stripe_session_id: string | null;
  user_id: string | null;
  job: { id: string; status: string; started_at: string | null; error: string | null } | null;
}

interface InviteUser {
  id: string;
  clerk_user_id: string;
  invite_code: string;
  invited_at: string;
  briefs_generated: number;
  last_brief_at: string | null;
  invite_revoked_at: string | null;
}

async function getInviteUsers(): Promise<InviteUser[]> {
  const { data } = await getSupabase()
    .from('users')
    .select('id, clerk_user_id, invite_code, invited_at, briefs_generated, last_brief_at, invite_revoked_at')
    .not('invite_code', 'is', null)
    .order('invited_at', { ascending: false });
  return (data ?? []) as InviteUser[];
}

async function getStuckBriefs(): Promise<StuckBrief[]> {
  const supabase = getSupabase();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: briefs } = await supabase
    .from('briefs')
    .select('id, created_at, nationality, destination, depth, payment_status, stripe_session_id, user_id')
    .in('payment_status', ['pending', 'queued'])
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!briefs || briefs.length === 0) return [];

  const { data: jobs } = await supabase
    .from('brief_jobs')
    .select('id, brief_id, status, started_at, error')
    .in('brief_id', briefs.map(b => b.id));

  const jobMap = new Map((jobs ?? []).map(j => [j.brief_id as string, j as { id: string; status: string; started_at: string | null; error: string | null }]));

  return briefs.map(b => ({
    ...(b as { id: string; created_at: string; nationality: string; destination: string; depth: string; payment_status: string; stripe_session_id: string | null; user_id: string | null }),
    job: jobMap.get(b.id) ?? null,
  }));
}

export default async function AdminPage() {
  const { userId } = await auth();

  const isDev = process.env.ENVIRONMENT === 'development';
  if (!userId || (!isAdminUser(userId) && !isDev)) {
    redirect('/');
  }

  const client = await clerkClient();
  const [userCount, recentSignupsResult, metrics, stuckBriefs, inviteUsers] = await Promise.all([
    client.users.getCount(),
    client.users.getUserList({ limit: 10, orderBy: '-created_at' }),
    getAdminMetrics(),
    getStuckBriefs(),
    getInviteUsers(),
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
    <>
      <div className="hidden lg:flex items-center justify-end gap-1 px-4" style={{ height: '52px', borderBottom: '1px solid var(--color-border-muted)' }}>
        <NavLink href="/">Home</NavLink>
        <NavLink href="/contact">Contact</NavLink>
      </div>
      <main className="px-4 sm:px-6 py-6 sm:py-8" style={{ fontFamily: 'var(--font-body)' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <SectionHeading size="md" as="h1" className="mb-8">
          OPERATIONS DASHBOARD
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
              borderRadius: 'var(--radius-lg)',
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
              borderRadius: 'var(--radius-lg)',
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

        {/* Support — stuck briefs */}
        <Section title="STUCK BRIEFS">
          <div className="mb-4" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { n: '1', label: 'No Stripe session', action: 'Resend webhook in Stripe dashboard', color: 'var(--color-error)' },
              { n: '2', label: 'Session exists, no job', action: 'Force Queue', color: 'var(--color-secondary-light)' },
              { n: '3', label: 'Job stuck or failed', action: 'Retry', color: 'var(--color-amber)' },
            ].map(({ n, label, action, color }) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                <span style={{ color, fontWeight: 700, flexShrink: 0 }}>{n}</span>
                <span style={{ color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
                <ArrowRight size={10} style={{ color: 'var(--color-border-strong)', flexShrink: 0 }} />
                <span style={{ color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{action}</span>
              </div>
            ))}
          </div>
          {stuckBriefs.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} />
              All clear. No stuck briefs in the last 7 days.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                    {['Brief ID', 'Destination', 'Depth', 'Created', 'Payment', 'Stripe Session', 'Job', 'Action'].map(h => (
                      <th key={h} style={{ padding: '0.4rem 0.75rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stuckBriefs.map((b) => {
                    const hasSession = !!b.stripe_session_id;
                    const job = b.job;
                    const jobStuck = job?.status === 'processing' && job.started_at
                      ? Date.now() - new Date(job.started_at).getTime() > 6 * 60 * 1000
                      : false;
                    const jobFailed = job?.status === 'failed';
                    const jobRunning = job && !jobStuck && !jobFailed;

                    // Determine step
                    const step = !hasSession ? 1 : !job ? 2 : (jobStuck || jobFailed) ? 3 : 0;
                    const stepColor = step === 1 ? 'var(--color-error)' : step === 2 ? 'var(--color-secondary-light)' : step === 3 ? 'var(--color-amber)' : 'var(--color-text-tertiary)';

                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border-muted)' }}>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-tertiary)', fontSize: '0.65rem' }}>
                          {b.id.slice(0, 8)}…
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
                          {b.destination}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                          {b.depth}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                          {new Date(b.created_at).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: stepColor, textTransform: 'uppercase' }}>
                          {b.payment_status}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.65rem' }}>
                          {hasSession
                            ? <span style={{ color: 'var(--color-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Check size={12} />{b.stripe_session_id!.slice(0, 14)}&hellip;</span>
                            : <span style={{ color: 'var(--color-error)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><X size={12} />None</span>
                          }
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>
                          {!job ? '—' : jobRunning ? <span style={{ color: 'var(--color-secondary-light)' }}>Running</span> : <span style={{ color: jobFailed ? 'var(--color-error)' : 'var(--color-amber)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{job.status}{jobStuck && <AlertTriangle size={10} />}</span>}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>
                          {step === 1 && (
                            <span style={{ color: 'var(--color-error)', fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ArrowRight size={10} />Resend in Stripe</span>
                          )}
                          {step === 2 && (
                            <ForceQueueButton briefId={b.id} />
                          )}
                          {step === 3 && job && (
                            <RetryBriefButton briefId={b.id} jobId={job.id} />
                          )}
                          {step === 0 && (
                            <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.65rem' }}>Pipeline running…</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Invite code users */}
        <Section title="INVITE CODE USERS">
          {inviteUsers.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>No invite code users yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                    {['User ID', 'Code', 'Redeemed', 'Briefs', 'Last Brief', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '0.4rem 0.75rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inviteUsers.map((u) => {
                    const isRevoked = !!u.invite_revoked_at;
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border-muted)', color: isRevoked ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.65rem' }}>{u.clerk_user_id.slice(0, 18)}…</td>
                        <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.65rem', color: 'var(--color-text-tertiary)' }}>{u.invite_code.slice(0, 8)}…</td>
                        <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>{new Date(u.invited_at).toLocaleDateString()}</td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{u.briefs_generated}</td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                          {u.last_brief_at ? new Date(u.last_brief_at).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <span style={{ color: isRevoked ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.65rem' }}>
                            {isRevoked ? 'Revoked' : 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>
                          {!isRevoked && <RevokeEarlyAccessButton userId={u.clerk_user_id} />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Recent signups */}
        <Section title="RECENT SIGNUPS">
          {recentUsers.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>No users yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '400px', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                    {['Email', 'Signed Up', 'User ID', ''].map(h => (
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
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                        {u.id}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <ClearBriefButton userId={u.id} />
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
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                    {['Status', 'Brief ID', 'Created', 'Started', 'Error', ''].map(h => (
                      <th key={h} style={{ padding: '0.4rem 0.75rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...pendingJobs, ...failedJobs].map((j) => {
                    const isStuck = j.status === 'processing' && j.started_at
                      ? Date.now() - new Date(j.started_at).getTime() > 6 * 60 * 1000
                      : false;
                    const statusColor = j.status === 'failed' ? 'var(--color-error)' : isStuck ? 'var(--color-amber)' : 'var(--color-text-secondary)';
                    return (
                      <tr key={j.id} style={{ borderBottom: '1px solid var(--color-border-muted)' }}>
                        <td style={{ padding: '0.5rem 0.75rem', color: statusColor, whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {j.status.toUpperCase()}{isStuck && <AlertTriangle size={10} />}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-tertiary)', fontSize: '0.65rem' }}>
                          {j.brief_id ? j.brief_id.slice(0, 8) + '…' : '—'}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                          {new Date(j.created_at).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                          {j.started_at ? new Date(j.started_at).toLocaleTimeString() : '—'}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-error)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {j.error ?? '—'}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>
                          {j.brief_id && (j.status === 'failed' || isStuck) && (
                            <RetryBriefButton briefId={j.brief_id} jobId={j.id} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-text-tertiary)', marginTop: '0.75rem', marginBottom: 0 }}>
              RETRY resets job → pending + brief → queued. Only use if job has been processing &gt;5min (past Vercel timeout).
            </p>
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
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <SectionHeading size="sm" className="mb-3">{title}</SectionHeading>
      <div style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        boxShadow: 'var(--shadow-card)',
      }}>
        {children}
      </div>
    </div>
  );
}
