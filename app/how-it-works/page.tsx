import Link from 'next/link';
import type { Metadata } from 'next';
import { UtilityPageShell } from '@/app/components/ui/UtilityPageShell';
import { Button } from '@/app/components/ui/Button';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { LegalPageShell } from '@/app/components/LegalPageShell';

const TOC_ITEMS = [
  { id: 's1', label: 'Overview' },
  { id: 's2', label: 'Research Depths' },
  { id: 's3', label: 'Source Tiers' },
  { id: 's4', label: 'Confidence Scores' },
  { id: 's5', label: 'Conflict Resolution' },
  { id: 's6', label: 'Community Intel' },
];

export const metadata: Metadata = {
  title: 'How It Works — VisaScout',
  description: 'How VisaScout sources, weights, and reconciles visa information to give you one trustworthy brief.',
};

const SOURCE_TIERS = [
  {
    tier: 'T1',
    label: 'Official Government',
    examples: 'Immigration portals, embassy sites (.gov, .go.th, .gov.vn)',
    note: 'Slow to update but highest authority. T1 beats all other tiers regardless of recency.',
    color: 'var(--color-success)',
  },
  {
    tier: 'T2',
    label: 'Official Advisories',
    examples: 'IATA, Timatic, government travel advisories',
    note: 'Regularly maintained. Trusted when T1 sources are absent or ambiguous.',
    color: 'var(--color-secondary-light)',
  },
  {
    tier: 'T3',
    label: 'Reputable Aggregators',
    examples: 'VisaHQ, Sherpa, iVisa',
    note: 'Useful but derived from T1/T2. Used when official sources are hard to access directly.',
    color: 'var(--color-amber)',
  },
  {
    tier: 'T4',
    label: 'Community',
    examples: 'Reddit, Nomad List, Facebook groups, expat forums',
    note: 'Not authoritative on rules, but often the first place enforcement reality shows up.',
    color: 'var(--color-text-tertiary)',
  },
];

const CONFIDENCE_LEVELS = [
  {
    level: 'Well Sourced',
    meaning: 'Act on this.',
    definition: 'The official record is clear and corroborated. Two or more T1 sources agree — or 4 of 5 research agents reached the same conclusion with no contested claims.',
    color: 'var(--color-success)',
  },
  {
    level: 'Verify Key Details',
    meaning: 'Reliable for primary rules.',
    definition: 'Verify the contested item or deadline before travel. One T1 source confirmed, or a majority of agents agree with at most one contested claim.',
    color: 'var(--color-amber)',
  },
  {
    level: 'Verify Before Travel',
    meaning: 'Content is directional.',
    definition: 'Check official embassy or government sources before making any decisions. Official sources are sparse and agent agreement is low — not a pipeline failure.',
    color: 'var(--color-text-tertiary)',
  },
];

const DEPTHS = [
  {
    label: 'Scout',
    price: 'Free',
    src: 3,
    total: 15,
    time: '~60s',
    note: 'Quick orientation. Is there a visa issue you need to know about? Pulls from 3 sources per agent across 5 parallel agents.',
    color: 'var(--color-depth-quick)',
  },
  {
    label: 'Intel',
    price: '$5.99',
    src: 5,
    total: 25,
    time: '~90s',
    note: 'Booking soon or need all options on the table. 5 sources per agent, deeper conflict resolution, fuller recommendations.',
    color: 'var(--color-depth-standard)',
  },
  {
    label: 'Dossier',
    price: '$9.99',
    src: 8,
    total: 40,
    time: '~180s',
    note: 'Complex situation or you cannot afford to be wrong. 8 sources per agent, maximum coverage across all 5 research dimensions.',
    color: 'var(--color-depth-deep)',
  },
];

