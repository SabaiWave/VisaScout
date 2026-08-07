'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { LandingNav, LANDING_AXIS } from './components/LandingNav';
import { FooterLink } from './components/ui/FooterLink';
import { ChartCornerMarks } from './components/ui/ChartCornerMarks';

import { clientConfig } from '@/config/client';
import { destinationCount } from '@/src/config/destinations';

const { landingPage: copy } = clientConfig;

function useBriefRedirect() {
  const router = useRouter();
  return (nationality: string, destination: string) => {
    const params = new URLSearchParams();
    if (nationality.trim()) params.set('nationality', nationality.trim());
    if (destination.trim()) params.set('destination', destination.trim());
    const qs = params.toString();
    router.push(qs ? `/app?${qs}` : '/app');
  };
}

// ─── Shared decorative chrome ───────────────────────────────────────────────

function AxisRule() {
  return (
    <div
      aria-hidden
      className="hidden lg:block fixed top-0 bottom-0 z-[2] pointer-events-none"
      style={{ left: LANDING_AXIS, width: '1px', background: 'var(--color-border-muted)' }}
    />
  );
}

function SecLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 mb-6"
      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-amber)' }}
    >
      <span style={{ width: '22px', height: '1px', background: 'var(--color-amber)' }} />
      {children}
    </div>
  );
}

// ─── Coordinate-style form (shared by hero + CTA) ───────────────────────────

