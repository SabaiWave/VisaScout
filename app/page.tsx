'use client';

import { useState, useRef, useContext, createContext, useLayoutEffect, FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LandingNav, LANDING_AXIS } from './components/LandingNav';
import { FooterLink } from './components/ui/FooterLink';
import { ChartCornerMarks } from './components/ui/ChartCornerMarks';
import { LandingCoords } from './components/LandingCoords';
import { HeroMarkerEditor } from './components/dev/HeroMarkerEditor';

import { clientConfig } from '@/config/client';
import { destinationCount, coverageLabelDot } from '@/src/config/destinations';
import { SearchableCombobox } from './components/ui/SearchableCombobox';

const { landingPage: copy } = clientConfig;

// ─── Animation variants ──────────────────────────────────────────────────────

const EASE = [0.25, 0.1, 0.25, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -32 },
  show: { opacity: 1, x: 0, transition: { duration: 0.55, ease: EASE } },
};

const fadeRight = {
  hidden: { opacity: 0, x: 90 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
};

const stagger = (delay = 0.1) => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
});

const VP = { once: true, margin: '-60px' } as const;

// Mobile variants: opacity:1 in both states, duration:0 — instant visible, no animation
const noAnim = { hidden: { opacity: 1, x: 0, y: 0 }, show: { opacity: 1, x: 0, y: 0, transition: { duration: 0 } } };
const noAnimStagger = { hidden: {}, show: { transition: { staggerChildren: 0 } } };

// Mobile context — detect once at mount, disable scroll animations on mobile to prevent shimmer
const MobileCtx = createContext(false);
const useMobile = () => useContext(MobileCtx);

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

const LABEL_STYLE: React.CSSProperties = {
  background: 'var(--color-border)', color: 'var(--color-amber)',
  fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.08em',
  textTransform: 'uppercase', padding: '0 14px',
};
const INPUT_STYLE: React.CSSProperties = {
  background: 'var(--color-bg-elevated)', border: 'none', padding: '13px 14px',
  fontFamily: 'var(--font-mono)', fontSize: '1rem', outline: 'none',
  touchAction: 'manipulation',
};

