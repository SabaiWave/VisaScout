import Link from 'next/link';
import type { Metadata } from 'next';
import { Wordmark } from '@/app/components/ui/Wordmark';
import { NavLink } from '@/app/components/ui/NavLink';
import { MiniFooter } from '@/app/components/ui/MiniFooter';
import { Button } from '@/app/components/ui/Button';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { ConfidenceBadge } from '@/app/components/ui/Badge';
import { CardHeading } from '@/app/components/ui/CardHeading';

export const metadata: Metadata = {
  title: 'How It Works — VisaScout',
  description: 'How VisaScout sources, weights, and reconciles visa information to give you one trustworthy brief.',
};

const SOURCE_TIERS = [
  {
    tier: 'T1',
    label: 'Official Government',
    examples: 'Immigration portals, embassy sites (.gov, .go.th, .gov.vn)',
    trust: 'Authoritative',
    note: 'Slow to update but highest authority. T1 beats all other tiers regardless of recency.',
    color: 'var(--color-success)',
  },
  {
    tier: 'T2',
    label: 'Official Advisories',
    examples: 'IATA, Timatic, government travel advisories',
    trust: 'High',
    note: 'Regularly maintained. Trusted when T1 sources are absent or ambiguous.',
    color: 'var(--color-secondary-light)',
  },
  {
    tier: 'T3',
    label: 'Reputable Aggregators',
    examples: 'VisaHQ, Sherpa, iVisa',
    trust: 'Medium',
    note: 'Useful but derived from T1/T2. Used when official sources are hard to access directly.',
    color: 'var(--color-amber)',
  },
  {
    tier: 'T4',
    label: 'Community',
    examples: 'Reddit, Nomad List, Facebook groups, expat forums',
    trust: 'Ground truth',
    note: 'Not authoritative on rules, but often the first place enforcement reality shows up.',
    color: 'var(--color-text-tertiary)',
  },
];

const CONFIDENCE_LEVELS = [
  {
    level: 'High',
    definition: 'Two or more T1 sources agree.',
    meaning: 'Act on this. The official record is clear and corroborated.',
    color: 'var(--color-success)',
  },
  {
    level: 'Medium',
    definition: 'One T1 source found, or multiple T2 sources agree.',
    meaning: 'Reliable. Verify the deadline or specific requirement before travel.',
    color: 'var(--color-amber)',
  },
  {
    level: 'Low',
    definition: 'No T1 or T2 source found. T3 or T4 only.',
    meaning: 'Treat as directional. Check official sources before making decisions.',
    color: 'var(--color-text-tertiary)',
  },
];

export default function HowItWorksPage() {
  return (
    <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }} className="relative">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[480px] z-0" style={{ background: 'var(--bloom-app-bg)' }} />
      {/* Nav */}
      <nav
        className="relative z-10 border-b px-6 py-4"
        style={{ borderColor: 'var(--color-border-muted)' }}
      >
        <div className="max-w-[860px] mx-auto flex items-center justify-between">
          <Wordmark />
          <NavLink href="/">Home</NavLink>
        </div>
      </nav>

      <main className="relative z-10 max-w-[860px] mx-auto px-6 py-16 space-y-20">

        {/* Header */}
        <section>
          <SectionHeading as="h1" size="md" className="mb-6">The research, explained.</SectionHeading>
          <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            The internet has plenty of visa information. Most of it is outdated, uncited, or contradictory. Here is exactly how we source, verify, and reconcile it.
          </p>
        </section>

        {/* Source tiers */}
        <section>
          <SectionHeading
            size="md"
            subtitle="Not all sources are equal"
            className="mb-8"
          >
            Source Tiers
          </SectionHeading>
          <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Every fact in a VisaScout brief is tagged with a source tier. When sources conflict,
            higher tiers win. Within the same tier, newer beats older. This is the ruleset, not a
            black box.
          </p>

          <div className="space-y-3">
            {SOURCE_TIERS.map(t => (
              <div
                key={t.tier}
                className="brief-section p-6 rounded-lg border"
                style={{
                  background: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border)',
                  borderLeft: `3px solid ${t.color}`,
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.05em',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'var(--color-bg-overlay)',
                        color: t.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {t.tier}
                    </span>
                    <CardHeading>{t.label}</CardHeading>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.05em',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: `color-mix(in srgb, ${t.color} 15%, transparent)`,
                      color: t.color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {t.trust}
                  </span>
                </div>
                <p className="text-sm mb-2" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {t.examples}
                </p>
                <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {t.note}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Confidence scores */}
        <section>
          <SectionHeading
            size="md"
            subtitle="What confidence actually means"
            className="mb-8"
          >
            Confidence Scores
          </SectionHeading>
          <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Confidence scores are not AI-generated sentiment. They are a direct function of which
            sources were found and whether they agree. We never hide a low score. If we cannot
            verify something from official sources, we say so.
          </p>

          <div className="space-y-3">
            {CONFIDENCE_LEVELS.map(c => (
              <div
                key={c.level}
                className="brief-section p-6 rounded-lg border"
                style={{
                  background: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border)',
                  borderLeft: `3px solid ${c.color}`,
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <ConfidenceBadge level={c.level.toLowerCase() as 'high' | 'medium' | 'low'} prefixed={false} />
                  <span className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {c.definition}
                  </span>
                </div>
                <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {c.meaning}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Why contradictions are surfaced */}
        <section>
          <SectionHeading
            size="md"
            subtitle="We don't pick a winner and hide the rest"
            className="mb-8"
          >
            Conflict Resolution
          </SectionHeading>
          <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Most travel resources pick one answer and hide the rest. We show you the full picture, including where sources disagree and why.
          </p>
          <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            The Thai immigration site says 30 days. A Nomad List thread from last month reports officers asking for proof of onward travel. Both are real data points. Choosing one and burying the other is how people get caught off guard. Every brief includes a conflict report: confirmed, contested, and unverified. Nothing hidden.
          </p>
        </section>

        {/* Why community intel is included */}
        <section>
          <SectionHeading
            size="md"
            subtitle="Why Reddit and Nomad List are in here"
            className="mb-8"
          >
            Community Intel
          </SectionHeading>
          <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Official sources tell you the rules. Community sources tell you what is actually
            happening.
          </p>
          <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Border enforcement changes faster than government websites update. Overstay crackdowns, new document checks at specific crossings, officers asking for proof of funds the rules don't require. This is where it shows up first. We include community sources not to override official rules, but to flag where reality is diverging from the rulebook. You should know that before you land.
          </p>
        </section>

        {/* CTA */}
        <section
          className="brief-section p-8 rounded-xl border text-center"
          style={{
            background: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <p className="text-xl font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
            Run your first brief free
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            No card required.
          </p>
          <Button asChild size="lg" style={{ background: 'var(--color-amber)', color: '#0A0A0A' }}>
            <Link href="/app?depth=quick">Start free</Link>
          </Button>
        </section>

      </main>

      <MiniFooter exclude="/how-it-works" />
    </div>
  );
}
