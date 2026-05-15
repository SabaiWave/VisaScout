import Link from 'next/link';
import { LandingNav } from './components/LandingNav';

// ─── Shared ────────────────────────────────────────────────────────────────

function SectionHeading({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="mb-12">
      <h2
        className="text-3xl font-bold mb-3"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}
      >
        <span style={{ color: 'var(--color-secondary)', marginRight: '0.5rem' }}>//</span>
        {children}
      </h2>
      <div
        className="mb-4 h-px"
        style={{ background: 'linear-gradient(to right, rgba(99,102,241,0.5), transparent)' }}
      />
      {subtitle && (
        <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      className="px-6 pt-24 pb-20 text-center"
      style={{ background: 'var(--color-bg-base)' }}
    >
      <div className="max-w-[860px] mx-auto">
        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold mb-8 uppercase tracking-widest"
          style={{
            background: 'var(--color-secondary-subtle)',
            color: 'var(--color-secondary-light)',
            fontFamily: 'var(--font-mono)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: '#22c55e' }} />
          Multi-Agent Visa Intelligence · SEA
        </div>

        {/* H1 */}
        <h1
          className="text-5xl sm:text-6xl font-bold leading-tight mb-6"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}
        >
          Stop guessing. Know exactly where you stand.
        </h1>

        {/* Subhead */}
        <p
          className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Official policy + recent enforcement changes + real traveler experience — synthesized
          into one structured brief. Every claim sourced. Every recommendation confidence-scored.
        </p>

        {/* CTA */}
        <div className="flex justify-center mb-8">
          <Link
            href="/app"
            className="inline-flex items-center justify-center px-8 py-4 rounded-lg text-base font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
            style={{ background: 'var(--color-amber)', color: '#0A0A0A', fontFamily: 'var(--font-mono)' }}
          >
            Get your free brief
          </Link>
        </div>

        {/* Metrics strip */}
        <div
          className="inline-flex items-center gap-6 px-6 py-3 rounded-lg border"
          style={{
            background: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {[
            { value: '5', label: 'Agents' },
            { value: '10', label: 'Countries' },
            { value: 'T1–T4', label: 'Source tiers' },
            { value: 'Per report', label: 'No subscription' },
          ].map((m, i) => (
            <div key={m.label} className="flex items-center gap-6">
              {i > 0 && (
                <div className="w-px h-6" style={{ background: 'var(--color-border-strong)' }} />
              )}
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: 'var(--color-secondary-light)' }}>{m.value}</div>
                <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{m.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    tag: 'Tier 1 Sources',
    title: 'Official Policy, Verified',
    body: 'Government immigration portals, embassy sites, and official advisories — pulled fresh and tagged by source tier. No outdated travel blogs.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    tag: 'Last 90 Days',
    title: 'Recent Enforcement Reality',
    body: 'Rules on paper vs. what border officers are actually doing. Community intelligence from Reddit, Nomad List, and expat forums — reconciled against official sources.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    tag: 'Per Claim',
    title: 'Confidence Scores + Citations',
    body: 'Every claim sourced and confidence-scored. High confidence = two+ Tier 1 sources agree. Contested claims flagged explicitly. Nothing hidden.',
  },
];

function Features() {
  return (
    <section className="px-6 py-20" style={{ background: 'var(--color-bg-elevated)' }}>
      <div className="max-w-[1120px] mx-auto">
        <SectionHeading subtitle="Five parallel intelligence agents. One structured brief. Contradictions resolved, not hidden.">
          Intelligence Engine
        </SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="brief-section p-6 rounded-xl border"
              style={{
                background: 'var(--color-bg-base)',
                borderColor: 'var(--color-border)',
                borderLeft: '3px solid var(--color-secondary)',
                boxShadow: '0 0 20px rgba(99,102,241,0.05)',
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--color-secondary-subtle)', color: 'var(--color-secondary-light)' }}
                >
                  {f.icon}
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{
                    background: 'var(--color-secondary-subtle)',
                    color: 'var(--color-secondary-light)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {f.tag}
                </span>
              </div>
              <h3
                className="text-sm font-bold mb-2 uppercase tracking-wider"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pipeline ──────────────────────────────────────────────────────────────

const AGENTS = [
  { name: 'Official Policy', tier: 'T1', color: 'var(--color-secondary)' },
  { name: 'Recent Changes', tier: 'T1–T2', color: 'var(--color-secondary)' },
  { name: 'Community Intel', tier: 'T4', color: 'var(--color-secondary)' },
  { name: 'Entry Requirements', tier: 'T1', color: 'var(--color-secondary)' },
  { name: 'Border Run', tier: 'T1–T4', color: 'var(--color-secondary)' },
];

function Pipeline() {
  return (
    <section className="px-6 py-20" style={{ background: 'var(--color-bg-base)' }}>
      <div className="max-w-[1120px] mx-auto">
        <SectionHeading subtitle="Every brief runs five agents in parallel. Results reconciled by a conflict resolver before synthesis.">
          How It Works
        </SectionHeading>

        {/* Agent pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6">
          {AGENTS.map((agent, i) => (
            <div key={agent.name} className="relative">
              <div
                className="brief-section p-4 rounded-lg border flex flex-col gap-2"
                style={{
                  background: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border)',
                  borderLeft: '3px solid var(--color-secondary)',
                  boxShadow: '0 0 20px rgba(99,102,241,0.05)',
                }}
              >
                <div
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}
                >
                  Agent {String(i + 1).padStart(2, '0')}
                </div>
                <div
                  className="text-sm font-bold"
                  style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
                >
                  {agent.name}
                </div>
                <span
                  className="text-xs px-1.5 py-0.5 rounded w-fit"
                  style={{
                    background: 'var(--color-secondary-subtle)',
                    color: 'var(--color-secondary-light)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {agent.tier}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

// ─── Destinations ──────────────────────────────────────────────────────────

const DESTINATIONS = [
  'Thailand', 'Vietnam', 'Indonesia', 'Malaysia', 'Philippines',
  'Cambodia', 'Singapore', 'Laos', 'Myanmar', 'Brunei',
];

function Destinations() {
  return (
    <section className="px-6 py-20" style={{ background: 'var(--color-bg-elevated)' }}>
      <div className="max-w-[1120px] mx-auto">
        <div className="flex items-start justify-between mb-12">
          <div className="flex-1">
            <h2
              className="text-3xl font-bold mb-3"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}
            >
              <span style={{ color: 'var(--color-secondary)', marginRight: '0.5rem' }}>//</span>
              Coverage Matrix
            </h2>
            <div
              className="mb-4 h-px"
              style={{ background: 'linear-gradient(to right, rgba(99,102,241,0.5), transparent)' }}
            />
            <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
              Top 5–6 visa types per country. Unsupported types flagged — never guessed.
            </p>
          </div>
          <span
            className="hidden sm:flex items-center gap-2 ml-8 text-xs px-3 py-1.5 rounded font-bold uppercase tracking-widest"
            style={{
              fontFamily: 'var(--font-mono)',
              color: '#22c55e',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.2)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
            Live
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {DESTINATIONS.map(name => (
            <div
              key={name}
              className="brief-section p-4 rounded-lg border flex flex-col gap-2"
              style={{
                background: 'var(--color-bg-base)',
                borderColor: 'var(--color-border)',
                boxShadow: '0 0 20px rgba(99,102,241,0.05)',
              }}
            >
              <span
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                {name}
              </span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 w-fit uppercase tracking-wider"
                style={{
                  background: 'rgba(34,197,94,0.12)',
                  color: '#22c55e',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
                Ready
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ───────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: 'Quick',
    tag: 'Free',
    price: '$0',
    priceNote: 'No credit card',
    description: 'Full pipeline, all 5 agents, 3 sources each. Good for a fast overview.',
    features: ['All 5 agents', '3 sources per agent', 'Visa brief', 'Shareable link'],
    cta: 'Start free',
    href: '/app',
    highlight: false,
  },
  {
    name: 'Standard',
    tag: 'Popular',
    price: '$5.99',
    priceNote: 'Per report',
    description: 'More sources, richer analysis, full conflict report, PDF download.',
    features: ['All 5 agents', '5 sources per agent', 'Richer conflict analysis', 'PDF download', 'Shareable link'],
    cta: 'Get Standard',
    href: '/app',
    highlight: true,
  },
  {
    name: 'Deep',
    tag: 'Max Intel',
    price: '$11.99',
    priceNote: 'Per report',
    description: 'Everything in Standard, plus maximum sources and full border run analysis.',
    features: ['Everything in Standard', '8 sources per agent', 'Extended community search', 'Full border run analysis', 'Conflict deep-dive'],
    cta: 'Get Deep',
    href: '/app',
    highlight: false,
  },
];

function Pricing() {
  return (
    <section className="px-6 py-20" style={{ background: 'var(--color-bg-base)' }}>
      <div className="max-w-[1120px] mx-auto">
        <SectionHeading subtitle="Less than a visa agency consultation. Far less than an overstay fine.">
          Mission Parameters
        </SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className="brief-section p-6 rounded-xl border flex flex-col"
              style={{
                background: 'var(--color-bg-elevated)',
                borderColor: plan.highlight ? 'var(--color-secondary)' : 'var(--color-border)',
                borderLeft: plan.highlight ? '3px solid var(--color-secondary)' : '3px solid var(--color-border)',
                boxShadow: plan.highlight ? '0 0 24px rgba(99,102,241,0.12)' : '0 0 20px rgba(99,102,241,0.05)',
              }}
            >
              {/* Plan header */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-sm font-bold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}
                >
                  {plan.name}
                </span>
                <span
                  className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{
                    background: plan.highlight ? 'var(--color-secondary-subtle)' : 'var(--color-bg-overlay)',
                    color: plan.highlight ? 'var(--color-secondary-light)' : 'var(--color-text-tertiary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {plan.tag}
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2 mb-1">
                <span
                  className="text-3xl font-bold"
                  style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
                >
                  {plan.price}
                </span>
                <span
                  className="text-sm"
                  style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}
                >
                  {plan.priceNote}
                </span>
              </div>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {plan.description}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-success)' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.href}
                className="block text-center py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{
                  background: plan.highlight ? 'var(--color-secondary)' : 'transparent',
                  color: plan.highlight ? '#fff' : 'var(--color-text-primary)',
                  border: plan.highlight ? 'none' : '1px solid var(--color-border-strong)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      className="border-t px-6 py-12"
      style={{ background: 'var(--color-bg-subtle)', borderColor: 'var(--color-border-muted)' }}
    >
      <div className="max-w-[1120px] mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <span
              className="text-base font-bold block mb-1 uppercase tracking-widest"
              style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
            >
              VisaScout
            </span>
            <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              Visa intelligence for digital nomads.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm transition-colors" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              Privacy
            </Link>
            <Link href="/terms" className="text-sm transition-colors" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              Terms
            </Link>
            <Link href="/contact" className="text-sm transition-colors" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              Contact
            </Link>
          </div>
        </div>

        <div className="border-t pt-6" style={{ borderColor: 'var(--color-border-muted)' }}>
          <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
            ⚠ This report aggregates publicly available information. Verify all visa requirements with official sources before travel. Not legal advice.
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}
          >
            © {new Date().getFullYear()} VisaScout · All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <LandingNav />
      <Hero />
      <Features />
      <Pipeline />
      <Destinations />
      <Pricing />
      <Footer />
    </div>
  );
}