function CoordForm({ ctaLabel }: { ctaLabel: string }) {
  const [nationality, setNationality] = useState('');
  const [destination, setDestination] = useState('');
  const redirect = useBriefRedirect();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    redirect(nationality, destination);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 max-w-[440px] w-full">
      <style dangerouslySetInnerHTML={{ __html: `
        .lp-dest-row { display: flex; border: 1px solid var(--color-border); transition: border-color 0.15s; position: relative; }
        .lp-dest-row:focus-within { border-color: var(--color-secondary); }
        .lp-dest-combo { flex: 1; min-width: 0; position: static !important; }
        .lp-dest-combo input { border: none !important; border-radius: 0 !important; box-shadow: none !important; background: var(--color-bg-elevated) !important; font-family: var(--font-mono) !important; font-size: 1rem !important; padding-left: 14px !important; touch-action: manipulation; }
        .lp-dest-combo > ul { position: absolute !important; top: 100% !important; left: 0 !important; right: 0 !important; border: 1px solid var(--color-secondary) !important; border-top: none !important; border-radius: 0 !important; box-shadow: none !important; background: var(--color-bg-elevated) !important; z-index: 50 !important; }
        .lp-dest-combo > ul li { border-radius: 0 !important; font-family: var(--font-mono) !important; font-size: 0.75rem !important; background: var(--color-bg-elevated) !important; }
      ` }} />
      <div className="flex" style={{ border: '1px solid var(--color-border)', transition: 'border-color 0.15s' }}>
        <span className="flex items-center flex-shrink-0 whitespace-nowrap" style={LABEL_STYLE}>
          Nationality
        </span>
        <input
          type="text"
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          placeholder="Any nationality"
          className="flex-1 min-w-0"
          style={{ ...INPUT_STYLE, color: 'var(--color-text-primary)' }}
        />
      </div>
      <div className="lp-dest-row">
        <span className="flex items-center flex-shrink-0 whitespace-nowrap" style={LABEL_STYLE}>
          Destination
        </span>
        <SearchableCombobox
          options={clientConfig.supportedDestinations}
          value={destination}
          onChange={setDestination}
          placeholder="Select destination…"
          className="lp-dest-combo"
        />
      </div>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 transition-opacity hover:opacity-85"
        style={{ background: 'var(--color-amber)', color: 'var(--color-neutral)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '15px', border: 'none', cursor: 'pointer', lineHeight: 1 }}
      >
        {ctaLabel}<svg width="5" height="8" viewBox="0 0 5 8" fill="currentColor" aria-hidden="true"><path d="M0 0L5 4L0 8Z" /></svg>
      </button>
      <div
        className="text-center"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)' }}
      >
        Sources cited &middot; PDF included
      </div>
    </form>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────

// Positions are % of the hero image's own pixels (via object-fit: cover math
// in HeroMarkerEditor, recomputed on resize) — NOT % of the viewport or the
// layout box. This is what keeps them pinned to the same map feature (land,
// not the bottom-center ocean gulf) at every window size. Press M in dev to
// drag-edit and copy updated values. Text/form can drift relative to markers
// at extreme aspect ratios since they're fixed to the layout grid instead —
// accepted tradeoff, staying on land matters more than that alignment.
const HERO_MARKERS = [
  { top: '20.0%', left: '60.9%', size: 4, opacity: 1, rings: [0, 1.8] },
  { top: '18%', left: '85%', size: 4, opacity: 1, rings: [0.4, 2.2] },
  { top: '77.5%', left: '78.2%', size: 4, opacity: 1, rings: [1.1, 2.9] },
  { top: '33.1%', left: '40.8%', size: 4, opacity: 1, rings: [0.7, 2.5] },
  { top: '36.5%', left: '79.7%', size: 4, opacity: 1, rings: [1.4, 3.1] },
];

function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  return (
    <section ref={sectionRef} className="relative overflow-hidden" style={{ minHeight: 'calc(100vh - 56px)', borderBottom: '1px solid var(--color-border)', willChange: 'transform' }}>
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

      {/* Pulsing map markers — positioned against the image's own object-fit: cover geometry (see HeroMarkerEditor), so they stay pinned to the same map feature regardless of viewport size. Press M in dev to drag-edit. */}
      <HeroMarkerEditor markers={HERO_MARKERS} containerRef={sectionRef} />

      <div
        className="relative z-[6] grid grid-cols-1 lg:grid-cols-[1fr_400px] items-center gap-10 lg:gap-16 h-full px-6 lg:px-[72px]"
        style={{ minHeight: 'calc(100vh - 56px)', maxWidth: '1240px' }}
      >
        <motion.div style={{ maxWidth: '640px' }} variants={stagger(0.12)} initial="hidden" animate="show">
          <motion.div variants={fadeLeft} className="flex items-center gap-3.5 mb-6" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-amber)' }}>
            <span style={{ width: '26px', height: '1px', background: 'var(--color-amber)' }} />
            Chart Your Route
          </motion.div>
          <motion.h1
            variants={fadeUp}
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
          </motion.h1>
          <motion.p
            variants={fadeUp}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8125rem',
              lineHeight: 1.95,
              color: 'var(--color-text-secondary)',
              maxWidth: '520px',
            }}
          >
            {copy.hero.subhead}
          </motion.p>
        </motion.div>
        <motion.div
          className="w-full lg:justify-self-end"
          style={{ maxWidth: '400px' }}
          variants={fadeRight}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.55, ease: EASE, delay: 0.25 }}
        >
          <CoordForm ctaLabel={copy.hero.cta} />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Data strip ────────────────────────────────────────────────────────────

const dataCells = [
  { label: 'Destinations Monitored', value: String(destinationCount), sub: coverageLabelDot },
  { label: 'Sections Covered', value: '8', sub: 'Requirements to contingency plan' },
  { label: 'Source Tiers', value: 'T1 – T4', sub: 'Official sources to ground truth' },
  { label: 'Analysis Depth', value: '3', sub: 'Quick scan to deep dive' },
];

