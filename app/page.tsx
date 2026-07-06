'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, MotionConfig, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Network, FileDown, AlertTriangle, ChevronDown } from 'lucide-react';
import { LandingNav } from './components/LandingNav';
import { SectionHeading } from './components/ui/SectionHeading';
import { FooterLink } from './components/ui/FooterLink';
import { Button } from './components/ui/Button';

import { clientConfig } from '@/config/client';

const { landingPage: copy } = clientConfig;

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Section-heading entrance — shared across all sections
function FadeIn({ children, className, delay = 0, noAnimation = false }: { children: React.ReactNode; className?: string; delay?: number; noAnimation?: boolean }) {
  if (noAnimation) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: EXPO, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────

function BriefExcerptPanel() {
  return (
    <div
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 6%, black 42%, transparent 72%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 6%, black 42%, transparent 72%)',
        transform: 'perspective(1000px) rotateX(1.5deg) rotateY(-1deg)',
        transformOrigin: 'center top',
        filter: 'drop-shadow(0 48px 96px rgba(0,0,0,0.92)) drop-shadow(0 16px 32px rgba(0,0,0,0.65))',
      }}
    >
      <div
        className="rounded-xl border p-5 relative overflow-hidden"
        style={{
          background: 'var(--color-bg-elevated)',
          borderColor: 'rgba(255,255,255,0.07)',
          borderTopColor: 'rgba(255,255,255,0.48)',
          borderLeftColor: 'rgba(255,255,255,0.24)',
          boxShadow: '0 1px 0 0 rgba(255,255,255,0.24) inset, 1px 0 0 0 rgba(255,255,255,0.10) inset',
        }}
      >
        {/* Corner catch — tiny top-left light specular, like studio light on glass corner */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-xl"
          style={{
            top: 0, left: 0, width: '40%', height: '30%',
            background: 'radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.06) 0%, transparent 70%)',
            zIndex: 1,
          }}
        />
        {/* All content sits above sheen */}
        <div className="relative flex flex-col gap-4" style={{ zIndex: 2 }}>
        {/* Route header — faded context */}
        <div className="flex items-start justify-between gap-3 flex-wrap" style={{ opacity: 'var(--brief-faded-1)' }}>
          <span className="text-xs font-bold uppercase" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-text-tertiary)' }}>
            US CITIZEN <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle', position: 'relative', top: '-1px' }} /> THAILAND
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[0.65rem] font-bold uppercase px-2 py-0.5" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--color-confidence-high)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', borderRadius: '4px' }}>
              WELL SOURCED
            </span>
          </div>
        </div>

        {/* RECOMMENDED ACTION — full opacity, the foreground hook */}
        <div
          className="rounded-lg p-4 flex flex-col gap-2"
          style={{
            background: 'rgba(245,158,11,0.06)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'rgba(245,158,11,0.18)',
            borderTopColor: 'rgba(245,158,11,0.55)',
            borderLeftColor: 'rgba(245,158,11,0.32)',
            boxShadow: '0 0 32px rgba(245,158,11,0.12), 0 4px 16px rgba(0,0,0,0.30)',
          }}
        >
          <p className="text-xs font-bold uppercase mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-amber)' }}>
            RECOMMENDED ACTION
          </p>
          <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>
            Apply online or at a Thai consulate for a 60-day Tourist Visa (TR) before your 30-day VOA expires.
          </p>
          <p className="text-xs font-bold uppercase" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-error)', letterSpacing: '0.04em' }}>
            DEADLINE: 15 DAYS
          </p>
          <div className="flex items-center gap-2 pt-2 mt-1 border-t" style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--color-success)' }} />
            <span className="text-[0.65rem] uppercase" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-text-tertiary)' }}>
              THAI IMMIGRATION · TIER 1 CONFIRMED
            </span>
          </div>
        </div>

        {/* Visa options — faded */}
        <div style={{ opacity: 'var(--brief-faded-1)' }}>
          <p className="text-xs font-bold uppercase mb-2" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-secondary)' }}>
            VISA OPTIONS
          </p>
          <div className="flex flex-col gap-1.5">
            <div className="rounded-lg p-3" style={{ background: 'rgba(99,102,241,0.06)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(99,102,241,0.12)', borderTopColor: 'rgba(99,102,241,0.45)', borderLeftColor: 'rgba(99,102,241,0.25)' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Visa Exemption (Tourist)</span>
                <span className="text-[0.6rem] font-bold uppercase px-2 py-0.5" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-secondary)', background: 'rgba(99,102,241,0.15)', borderRadius: '4px' }}>BEST FIT</span>
              </div>
              <span className="text-[0.65rem]" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-tertiary)' }}>Max stay 60 days (air) / 30 days (land)</span>
            </div>
            <div className="rounded-lg p-3" style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.06)', borderTopColor: 'rgba(255,255,255,0.20)', borderLeftColor: 'rgba(255,255,255,0.11)' }}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Tourist Visa (TR)</span>
                <span className="text-[0.6rem] font-bold uppercase px-2 py-0.5" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-text-tertiary)', background: 'var(--color-bg-overlay)', borderRadius: '4px' }}>ACCEPTABLE</span>
              </div>
              <span className="text-[0.65rem]" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-tertiary)' }}>60 days · extendable +30 days at immigration</span>
            </div>
          </div>
        </div>

        {/* Entry requirements — more faded, deeper in document */}
        <div style={{ opacity: 'var(--brief-faded-2)' }}>
          <p className="text-xs font-bold uppercase mb-2" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-secondary)' }}>
            ENTRY REQUIREMENTS
          </p>
          {['Valid passport (6+ months validity)', 'Return or onward ticket required', 'Proof of funds: 20,000 THB per person', 'Proof of accommodation (first night)'].map(item => (
            <div key={item} className="flex items-start gap-2 py-1">
              <span style={{ color: 'var(--color-secondary)', fontSize: '0.65rem', flexShrink: 0, marginTop: '2px' }}>•</span>
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Conflict report — most faded, bottom of document */}
        <div style={{ opacity: 'var(--brief-faded-3)' }}>
          <p className="text-xs font-bold uppercase mb-2" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-secondary)' }}>
            CONFLICT REPORT: 3 ITEMS
          </p>
          <div className="rounded-lg p-3 flex flex-col gap-1" style={{ border: '1px solid var(--color-border)' }}>
            <span className="text-[0.65rem] font-bold uppercase" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-success)' }}>● Confirmed</span>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Visa exemption duration · Proof of funds threshold</span>
            <span className="text-[0.65rem] font-bold uppercase mt-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-amber)' }}>● Contested</span>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Onward ticket enforcement inconsistently applied</span>
          </div>
        </div>
        </div>{/* /relative content wrapper */}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section
      className="relative overflow-hidden px-6 pt-12 pb-24"
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
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EXPO, delay: 0 }}
              className="text-xs font-bold uppercase mb-7"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}
            >
              SOUTHEAST ASIA — VISA INTELLIGENCE
            </motion.p>

            {/* overflow:hidden masks the h1 so it rises from below the clip boundary */}
            <div className="mb-6" style={{ overflow: 'hidden' }}>
              <motion.h1
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.78, ease: EXPO, delay: 0.12 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.1] text-balance"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
              >
                Know your visa situation.{' '}
                <span style={{ color: 'var(--color-amber)' }}>Before</span>
                {" it's a problem."}
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EXPO, delay: 0.28 }}
              className="text-base sm:text-lg mb-10 leading-relaxed max-w-lg"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {copy.hero.subhead}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EXPO, delay: 0.42 }}
              className="flex"
            >
              <Button asChild size="lg" style={{ background: 'var(--color-amber)', color: 'var(--color-neutral)' }}>
                <Link href={copy.hero.ctaHref}>{copy.hero.cta}</Link>
              </Button>
            </motion.div>
          </div>

          {/* Brief — absolutely positioned, out of flow, never inflates section height */}
          {/* motion.div handles opacity/y; inner div owns the 3D transform to avoid framer conflict */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: EXPO, delay: 0.38 }}
            className="hidden md:block absolute top-0 right-0"
            style={{ width: '46%' }}
          >
            <div
              style={{
                transform: 'perspective(1200px) rotateX(2deg) rotateY(-9deg)',
                transformOrigin: 'left center',
              }}
            >
              <BriefExcerptPanel />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ──────────────────────────────────────────────────────────────

