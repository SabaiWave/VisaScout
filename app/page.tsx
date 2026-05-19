import Link from 'next/link';
import { LandingNav } from './components/LandingNav';
import { SectionHeading } from './components/ui/SectionHeading';
import { Wordmark } from './components/ui/Wordmark';
import { FooterLink } from './components/ui/FooterLink';
import { Button } from './components/ui/Button';
import { clientConfig } from '@/config/client';

const { landingPage: copy } = clientConfig;

// ─── Hero ──────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      className="relative overflow-hidden px-6 pt-24 pb-20 text-center"
      style={{ background: 'var(--color-bg-base)' }}
    >
      {/* Radiant Bloom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        style={{ background: 'var(--hero-bloom-bg)' }}
      />

      <div className="relative z-10 max-w-[860px] mx-auto">
        {/* Eyebrow */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-bold mb-8 uppercase tracking-wide"
          style={{
            background: 'var(--color-secondary-subtle)',
            color: 'var(--color-secondary-light)',
            fontFamily: 'var(--font-mono)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: 'var(--color-success)' }} />
          <span>{copy.hero.eyebrow}</span>
        </div>

        {/* H1 */}
        <h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
        >
          {copy.hero.h1}
        </h1>

        {/* Subhead */}
        <p
          className="text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {copy.hero.subhead}
        </p>

        {/* CTA */}
        <div className="flex justify-center mb-8">
          <Button asChild size="lg" style={{ background: 'var(--color-amber)', color: 'var(--color-neutral)' }}>
            <Link href={copy.hero.ctaHref}>{copy.hero.cta}</Link>
          </Button>
        </div>

        {/* Metrics strip */}
        <div
          className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 px-4 sm:px-6 py-3 rounded-lg border w-fit mx-auto"
          style={{
            background: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {copy.hero.metrics.map((m, i) => (
            <div key={m.label} className="flex items-center gap-3 sm:gap-6">
              {i > 0 && (
                <div className="hidden sm:block w-px h-6" style={{ background: 'var(--color-border-strong)' }} />
              )}
              <div className="text-center">
                <div className="text-base sm:text-lg font-bold uppercase" style={{ color: 'var(--color-secondary-light)' }}>{m.value}</div>
                <div className="text-xs sm:text-sm uppercase" style={{ color: 'var(--color-text-tertiary)' }}>{m.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ──────────────────────────────────────────────────────────────

const FEATURE_ICONS = [
  (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
];

function Features() {
  return (
    <section className="px-4 sm:px-6 py-12 sm:py-20" style={{ background: 'var(--color-bg-elevated)' }}>
      <div className="max-w-[1120px] mx-auto">
        <SectionHeading className="mb-12" subtitle={copy.features.subtitle}>
          {copy.features.title}
        </SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {copy.features.cards.map((card, i) => (
            <div
              key={card.title}
              className="brief-section p-6 rounded-xl border"
              style={{
                background: 'var(--color-bg-base)',
                borderColor: 'var(--color-border)',
                borderLeft: '3px solid var(--color-secondary)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--color-secondary-subtle)', color: 'var(--color-secondary-light)' }}
                >
                  {FEATURE_ICONS[i]}
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{
                    background: 'var(--color-secondary-subtle)',
                    color: 'var(--color-secondary-light)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {card.tag}
                </span>
              </div>
              <h3
                className="text-sm font-bold mb-2 uppercase tracking-wider"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                {card.title}
              </h3>
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
                borderLeft: '3px solid var(--color-secondary)',
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
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
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
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: 'var(--color-success)', display: 'inline-block' }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>Ready</span>
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
                borderLeft: plan.highlight ? '3px solid var(--color-secondary)' : '3px solid var(--color-border)',
                boxShadow: plan.highlight ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
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