function DataStrip() {
  const isMobile = useMobile();
  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: `
      @media (min-width: 1024px) {
        .ds-grid { grid-template-columns: ${LANDING_AXIS} repeat(3, 1fr) !important; }
      }
    ` }} />
    <motion.div
      className="ds-grid relative grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[color:rgba(255,255,255,0.06)]"
      style={{ borderBottom: '1px solid var(--color-border)', willChange: isMobile ? 'auto' : 'transform, opacity' }}
      variants={isMobile ? noAnimStagger : stagger(0.1)}
      initial="hidden"
      animate={isMobile ? 'show' : undefined}
      whileInView={isMobile ? undefined : 'show'}
      viewport={VP}
    >
      {dataCells.map((cell, i) => (
        <motion.div
          key={cell.label}
          variants={isMobile ? noAnim : fadeUp}
          className={`flex flex-col gap-2 items-center text-center ${i === 0 ? 'lg:pl-[72px]' : ''} ${i === dataCells.length - 1 ? 'lg:pr-[72px]' : ''}`}
          style={{ padding: '30px 24px' }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
            {cell.label}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 900, lineHeight: 1, color: 'var(--color-amber)' }}>
            {cell.value}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', lineHeight: 1.6 }}>
            {cell.sub}
          </div>
        </motion.div>
      ))}
    </motion.div>
    </>
  );
}

// ─── Method ────────────────────────────────────────────────────────────────

function Method() {
  const isMobile = useMobile();
  const steps = copy.howItWorks.steps;
  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-[38%_1fr]" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <motion.div
        className="px-6 lg:pl-[72px] lg:pr-8 py-16"
        style={{ borderRight: '1px solid var(--color-border)', willChange: isMobile ? 'auto' : 'transform, opacity' }}
        variants={isMobile ? noAnimStagger : stagger(0.1)}
        initial="hidden"
        animate={isMobile ? 'show' : undefined}
        whileInView={isMobile ? undefined : 'show'}
        viewport={VP}
      >
        <motion.div variants={isMobile ? noAnim : fadeLeft}><SecLabel>Methodology</SecLabel></motion.div>
        <motion.h2
          variants={isMobile ? noAnim : fadeLeft}
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4.4vw, 3.5rem)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.9, color: 'var(--color-text-primary)', marginBottom: '20px' }}
        >
          Five sources.<br />One reconciled brief.
        </motion.h2>
        <motion.p variants={isMobile ? noAnim : fadeUp} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.95, color: 'var(--color-text-secondary)' }}>
          Contradictions are common. Official portals say one thing, community reports say enforcement changed last month. VisaScout shows both, with source tier, date, and a confidence rating.
        </motion.p>
      </motion.div>
      <motion.div
        className="px-6 lg:pl-12 lg:pr-[72px] py-16"
        style={{ willChange: isMobile ? 'auto' : 'transform, opacity' }}
        variants={isMobile ? noAnimStagger : stagger(0.15)}
        initial="hidden"
        animate={isMobile ? 'show' : undefined}
        whileInView={isMobile ? undefined : 'show'}
        viewport={VP}
      >
        {steps.map((step, i) => (
          <motion.div
            key={step.number}
            variants={isMobile ? noAnim : fadeUp}
            className="grid gap-5"
            style={{
              gridTemplateColumns: '44px 1fr',
              padding: '24px 0',
              paddingLeft: `${i * 40}px`,
              borderBottom: i === steps.length - 1 ? undefined : '1px solid var(--color-border-muted)',
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
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Brief exhibit ───────────────────────────────────────────────────────

function briefSection(label: string, first?: boolean) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', padding: first ? '4px 0 5px' : '14px 0 5px', borderTop: first ? 'none' : '1px solid var(--color-border-muted)', marginTop: first ? '0' : '4px' }}>
      {label}
    </div>
  );
}

function briefField(key: string, value: string, hi?: boolean) {
  return (
    <div className="grid vs-row" style={{ gridTemplateColumns: '150px 1fr', alignItems: 'start', padding: '7px 0' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', paddingTop: '2px' }}>
        {key}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: hi ? 'var(--color-amber)' : 'var(--color-text-primary)', fontWeight: hi ? 700 : 400 }}>
        {value}
      </div>
    </div>
  );
}

function visaOption(name: string, desc: string, cost: string, recommended?: boolean) {
  return (
    <div className="vs-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: recommended ? 'var(--color-amber)' : 'var(--color-text-tertiary)', flexShrink: 0, paddingTop: 1 }}>
        {recommended ? '★' : '○'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' as const }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: recommended ? 'var(--color-amber)' : 'var(--color-text-primary)' }}>{name}</span>
          {recommended && <span className="vs-badge vs-badge-outline" style={{ color: 'var(--color-amber)', fontSize: 8, padding: '1px 5px' }}>RECOMMENDED</span>}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{desc}</span>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-tertiary)', flexShrink: 0, paddingTop: 2 }}>{cost}</span>
    </div>
  );
}

function checkItem(label: string, note?: string) {
  return (
    <div className="grid vs-row" style={{ gridTemplateColumns: '150px 1fr', alignItems: 'start', padding: '7px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', paddingTop: '2px' }}>
        <span style={{ color: 'var(--color-success)', flexShrink: 0 }}>✓</span>
        <span>{label}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
        {note}
      </div>
    </div>
  );
}

function flagItem(date: string, text: string, tier: string) {
  return (
    <div className="grid vs-row" style={{ gridTemplateColumns: '150px 1fr', alignItems: 'start', padding: '7px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-tertiary)', paddingTop: '2px' }}>
        <span style={{ color: 'var(--color-secondary)', fontSize: '8px', lineHeight: 1, flexShrink: 0 }}>▲</span>
        <span>{date}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-primary)', flex: 1, lineHeight: 1.6 }}>{text}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-text-tertiary)', letterSpacing: '0.08em', flexShrink: 0, paddingTop: 2 }}>{tier}</span>
      </div>
    </div>
  );
}