export default function HowItWorksPage() {
  return (
    <UtilityPageShell maxWidth="1080px" excludeFooterLink="/how-it-works">
      <LegalPageShell tocItems={TOC_ITEMS}>
        <SectionHeading as="h1" size="md" className="mb-10">The research, explained.</SectionHeading>

        <div className="prose-content space-y-8" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.75 }}>

          <section id="s1">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>Overview</h2>
            <p>
              The internet has plenty of visa information. Most of it is outdated, uncited, or contradictory.
              VisaScout runs five parallel research agents against official immigration sources, recent policy news,
              and real traveler reports. A sixth agent reconciles contradictions. The result is one brief with every
              claim sourced and scored.
            </p>
          </section>

          <section id="s2">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>Research Depths</h2>
            <p className="mb-6">
              Every brief runs the same five agents. Depth controls how many sources each agent pulls.
              More sources means more coverage, more corroboration, and a higher total source count. But also more time.
            </p>
            <div className="space-y-2">
              {DEPTHS.map(d => (
                <div key={d.label} style={{ border: '1px solid var(--color-border)', borderLeft: `3px solid ${d.color}`, background: 'var(--color-bg-elevated)', padding: '14px 18px' }}>
                  <p className="text-xs font-bold uppercase mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: d.color }}>
                    {d.label} · {d.price}
                  </p>
                  <p className="text-sm font-bold uppercase mb-2" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                    {d.src} sources / agent · {d.total} total · {d.time}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{d.note}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="s3">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>Source Tiers</h2>
            <p className="mb-6">
              Every fact in a VisaScout brief is tagged with a source tier. When sources conflict, higher tiers win.
              Within the same tier, newer beats older. This is the ruleset, not a black box.
            </p>
            <div className="space-y-2">
              {SOURCE_TIERS.map((t, i) => (
                <div key={t.tier} style={{ border: '1px solid var(--color-border)', borderLeft: `3px solid ${t.color}`, background: 'var(--color-bg-elevated)', padding: '14px 18px' }}>
                  <p className="text-xs font-bold uppercase mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: t.color }}>
                    Tier {i + 1}
                  </p>
                  <p className="text-sm font-bold uppercase mb-2" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                    {t.label}
                  </p>
                  <p className="text-xs mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>{t.examples}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{t.note}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="s4">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>Confidence Scores</h2>
            <p className="mb-6">
              Confidence scores are not AI-generated sentiment. They are a direct function of which sources were found
              and whether they agree. We never hide a low score. If we cannot verify something from official sources,
              we say so.
            </p>
            <div className="space-y-2">
              {CONFIDENCE_LEVELS.map(c => (
                <div key={c.level} style={{ border: '1px solid var(--color-border)', borderLeft: `3px solid ${c.color}`, background: 'var(--color-bg-elevated)', padding: '14px 18px' }}>
                  <p className="text-xs font-bold uppercase mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: c.color }}>
                    {c.level}
                  </p>
                  <p className="text-sm font-bold uppercase mb-2" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                    {c.meaning}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{c.definition}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="s5">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>Conflict Resolution</h2>
            <p className="mb-4">
              Most travel resources pick one answer and hide the rest. We show you the full picture, including where sources disagree and why.
            </p>
            <p>
              The Thai immigration site says 30 days. A Nomad List thread from last month reports officers asking for proof of onward travel.
              Both are real data points. Choosing one and burying the other is how people get caught off guard.
              Every brief includes a conflict report: confirmed, contested, and unverified. Nothing hidden.
            </p>
          </section>

          <section id="s6">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>Community Intel</h2>
            <p className="mb-4">
              Official sources tell you the rules. Community sources tell you what is actually happening.
            </p>
            <p>
              Border enforcement changes faster than government websites update. Overstay crackdowns, new document checks
              at specific crossings, officers asking for proof of funds the rules do not require. This is where it shows
              up first. We include community sources not to override official rules, but to flag where reality is diverging
              from the rulebook. You should know that before you land.
            </p>
          </section>

          <section
            className="p-8 border text-center"
            style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card)' }}
          >
            <p className="text-xl font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
              Run your first brief free
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>No card required.</p>
            <Button asChild size="lg">
              <Link href="/app?depth=quick">Start free</Link>
            </Button>
          </section>

        </div>
      </LegalPageShell>
    </UtilityPageShell>
  );
}