function CoordForm({ ctaLabel, align }: { ctaLabel: string; align?: 'center' }) {
  const [nationality, setNationality] = useState('');
  const [destination, setDestination] = useState('');
  const redirect = useBriefRedirect();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    redirect(nationality, destination);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 max-w-[440px] w-full">
      <div className="flex border" style={{ borderColor: 'var(--color-border)' }}>
        <span
          className="flex items-center flex-shrink-0 whitespace-nowrap"
          style={{ background: 'var(--color-border)', color: 'var(--color-amber)', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 14px' }}
        >
          Nationality
        </span>
        <input
          type="text"
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          placeholder="American, German, British…"
          className="flex-1 min-w-0 outline-none"
          style={{ background: 'var(--color-bg-elevated)', border: 'none', padding: '13px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}
        />
      </div>
      <div className="flex border" style={{ borderColor: 'var(--color-border)' }}>
        <span
          className="flex items-center flex-shrink-0 whitespace-nowrap"
          style={{ background: 'var(--color-border)', color: 'var(--color-amber)', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 14px' }}
        >
          Destination
        </span>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Thailand, Portugal…"
          className="flex-1 min-w-0 outline-none"
          style={{ background: 'var(--color-bg-elevated)', border: 'none', padding: '13px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}
        />
      </div>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 transition-opacity hover:opacity-85"
        style={{ background: 'var(--color-amber)', color: 'var(--color-neutral)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '15px', border: 'none', cursor: 'pointer' }}
      >
        {ctaLabel} <ArrowRight size={14} aria-hidden />
      </button>
      <div
        className={align === 'center' ? 'text-center' : ''}
        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}
      >
        Free &middot; No account required &middot; ~45s brief &middot; PDF included
      </div>
    </form>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ minHeight: 'calc(100vh - 56px)', borderBottom: '1px solid var(--color-border)' }}>
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero/hero-landing.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* Scrim — left-weighted wash so the copy column always has a dark bed */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, rgba(var(--void-rgb),0.94) 0%, rgba(var(--void-rgb),0.82) 42%, rgba(var(--void-rgb),0.42) 72%, rgba(var(--void-rgb),0.60) 100%),
                         linear-gradient(to top, rgba(var(--void-rgb),0.90) 0%, rgba(var(--void-rgb),0.15) 55%, rgba(var(--void-rgb),0.55) 100%)`,
          }}
        />
      </div>

      {/* Pulsing entry-point marker — CSS-driven, repositions free of the image */}
      <div aria-hidden className="absolute z-[5]" style={{ top: '58%', left: '52%' }}>
        <div className="relative" style={{ width: '7px', height: '7px' }}>
          {[0, 0.95, 1.9].map((delay) => (
            <span
              key={delay}
              className="pin-ring absolute rounded-full"
              style={{ top: '50%', left: '50%', border: '1px solid var(--color-amber)', animationDelay: `${delay}s` }}
            />
          ))}
          <span className="absolute inset-0" style={{ background: 'var(--color-amber)' }} />
        </div>
      </div>

      <div className="relative z-[6] flex flex-col justify-center h-full px-6 lg:px-[72px]" style={{ minHeight: 'calc(100vh - 56px)', maxWidth: '780px' }}>
        <div className="flex items-center gap-3.5 mb-6" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-amber)' }}>
          <span style={{ width: '26px', height: '1px', background: 'var(--color-amber)' }} />
          Chart Your Route
        </div>
        <h1
          className="mb-7 text-balance"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.75rem, 8vw, 6rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            lineHeight: 0.9,
            letterSpacing: '-0.015em',
            color: 'var(--color-text-primary)',
            maxWidth: '13ch',
          }}
        >
          Know the rules
          <span className="block" style={{ paddingLeft: '1.4em' }}>before you land.</span>
        </h1>
        <p
          className="mb-9"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8125rem',
            lineHeight: 1.95,
            color: 'var(--color-text-secondary)',
            maxWidth: '520px',
            paddingLeft: '1.4em',
            borderLeft: '1px solid var(--color-amber)',
          }}
        >
          {copy.hero.subhead}
        </p>
        <CoordForm ctaLabel={copy.hero.cta} />
      </div>
    </section>
  );
}

// ─── Data strip ────────────────────────────────────────────────────────────

const dataCells = [
  { label: 'Destinations Monitored', value: String(destinationCount), sub: 'SEA · East Asia · Europe · LatAm' },
  { label: 'Parallel Agents', value: '5', sub: 'Simultaneous dispatch' },
  { label: 'Source Tiers', value: 'T1–T4', sub: 'Gov to community' },
  { label: 'Brief Time', value: '~45s', sub: 'Streamed · PDF export' },
];

function DataStrip() {
  return (
    <div className="relative grid" style={{ gridTemplateColumns: `${LANDING_AXIS} repeat(3, 1fr)`, borderBottom: '1px solid var(--color-border)' }}>
      {dataCells.map((cell, i) => (
        <div
          key={cell.label}
          className="flex flex-col gap-2"
          style={{
            padding: '30px 24px',
            borderRight: i < dataCells.length - 1 ? '1px solid var(--color-border)' : 'none',
            paddingLeft: i === 0 ? '24px' : undefined,
          }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
            {cell.label}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: i === 0 ? '3.4rem' : '2.6rem', fontWeight: 900, lineHeight: 1, color: 'var(--color-amber)' }}>
            {cell.value}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', lineHeight: 1.6 }}>
            {cell.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Method ────────────────────────────────────────────────────────────────

function Method() {
  const steps = copy.howItWorks.steps;
  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-[38%_1fr]" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div className="px-6 lg:pl-[72px] lg:pr-8 py-16" style={{ borderRight: '1px solid var(--color-border)' }}>
        <SecLabel>Methodology</SecLabel>
        <h2
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4.4vw, 3.5rem)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.9, color: 'var(--color-text-primary)', marginBottom: '20px' }}
        >
          Five sources.<br />One reconciled brief.
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.95, color: 'var(--color-text-secondary)' }}>
          Contradictions are common. Thailand&apos;s immigration portal says 30 days, community reports say enforcement changed last month. VisaScout shows both, with source tier, date, and a confidence rating.
        </p>
      </div>
      <div className="px-6 lg:pl-12 lg:pr-[72px] py-16">
        {steps.map((step, i) => (
          <div
            key={step.number}
            className="grid gap-5"
            style={{
              gridTemplateColumns: '44px 1fr',
              padding: '24px 0',
              paddingLeft: `${i * 40}px`,
              borderTop: i === 0 ? '1px solid var(--color-border-muted)' : undefined,
              borderBottom: '1px solid var(--color-border-muted)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-amber)', lineHeight: 1 }}>
              {step.number}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                {step.title}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.85, color: 'var(--color-text-secondary)' }}>
                {step.body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Brief exhibit ───────────────────────────────────────────────────────

function briefField(key: string, value: string, hi?: boolean) {
  return (
    <div className="grid" style={{ gridTemplateColumns: '170px 1fr', padding: '10px 0', borderBottom: '1px solid var(--color-border-muted)', fontSize: '0.75rem' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', paddingTop: '3px' }}>
        {key}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', color: hi ? 'var(--color-amber)' : 'var(--color-text-primary)', fontWeight: hi ? 700 : 400 }}>
        {value}
      </div>
    </div>
  );
}

function BriefExhibit() {
  return (
    <div id="brief" className="relative px-6 lg:px-[72px] py-16" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10 items-start">
        <div className="pt-1">
          <SecLabel>Exhibit A</SecLabel>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.95, color: 'var(--color-text-secondary)' }}>
            A redacted sample of the output. Every field is sourced. Every claim carries a confidence rating and a link back to the portal, article, or thread it came from.
          </p>
        </div>
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
          <div className="flex justify-between items-center" style={{ padding: '16px 22px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
              Visa Intelligence Report &middot; Thailand / United States
            </span>
            <span className="flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-amber)' }}>
              <span style={{ width: '6px', height: '6px', background: 'var(--color-amber)' }} />
              Confidence: High
            </span>
          </div>
          <div style={{ padding: '22px' }}>
            {briefField('Nationality', 'United States of America')}
            {briefField('Destination', 'Kingdom of Thailand')}
            {briefField('Current Status', 'Tourist Visa (METV) — Day 47 of 60')}
            {briefField('Action Required', 'File TR extension by Aug 19, 2026', true)}
            {briefField('Confidence', 'High — 3 Tier 1 sources confirmed', true)}
            <div className="mt-5 p-5" style={{ background: 'rgba(var(--color-secondary-rgb),0.06)', borderLeft: '2px solid var(--color-amber)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-amber)', marginBottom: '9px' }}>
                Primary Recommendation
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.9, color: 'var(--color-text-primary)' }}>
                Apply for a 30-day Tourist Visa extension at Chaeng Watthana Immigration before Aug 19. Fee ฿1,900. Bring passport, TM.7 form, one photo, and a copy of your departure card. Community data indicates increased August processing times, arrive by 08:00.
              </div>
            </div>
            <div className="mt-4 pt-3.5" style={{ borderTop: '1px solid var(--color-border-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', lineHeight: 1.9 }}>
              Thailand Immigration Bureau (T1) &middot; IATA Timatic (T2) &middot; r/ThailandTourism enforcement reports (T4) &middot; Royal Thai Police immigration notifications (T1)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FAQ ───────────────────────────────────────────────────────────────────

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const items = copy.faq.items;

  return (
    <div className="relative px-6 lg:pl-[72px] lg:pr-[72px] py-16" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <SecLabel>{copy.faq.title}</SecLabel>
      <p className="mb-10 max-w-2xl" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.9, color: 'var(--color-text-secondary)' }}>
        {copy.faq.subtitle}
      </p>
      <div className="max-w-3xl">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} style={{ borderBottom: '1px solid var(--color-border-muted)' }}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 text-left transition-opacity hover:opacity-80"
                style={{ padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer' }}
                aria-expanded={isOpen}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 700, lineHeight: 1.5, color: isOpen ? 'var(--color-amber)' : 'var(--color-text-primary)' }}>
                  {item.q}
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                  style={{ color: isOpen ? 'var(--color-amber)' : 'var(--color-text-tertiary)' }}
                >
                  <ChevronDown size={15} aria-hidden />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.9, color: 'var(--color-text-secondary)', paddingBottom: '20px' }}>
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CTA ───────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-[38%_1fr]" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div className="px-6 lg:pl-[72px] lg:pr-8 py-16 flex flex-col justify-center" style={{ borderRight: '1px solid var(--color-border)' }}>
        <SecLabel>Get Your Brief</SecLabel>
        <h2
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 5.4vw, 5.125rem)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.87, letterSpacing: '-0.015em', color: 'var(--color-text-primary)', marginBottom: '18px' }}
        >
          Your route.<br />Fully charted.
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.95, color: 'var(--color-text-secondary)' }}>
          Sourced, conflict-resolved, confidence-scored. Free, and no account required.
        </p>
      </div>
      <div className="px-6 lg:pl-12 lg:pr-[72px] py-16 flex flex-col justify-center items-start lg:items-end">
        <CoordForm ctaLabel="Get My Visa Brief — Free" align="center" />
      </div>
    </div>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="relative grid grid-cols-1 lg:grid-cols-[38%_1fr]">
      <div
        className="px-6 lg:pl-[72px] lg:pr-8 py-6"
        style={{ borderRight: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', lineHeight: 2 }}
      >
        {clientConfig.brandName} &middot; &copy; {new Date().getFullYear()} Sabai Wave LLC
        <br />
        <FooterLink href="/terms" className="inline" style={{ fontFamily: 'inherit', fontSize: 'inherit', textTransform: 'uppercase' }}>Terms</FooterLink>
        {' · '}
        <FooterLink href="/privacy" className="inline" style={{ fontFamily: 'inherit', fontSize: 'inherit', textTransform: 'uppercase' }}>Privacy</FooterLink>
        {' · '}
        <FooterLink href="/contact" className="inline" style={{ fontFamily: 'inherit', fontSize: 'inherit', textTransform: 'uppercase' }}>Contact</FooterLink>
      </div>
      <div
        className="px-6 lg:pl-12 lg:pr-[72px] py-6 flex items-center"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', lineHeight: 2 }}
      >
        {clientConfig.disclaimerText}
      </div>
    </footer>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <div aria-hidden className="chart-texture" />
      <AxisRule />
      <ChartCornerMarks />
      <LandingNav />
      <Hero />
      <DataStrip />
      <Method />
      <BriefExhibit />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