const DOSSIER_LOCK: React.CSSProperties = {
  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
};

function BriefExhibit() {
  const isMobile = useMobile();
  const [deadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 12);
    return d;
  });
  const deadlineStr = deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <div id="brief" className="relative px-6 lg:px-[72px] py-16" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10 items-start">

        {/* Left — description */}
        <motion.div className="pt-1" variants={isMobile ? noAnim : fadeLeft} initial="hidden" animate={isMobile ? 'show' : undefined} whileInView={isMobile ? undefined : 'show'} viewport={VP}>
          <SecLabel>Sample Brief</SecLabel>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.95, color: 'var(--color-text-secondary)' }}>
            An Intel brief. Every claim sourced, tier-tagged, and conflict-resolved. This is a preview. Your full brief goes deeper on every section.
          </p>
        </motion.div>

        {/* Right — sample brief card */}
        <motion.div className="vs-rail" style={{ background: 'var(--color-bg-elevated)' }} variants={isMobile ? noAnim : fadeUp} initial="hidden" animate={isMobile ? 'show' : undefined} whileInView={isMobile ? undefined : 'show'} viewport={VP}>

          {/* Card header */}
          <div className="flex justify-between items-center flex-wrap gap-2" style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-base)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="vs-badge vs-badge-outline" style={{ color: 'var(--color-amber)', fontSize: 8 }}>INTEL</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                Visa Intelligence Brief
              </span>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-amber)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-amber)', flexShrink: 0 }} />
              Confidence: High
            </span>
          </div>

          <div className="sb-rows" style={{ padding: '16px 20px' }}>

            {briefSection('Situation', true)}
            {briefField('Passport', 'United States of America')}
            {briefField('Destination', 'Kingdom of Thailand')}
            {briefField('Current status', 'METV. Day 48 of 60. 12 days remaining')}
            {briefField('Goal', 'Extend stay 30+ days in-country')}

            {briefSection('Recommended Action')}
            <div style={{ marginTop: 6, background: 'rgba(var(--color-secondary-rgb),0.06)', borderLeft: '2px solid var(--color-amber)', padding: '11px 14px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-amber)', marginBottom: 7 }}>
                Deadline: {deadlineStr} · 12 days remaining
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.9, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                Apply TR extension at Chaeng Watthana before {deadlineStr}. Fee ฿1,900. Arrive by 08:00.
              </div>
            </div>

            {briefSection('Visa Options')}
            {visaOption('TR Extension (In-Country)', 'Extend at Chaeng Watthana. No border exit. 30 days. 1-day processing.', '฿1,900', true)}
            {visaOption('TR Visa (Border Run)', 'Exit to nearest consulate. New 60-day TR. Higher friction, 1–2 day turnaround.', '฿2,000 + travel')}

            {briefSection('Entry Requirements')}
            {checkItem('Passport', 'Valid ≥6 months past intended departure')}
            {checkItem('TM.7 form + photo', 'Download from immigration.go.th · 1x white background')}
            {checkItem('Proof of funds', '฿20,000 cash or bank statement')}

            {briefSection('Border Run Analysis')}
            {briefField('Enforcement posture', 'Moderate. Consecutive exemptions flagged at land borders')}
            {briefField('Verdict', 'TR extension preferred. Lower flag risk.', true)}

            {briefSection('Recent Changes, 90 Days')}
            {flagItem('Jul 2026', 'Chaeng Watthana extended hours to 16:30', 'T1')}
            {flagItem('May 2026', 'Poipet: 3 consecutive exemption limit now enforced', 'T4')}

            {briefSection('Conflict Report')}
            {briefField('Conflict', 'T1 states 30-day max; T4 reports 60-day grants at officer discretion')}
            {briefField('Resolution', 'T1 authoritative. T4 flags variance, monitor port-of-entry.', true)}

            {briefSection('Contingency')}
            {briefField('If denied', 'File at local sub-district office same day')}
            {briefField('If overstay', '฿500/day fine, max ฿20,000. Pay at departure gate.')}

          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── FAQ ───────────────────────────────────────────────────────────────────