const featureTierAccents = [
  { tagColor: 'var(--color-secondary-light)' },
  { tagColor: 'var(--color-amber)' },
  { tagColor: 'var(--color-success)' },
];

const featContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const featRow = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.45, ease: EXPO } },
};

function Features({ isMobile }: { isMobile: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px 0px' });

  return (
    <section className="px-4 sm:px-6 py-12 sm:py-20" style={{ background: 'var(--color-bg-elevated)' }}>
      <div className="max-w-[1120px] mx-auto">
        <FadeIn className="mb-10" noAnimation={isMobile}>
          <SectionHeading subtitle={copy.features.subtitle}>
            {copy.features.title}
          </SectionHeading>
        </FadeIn>

        <motion.div
          key={isMobile ? 'mobile' : 'desktop'}
          ref={ref}
          variants={isMobile ? {} : featContainer}
          initial={isMobile ? false : 'hidden'}
          animate={isMobile ? undefined : (inView ? 'show' : 'hidden')}
          className="rounded-xl border divide-y overflow-hidden"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-base)' }}
        >
          {copy.features.cards.map((card, i) => {
            const accent = featureTierAccents[i];
            return (
              <motion.div
                key={card.title}
                variants={isMobile ? {} : featRow}
                className="px-5 py-6 flex flex-col gap-1"
              >
                <p
                  className="text-xs font-bold uppercase mb-1"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: accent.tagColor }}
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
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ─── How It Works ──────────────────────────────────────────────────────────

const stepStyles = [
  {
    numberColor: 'var(--color-secondary)',
    borderColor: 'var(--color-border)',
    bg: 'var(--color-bg-elevated)',
    icon: <MessageSquare size={15} aria-hidden />,
  },
  {
    numberColor: 'var(--color-secondary)',
    borderColor: 'var(--color-border)',
    bg: 'var(--color-bg-elevated)',
    icon: <Network size={15} aria-hidden />,
  },
  {
    numberColor: 'var(--color-secondary)',
    borderColor: 'var(--color-border)',
    bg: 'var(--color-bg-elevated)',
    icon: <FileDown size={15} aria-hidden />,
  },
];

const stepContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const stepCard = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EXPO } },
};

function HowItWorks({ isMobile }: { isMobile: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px 0px' });

  return (
    <section className="px-4 sm:px-6 py-12 sm:py-20" style={{ background: 'var(--color-bg-base)' }}>
      <div className="max-w-[1120px] mx-auto">
        <FadeIn className="mb-12" noAnimation={isMobile}>
          <SectionHeading subtitle={copy.howItWorks.subtitle}>
            {copy.howItWorks.title}
          </SectionHeading>
        </FadeIn>

        <motion.div
          key={isMobile ? 'mobile' : 'desktop'}
          ref={ref}
          variants={isMobile ? {} : stepContainer}
          initial={isMobile ? false : 'hidden'}
          animate={isMobile ? undefined : (inView ? 'show' : 'hidden')}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {copy.howItWorks.steps.map((step, i) => {
            const style = stepStyles[i];
            return (
              <motion.div
                key={step.number}
                variants={isMobile ? {} : stepCard}
                className="hiw-card p-6 rounded-xl border flex flex-col gap-4"
                style={{
                  background: style.bg,
                  borderColor: style.borderColor,
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="text-4xl font-bold"
                    style={{ color: style.numberColor, fontFamily: 'var(--font-mono)' }}
                  >
                    {step.number}
                  </div>
                  <span style={{ color: 'var(--color-secondary)', opacity: 0.35 }}>
                    {style.icon}
                  </span>
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
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Destinations ──────────────────────────────────────────────────────────

const destContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const destCard = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: EXPO } },
};
const destDot = {
  hidden: { scale: 0 },
  show: { scale: 1, transition: { duration: 0.22, ease: EXPO, delay: 0.25 } },
};

function Destinations({ isMobile }: { isMobile: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px 0px' });

  return (
    <section className="px-4 sm:px-6 py-12 sm:py-20" style={{ background: 'var(--color-bg-elevated)' }}>
      <div className="max-w-[1120px] mx-auto">
        <FadeIn className="mb-12" noAnimation={isMobile}>
          <SectionHeading subtitle={copy.destinations.subtitle}>
            {copy.destinations.title}
          </SectionHeading>
        </FadeIn>

        <motion.div
          key={isMobile ? 'mobile' : 'desktop'}
          ref={ref}
          variants={isMobile ? {} : destContainer}
          initial={isMobile ? false : 'hidden'}
          animate={isMobile ? undefined : (inView ? 'show' : 'hidden')}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
        >
          {clientConfig.supportedDestinations.map(name => (
            <motion.div
              key={name}
              variants={isMobile ? {} : destCard}
              className="country-card p-4 rounded-lg border flex flex-col gap-2"
              style={{
                background: 'var(--color-bg-base)',
                borderColor: 'var(--color-border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <span
                className="text-base font-bold uppercase leading-tight"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                {name}
              </span>
              <span
                className="flex items-center gap-1.5"
                style={{ alignSelf: 'flex-start' }}
              >
                <motion.span
                  variants={isMobile ? {} : destDot}
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
                  style={{ background: 'var(--color-success)', transformOrigin: 'center' }}
                />
                <span
                  className="text-[0.65rem] font-bold uppercase"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)' }}
                >
                  Live
                </span>
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Pricing ───────────────────────────────────────────────────────────────

const planDepth = [
  { count: 3, color: 'var(--color-depth-quick)' },
  { count: 5, color: 'var(--color-depth-standard)' },
  { count: 8, color: 'var(--color-depth-deep)' },
];

function SourceDepthBars({ count, color }: { count: number; color: string }) {
  const max = 8;
  return (
    <div className="flex items-end gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          style={{
            width: '5px',
            height: `${5 + (i / (max - 1)) * 10}px`,
            background: i < count ? color : 'var(--color-border-strong)',
            borderRadius: '1px',
          }}
        />
      ))}
    </div>
  );
}

// Pricing cards enter simultaneously — they're comparison peers, not a sequence
const PRICING_TRANSITION = { duration: 0.55, ease: EXPO };

function Pricing({ isMobile }: { isMobile: boolean }) {
  return (
    <section className="px-4 sm:px-6 py-12 sm:py-20" style={{ background: 'var(--color-bg-base)' }}>
      <div className="max-w-[1120px] mx-auto">
        <FadeIn className="mb-12" noAnimation={isMobile}>
          <SectionHeading subtitle={copy.pricing.subtitle}>
            {copy.pricing.title}
          </SectionHeading>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {copy.pricing.plans.map((plan, i) => {
            const depth = planDepth[i];
            return (
              <motion.div
                key={isMobile ? `m-${plan.name}` : plan.name}
                {...(!isMobile && {
                  initial: { opacity: 0, y: 14 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, margin: '-60px' },
                  transition: PRICING_TRANSITION,
                })}
                className={`p-6 rounded-xl border flex flex-col ${plan.highlight ? 'pricing-card-highlight' : 'pricing-card'}`}
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
                {/* Source depth visual */}
                <div
                  className="flex items-center justify-between mb-5 pb-5 border-b"
                  style={{ borderColor: 'var(--color-border-muted)' }}
                >
                  <SourceDepthBars count={depth.count} color={depth.color} />
                  <span
                    className="text-[0.65rem] font-bold uppercase"
                    style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-text-tertiary)' }}
                  >
                    {depth.count} sources / agent
                  </span>
                </div>

                <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
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
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ───────────────────────────────────────────────────────────────────

const faqContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const faqItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EXPO } },
};

function FAQ({ isMobile }: { isMobile: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px 0px' });
  const items = copy.faq.items;

  return (
    <section className="px-4 sm:px-6 py-12 sm:py-20" style={{ background: 'var(--color-bg-elevated)' }}>
      <div className="max-w-[1120px] mx-auto">
        <FadeIn className="mb-12" noAnimation={isMobile}>
          <SectionHeading subtitle={copy.faq.subtitle}>
            {copy.faq.title}
          </SectionHeading>
        </FadeIn>

        <motion.div
          key={isMobile ? 'mobile' : 'desktop'}
          ref={ref}
          variants={isMobile ? {} : faqContainer}
          initial={isMobile ? false : 'hidden'}
          animate={isMobile ? undefined : (inView ? 'show' : 'hidden')}
          className="max-w-2xl mx-auto"
        >
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                variants={isMobile ? {} : faqItem}
                className="border-b"
                style={{ borderColor: 'var(--color-border-muted)' }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className={`faq-btn w-full flex items-center justify-between gap-4 py-5 text-left${isOpen ? ' faq-btn--open' : ''}`}
                  aria-expanded={isOpen}
                >
                  <span className="faq-question text-sm font-bold leading-snug">
                    {item.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: EXPO }}
                    className="faq-chevron flex-shrink-0"
                  >
                    <ChevronDown size={16} aria-hidden />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EXPO }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p
                        className="text-sm leading-relaxed pb-5"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
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
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      className="border-t px-6 py-6"
      style={{ background: 'var(--color-bg-subtle)', borderColor: 'var(--color-border-muted)' }}
    >
      <div className="max-w-[1120px] mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-6">
            <FooterLink href="/how-it-works">How It Works</FooterLink>
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
          </div>
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}
          >
            © {new Date().getFullYear()} {clientConfig.brandName} · All rights reserved.
          </p>
        </div>

        <div className="border-t pt-3" style={{ borderColor: 'var(--color-border-muted)' }}>
          <p className="text-xs leading-relaxed flex items-center gap-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
            <AlertTriangle size={12} className="shrink-0" />
            {clientConfig.disclaimerText}
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.matchMedia('(max-width: 767px)').matches);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
        <LandingNav />
        <Hero />
        <Features isMobile={isMobile} />
        <HowItWorks isMobile={isMobile} />
        <Destinations isMobile={isMobile} />
        <Pricing isMobile={isMobile} />
        <FAQ isMobile={isMobile} />
        <Footer />
      </div>
    </MotionConfig>
  );
}
