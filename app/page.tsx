import Link from 'next/link';
import { LandingNav } from './components/LandingNav';
import { SectionHeading } from './components/ui/SectionHeading';
import { Wordmark } from './components/ui/Wordmark';
import { FooterLink } from './components/ui/FooterLink';
import { Button } from './components/ui/Button';
import { TierLabel } from './components/ui/Badge';
import { clientConfig } from '@/config/client';

const { landingPage: copy } = clientConfig;

// ─── Hero ──────────────────────────────────────────────────────────────────

function BriefExcerptPanel() {
  const FADED_SECTION = 0.22;

  return (
    <div
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 6%, black 42%, transparent 72%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 6%, black 42%, transparent 72%)',
      }}
    >
      <div
        className="rounded-xl border p-5 flex flex-col gap-4"
        style={{
          background: 'var(--color-bg-elevated)',
          borderColor: 'var(--color-border-strong)',
        }}
      >
        {/* Route header — faded context */}
        <div className="flex items-start justify-between gap-3 flex-wrap" style={{ opacity: FADED_SECTION }}>
          <span className="text-xs font-bold uppercase" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-text-tertiary)' }}>
            US CITIZEN → THAILAND
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[0.65rem] font-bold uppercase px-2 py-0.5" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--color-confidence-high)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', borderRadius: '4px' }}>
              WELL SOURCED
            </span>
            <TierLabel tier={1} />
          </div>
        </div>

        {/* RECOMMENDED ACTION — full opacity, the foreground hook */}
        <div
          className="rounded-lg p-4 flex flex-col gap-2"
          style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.25)',
            boxShadow: '0 0 28px rgba(245,158,11,0.12), 0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          <p className="text-xs font-bold uppercase mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-amber)' }}>
            <span style={{ color: 'var(--color-secondary)' }}>//</span>{' '}RECOMMENDED ACTION
          </p>
          <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>
            Apply for a 60-day tourist visa (TR) at a Thai consulate before your 30-day VOA expires.
          </p>
          <p className="text-xs font-bold uppercase" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-error)', letterSpacing: '0.04em' }}>
            DEADLINE: 15 DAYS
          </p>
          <div className="flex items-center gap-2 pt-2 mt-1 border-t" style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--color-success)' }} />
            <span className="text-[0.65rem] uppercase" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-text-tertiary)' }}>
              THAI IMMIGRATION · CONSULATE.MFA.GO.TH · T1 CONFIRMED
            </span>
          </div>
        </div>

        {/* Visa options — faded */}
        <div style={{ opacity: FADED_SECTION }}>
          <p className="text-xs font-bold uppercase mb-2" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-secondary)' }}>
            // VISA OPTIONS
          </p>
          <div className="flex flex-col gap-1.5">
            <div className="rounded-lg p-3" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Visa Exemption (Tourist)</span>
                <span className="text-[0.6rem] font-bold uppercase px-2 py-0.5" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-secondary)', background: 'rgba(99,102,241,0.15)', borderRadius: '4px' }}>BEST FIT</span>
              </div>
              <span className="text-[0.65rem] uppercase" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-text-tertiary)' }}>MAX STAY 60 days (air) / 30 days (land)</span>
            </div>
            <div className="rounded-lg p-3" style={{ border: '1px solid var(--color-border)' }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Tourist Visa (TR)</span>
                <span className="text-[0.6rem] font-bold uppercase px-2 py-0.5" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-text-tertiary)', background: 'var(--color-bg-overlay)', borderRadius: '4px' }}>ACCEPTABLE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Entry requirements — more faded, deeper in document */}
        <div style={{ opacity: FADED_SECTION * 0.75 }}>
          <p className="text-xs font-bold uppercase mb-2" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-secondary)' }}>
            // ENTRY REQUIREMENTS
          </p>
          {['Valid passport (6+ months validity)', 'Return or onward ticket required', 'Proof of funds: 20,000 THB per person', 'Proof of accommodation (first night)'].map(item => (
            <div key={item} className="flex items-start gap-2 py-1">
              <span style={{ color: 'var(--color-secondary)', fontSize: '0.65rem', flexShrink: 0, marginTop: '2px' }}>•</span>
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Conflict report — most faded, bottom of document */}
        <div style={{ opacity: FADED_SECTION * 0.6 }}>
          <p className="text-xs font-bold uppercase mb-2" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-secondary)' }}>
            // CONFLICT REPORT: 3 ITEMS
          </p>
          <div className="rounded-lg p-3 flex flex-col gap-1" style={{ border: '1px solid var(--color-border)' }}>
            <span className="text-[0.65rem] font-bold uppercase" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-success)' }}>● Confirmed</span>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Visa exemption duration · Proof of funds threshold</span>
            <span className="text-[0.65rem] font-bold uppercase mt-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-amber)' }}>● Contested</span>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Onward ticket enforcement inconsistently applied</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section
      className="relative overflow-hidden px-6 py-24"
      style={{ background: 'var(--color-bg-base)' }}
    >
      {/* Radiant Bloom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        style={{ background: 'var(--hero-bloom-bg)' }}
      />

      <div className="relative z-10 max-w-[1120px] mx-auto">
        {/* Relative wrapper: left col in flow drives height, brief is absolute */}
        <div className="relative">
          {/* Left col — sole flow element, constrains section height */}
          <div className="max-w-[520px] flex flex-col">
            <p
              className="text-xs font-bold uppercase mb-7"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}
            >
              <span style={{ color: 'var(--color-secondary)' }}>//</span>{' '}SOUTHEAST ASIA — VISA INTELLIGENCE
            </p>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.1] mb-6 text-balance"
              style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
            >
              {copy.hero.h1}
            </h1>

            <p
              className="text-base sm:text-lg mb-10 leading-relaxed max-w-lg"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {copy.hero.subhead}
            </p>

            <div className="flex">
              <Button asChild size="lg" style={{ background: 'var(--color-amber)', color: 'var(--color-neutral)' }}>
                <Link href={copy.hero.ctaHref}>{copy.hero.cta}</Link>
              </Button>
            </div>
          </div>

          {/* Brief — absolutely positioned, out of flow, never inflates section height */}
          <div
            className="hidden md:block absolute top-12 right-0 overflow-hidden"
            style={{ width: '46%' }}
          >
            <BriefExcerptPanel />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ──────────────────────────────────────────────────────────────