function FAQ() {
  const isMobile = useMobile();
  const [open, setOpen] = useState<number | null>(null);
  const items = copy.faq.items;

  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-[38%_1fr]" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <motion.div
        className="px-6 lg:pl-[72px] lg:pr-8 py-16"
        style={{ borderRight: '1px solid var(--color-border)', willChange: isMobile ? 'auto' : 'transform, opacity' }}
        variants={isMobile ? noAnimStagger : stagger(0.12)}
        initial="hidden"
        animate={isMobile ? 'show' : undefined}
        whileInView={isMobile ? undefined : 'show'}
        viewport={VP}
      >
        <motion.div variants={isMobile ? noAnim : fadeLeft}><SecLabel>FAQ</SecLabel></motion.div>
        <motion.h2
          variants={isMobile ? noAnim : fadeLeft}
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4.4vw, 3.5rem)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.9, color: 'var(--color-text-primary)', marginBottom: '20px' }}
        >
          {copy.faq.title}
        </motion.h2>
        <motion.p variants={isMobile ? noAnim : fadeUp} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.95, color: 'var(--color-text-secondary)' }}>
          {copy.faq.subtitle}
        </motion.p>
      </motion.div>
      <motion.div
        className="px-6 lg:pl-12 lg:pr-[72px] py-16"
        style={{ willChange: isMobile ? 'auto' : 'transform, opacity' }}
        variants={isMobile ? noAnimStagger : stagger(0.08)}
        initial="hidden"
        animate={isMobile ? 'show' : undefined}
        whileInView={isMobile ? undefined : 'show'}
        viewport={VP}
      >
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <motion.div key={item.q} variants={isMobile ? noAnim : fadeUp} style={{ borderBottom: i === items.length - 1 ? undefined : '1px solid var(--color-border-muted)' }}>
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
                  <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor" aria-hidden="true"><path d="M0 0L8 0L4 5Z" /></svg>
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
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ─── CTA ───────────────────────────────────────────────────────────────────

