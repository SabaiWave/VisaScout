import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getSupabase } from '@/src/lib/supabase';

const ADMIN_EMAIL = 'admin@sabaiwave.com';

async function getAdminMetrics() {
  const supabase = getSupabase();

  const [briefs, ipLogs, jobs] = await Promise.all([
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
  ]);

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
  };
}

export default async function AdminPage() {
  const user = await currentUser();
  if (!user || !user.emailAddresses.some(e => e.emailAddress === ADMIN_EMAIL)) {
    redirect('/');
  }

  const { briefs, ipLogs, jobs } = await getAdminMetrics();

  const totalCost = briefs.reduce((sum, b) => sum + (b.estimated_cost_usd ?? 0), 0);

  const byDepth = ['quick', 'standard', 'deep'].map(d => {
    const subset = briefs.filter(b => b.depth === d);
    const costs = subset.map(b => b.estimated_cost_usd ?? 0).filter(c => c > 0);
    const avg = costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;
    return { depth: d, count: subset.length, avgCost: avg };
  });

  // Source tier coverage: % of briefs with at least one Tier 1 agent result
  const tier1Coverage = briefs.length > 0
    ? (briefs.filter(b =>
        (b.agent_statuses ?? []).some(a => a.sourceTier === 1)
      ).length / briefs.length * 100).toFixed(1)
    : '0';

  // Outlier briefs: cost > 2x average
  const avgCost = totalCost / (briefs.length || 1);
  const outliers = briefs.filter(b => (b.estimated_cost_usd ?? 0) > avgCost * 2);

  const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'processing');
  const failedJobs = jobs.filter(j => j.status === 'failed');

  return (
    <main style={{ background: 'var(--color-bg-base)', minHeight: '100vh', padding: '2rem', fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-secondary)', marginBottom: '0.5rem' }}>
          // ADMIN
        </p>
        <h1 style={{ color: 'var(--color-text-primary)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>
          VisaScout — Cost &amp; Operations Dashboard
        </h1>

        {/* Summary row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'TOTAL REPORTS', value: briefs.length },
            { label: 'TOTAL COST', value: `$${totalCost.toFixed(4)}` },
            { label: 'TIER 1 COVERAGE', value: `${tier1Coverage}%` },
            { label: 'OUTLIER REPORTS', value: outliers.length },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '1rem',
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                {label}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Cost by depth */}
        <Section title="COST BY DEPTH">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                {['Depth', 'Reports', 'Avg Cost', 'Cost Baseline'].map(h => (
                  <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600 }}>{h}</th>
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
        </Section>

        {/* Outlier reports */}
        {outliers.length > 0 && (
          <Section title="OUTLIER REPORTS (>2× AVG COST)">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                  {['Destination', 'Depth', 'Cost', 'Date'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {outliers.slice(0, 20).map((b, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border-muted)', color: '#f59e0b' }}>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{b.destination}</td>
                    <td style={{ padding: '0.6rem 0.75rem', textTransform: 'capitalize' }}>{b.depth}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>${(b.estimated_cost_usd ?? 0).toFixed(4)}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-tertiary)' }}>{new Date(b.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* Background jobs */}
        {(pendingJobs.length > 0 || failedJobs.length > 0) && (
          <Section title="BACKGROUND JOBS">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              {pendingJobs.length > 0 && (
                <p style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>
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
        <Section title="FLAGGED IPS (SOFT — NO HARD BLOCK)">
          {ipLogs.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>No flagged IPs.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ color: 'var(--color-text-tertiary)', borderBottom: '1px solid var(--color-border)' }}>
                  {['IP', 'User ID', 'Reason', 'Date'].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ipLogs.map((entry, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border-muted)', color: 'var(--color-text-secondary)' }}>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{entry.ip}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-tertiary)' }}>{entry.user_id ?? '—'}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{entry.reason ?? '—'}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--color-text-tertiary)' }}>{new Date(entry.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-secondary)', fontWeight: 700 }}>//</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(99,102,241,0.4), transparent)' }} />
      </div>
      <div style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '1rem',
      }}>
        {children}
      </div>
    </div>
  );
}