function Features() {
  return (
    <section className="px-4 sm:px-6 py-12 sm:py-20" style={{ background: 'var(--color-bg-elevated)' }}>
      <div className="max-w-[1120px] mx-auto">
        <SectionHeading className="mb-10" subtitle={copy.features.subtitle}>
          {copy.features.title}
        </SectionHeading>

        <div
          className="rounded-xl border divide-y"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-base)' }}
        >
          {copy.features.cards.map((card) => (
            <div
              key={card.title}
              className="px-5 py-5 flex flex-col gap-1"
            >
              <p
                className="text-xs font-bold uppercase mb-1"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-secondary)' }}
              >
                {card.tag}
              </p>
              <p
                className="text-base font-bold uppercase"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
              >
                {card.title}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ──────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section className="px-4 sm:px-6 py-12 sm:py-20" style={{ background: 'var(--color-bg-base)' }}>
      <div className="max-w-[1120px] mx-auto">
        <SectionHeading className="mb-12" subtitle={copy.howItWorks.subtitle}>
          {copy.howItWorks.title}
        </SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {copy.howItWorks.steps.map(step => (
            <div
              key={step.number}
              className="brief-section p-6 rounded-xl border flex flex-col gap-4"
              style={{
                background: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                className="text-3xl font-bold"
                style={{ color: 'var(--color-secondary)', fontFamily: 'var(--font-mono)' }}
              >
                {step.number}
              </div>
              <h3
                className="text-sm font-bold uppercase"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
              >
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Destinations ──────────────────────────────────────────────────────────

function Destinations() {
  return (
    <section className="px-4 sm:px-6 py-12 sm:py-20" style={{ background: 'var(--color-bg-elevated)' }}>
      <div className="max-w-[1120px] mx-auto">
        <SectionHeading subtitle={copy.destinations.subtitle} className="mb-12">
          {copy.destinations.title}
        </SectionHeading>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {clientConfig.supportedDestinations.map(name => (
            <div
              key={name}
              className="brief-section p-4 rounded-lg border flex flex-col gap-2"
              style={{
                background: 'var(--color-bg-base)',
                borderColor: 'var(--color-border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <span
                className="text-base font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                {name}
              </span>
              <span
                className="flex items-center gap-1.5"
                style={{ alignSelf: 'flex-start' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'var(--color-success)' }}
                />
                <span
                  className="text-[0.65rem] font-bold uppercase"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)' }}
                >
                  Live
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ───────────────────────────────────────────────────────────────

function Pricing() {
  return (
    <section className="px-4 sm:px-6 py-12 sm:py-20" style={{ background: 'var(--color-bg-base)' }}>
      <div className="max-w-[1120px] mx-auto">
        <SectionHeading className="mb-12" subtitle={copy.pricing.subtitle}>
          {copy.pricing.title}
        </SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {copy.pricing.plans.map(plan => (
            <div
              key={plan.name}
              className={`brief-section p-6 rounded-xl border flex flex-col ${plan.highlight ? 'pricing-card-highlight' : 'pricing-card'}`}
              style={{
                background: 'var(--color-bg-elevated)',
                borderColor: plan.highlight ? 'var(--color-secondary)' : 'var(--color-border)',
                boxShadow: plan.highlight ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
              }}
            >
              {/* Plan header */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-sm font-bold uppercase"
                  style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}
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
              <div className="flex items-baseline gap-2 mb-3">
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
                    <svg aria-hidden="true" className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-success)' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button asChild variant={plan.highlight ? 'primary' : 'secondary'} className="w-full">
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
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
      className="border-t px-6 py-8"
      style={{ background: 'var(--color-bg-subtle)', borderColor: 'var(--color-border-muted)' }}
    >
      <div className="max-w-[1120px] mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-4">
          <div>
            <Wordmark className="block mb-1" />
            <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              {clientConfig.tagline}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <FooterLink href="/how-it-works">How It Works</FooterLink>
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
          </div>
        </div>

        <div className="border-t pt-4" style={{ borderColor: 'var(--color-border-muted)' }}>
          <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
            ⚠ {clientConfig.disclaimerText}
          </p>
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}
          >
            © {new Date().getFullYear()} {clientConfig.brandName} · All rights reserved.
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
      <HowItWorks />
      <Destinations />
      <Pricing />
      <Footer />
    </div>
  );
}