function CTA() {
  const isMobile = useMobile();
  return (
    <div className="relative grid grid-cols-1 lg:grid-cols-[38%_1fr]" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <motion.div
        className="px-6 lg:pl-[72px] lg:pr-8 py-16 flex flex-col justify-center"
        style={{ borderRight: '1px solid var(--color-border)', willChange: isMobile ? 'auto' : 'transform, opacity' }}
        variants={isMobile ? noAnimStagger : stagger(0.12)}
        initial="hidden"
        animate={isMobile ? 'show' : undefined}
        whileInView={isMobile ? undefined : 'show'}
        viewport={VP}
      >
        <motion.div variants={isMobile ? noAnim : fadeLeft}><SecLabel>Get Your Brief</SecLabel></motion.div>
        <motion.h2
          variants={isMobile ? noAnim : fadeLeft}
          style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 5.4vw, 5.125rem)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.87, letterSpacing: '-0.015em', color: 'var(--color-text-primary)', marginBottom: '18px' }}
        >
          Your route.<br />Fully charted.
        </motion.h2>
        <motion.p variants={isMobile ? noAnim : fadeUp} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.95, color: 'var(--color-text-secondary)' }}>
          Sourced, conflict-resolved, confidence-scored. Every claim cited, every contradiction flagged.
        </motion.p>
      </motion.div>
      <motion.div
        className="px-6 lg:pl-12 lg:pr-[72px] py-16 flex flex-col justify-center items-center"
        style={{ willChange: isMobile ? 'auto' : 'transform, opacity', zIndex: 10, position: 'relative' }}
        variants={isMobile ? noAnim : fadeRight}
        initial="hidden"
        animate={isMobile ? 'show' : undefined}
        whileInView={isMobile ? undefined : 'show'}
        viewport={VP}
      >
        <CoordForm ctaLabel="Get My Free Visa Brief" />
      </motion.div>
    </div>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────

function Footer() {
  const isMobile = useMobile();
  return (
    <motion.footer
      className="relative grid grid-cols-1 lg:grid-cols-[38%_1fr]"
      variants={isMobile ? noAnim : fadeUp}
      initial="hidden"
      animate={isMobile ? 'show' : undefined}
      whileInView={isMobile ? undefined : 'show'}
      viewport={VP}
    >
      <div
        className="px-6 lg:pl-[72px] lg:pr-8 py-6 flex items-center"
        style={{ borderRight: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}
      >
        {clientConfig.brandName} &middot; &copy; {new Date().getFullYear()}
      </div>
      <div
        className="px-6 lg:pl-12 lg:pr-[72px] py-6 flex flex-col gap-2"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-text-tertiary)', lineHeight: 1.7 }}
      >
        <span>{clientConfig.disclaimerText}</span>
        <span style={{ letterSpacing: '0.06em' }}>
          <FooterLink href="/terms" className="inline" style={{ fontFamily: 'inherit', fontSize: 'inherit', textTransform: 'uppercase' }}>Terms</FooterLink>
          {' · '}
          <FooterLink href="/privacy" className="inline" style={{ fontFamily: 'inherit', fontSize: 'inherit', textTransform: 'uppercase' }}>Privacy</FooterLink>
          {' · '}
          <FooterLink href="/contact" className="inline" style={{ fontFamily: 'inherit', fontSize: 'inherit', textTransform: 'uppercase' }}>Contact</FooterLink>
        </span>
      </div>
    </motion.footer>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: clientConfig.landingPage.faq.items.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'VisaScout',
  url: 'https://visascout.io',
  description: 'Visa requirements for Thailand, Vietnam, Japan, and 31 more destinations — checked fresh from official sources, with real enforcement data.',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://visascout.io/app' },
    'query-input': 'required name=search_term_string',
  },
};

export default function LandingPage() {
  const [isMobile, setIsMobile] = useState(false);
  useLayoutEffect(() => { setIsMobile(window.innerWidth < 1024); }, []);
  return (
    <MobileCtx.Provider value={isMobile}>
    <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }} />
      <div aria-hidden className="chart-texture" />
      <ChartCornerMarks topLeft="" bottomRight="" />
      <LandingCoords />
      <LandingNav />
      <Hero />
      <DataStrip />
      <Method />
      <BriefExhibit />
      <FAQ />
      <CTA />
      <Footer />
    </div>
    </MobileCtx.Provider>
  );
}
