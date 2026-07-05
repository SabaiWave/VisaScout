'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

// Shared "Agents Deployed" screen — used by quick flow (app/app/page.tsx) and paid flow (app/brief/pending/page.tsx).
// Children = the motion.div wrapping the agent rows (implementation differs per flow).

export const AGENT_DISPLAY_ORDER = [
  'officialPolicy',
  'recentChanges',
  'communityIntel',
  'entryRequirements',
  'borderRun',
  'conflictResolver',
] as const;

export type AgentKey = (typeof AGENT_DISPLAY_ORDER)[number];

export const AGENT_DISPLAY_LABELS: Record<AgentKey, string> = {
  officialPolicy:    'Official Policy',
  recentChanges:     'Recent Changes',
  communityIntel:    'Community Intel',
  entryRequirements: 'Entry Requirements',
  borderRun:         'Border Run',
  conflictResolver:  'Conflict Resolver',
};

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const rowContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const rowVariant = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EXPO } },
};

function ScanningDots({ label }: { label: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % 3), 450);
    return () => clearInterval(id);
  }, []);
  return (
    <span>
      {label}
      <span style={{ display: 'inline-block', width: '3ch', textAlign: 'left' }}>
        {'...'.slice(0, tick + 1)}
      </span>
    </span>
  );
}

function AgentDisplayRow({ label, index, displayCount, failed = false }: {
  label: string;
  index: number;
  displayCount: number;
  failed?: boolean;
}) {
  const done = index < displayCount;
  const isResolver = index === 5;
  const isResolving = isResolver && displayCount >= 5 && !done;
  const isQueued = isResolver && displayCount < 5 && !done;
  const isRunning = !done && !isQueued && !isResolving;

  const borderColor = done
    ? (failed ? 'rgba(239,68,68,0.3)' : 'var(--color-border)')
    : isQueued ? 'var(--color-border-muted)' : 'rgba(99,102,241,0.15)';
  const bg = done
    ? (failed ? 'var(--color-error-bg)' : 'var(--color-bg-elevated)')
    : isQueued ? 'transparent' : 'var(--color-secondary-subtle)';
  const iconColor = done
    ? (failed ? 'var(--color-error)' : 'var(--color-success)')
    : isQueued ? 'var(--color-text-tertiary)' : 'var(--color-secondary)';
  const labelColor = done
    ? (failed ? 'var(--color-error)' : 'var(--color-success)')
    : isQueued ? 'var(--color-text-tertiary)' : 'var(--color-secondary-light)';
  const StatusIcon = done ? (failed ? XCircle : CheckCircle2) : isQueued ? Clock : Loader2;
  const statusKey = done ? (failed ? 'failed' : 'complete') : isQueued ? 'queued' : isResolving ? 'resolving' : 'scanning';
  const statusLabel = done ? (failed ? 'failed' : 'complete') : isQueued ? 'queued' : null;

  return (
    <motion.div
      variants={rowVariant}
      className="flex items-center gap-3 px-4 py-3 rounded-lg mb-1.5"
      style={{ border: `1px solid ${borderColor}`, background: bg, willChange: 'transform, opacity' }}
    >
      <StatusIcon
        aria-hidden="true"
        size={14}
        className={(isRunning || isResolving) ? 'animate-spin' : ''}
        style={{ color: iconColor, flexShrink: 0 }}
      />
      <span
        className="text-xs font-bold uppercase flex-1"
        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: isQueued ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)' }}
      >
        {label}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={statusKey}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="text-xs uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: labelColor }}
        >
          {statusLabel !== null ? statusLabel : <ScanningDots label={isResolving ? 'resolving' : 'scanning'} />}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

// Shared row list — renders all 6 agents with sequential completion model.
// displayCount: how many agents have visually completed (0-6, top to bottom).
// failedAgents: map of agentKey → true for any that failed (shown in red).
export function AgentRowList({ displayCount, failedAgents = {} }: {
  displayCount: number;
  failedAgents?: Partial<Record<string, boolean>>;
}) {
  return (
    <motion.div variants={rowContainer} initial="hidden" animate="show">
      {AGENT_DISPLAY_ORDER.map((key, i) => (
        <AgentDisplayRow
          key={key}
          label={AGENT_DISPLAY_LABELS[key]}
          index={i}
          displayCount={displayCount}
          failed={failedAgents[key] === true}
        />
      ))}
    </motion.div>
  );
}

const SKELETON_SECTIONS = [
  { headingWidth: '55%', lines: 2 },
  { headingWidth: '35%', lines: 4 },
  { headingWidth: '45%', lines: 3 },
  { headingWidth: '40%', lines: 3 },
] as const;

export function AgentsDeployedScreen({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="max-w-md mx-auto mb-6">
        <div className="text-center mb-6">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}
          >
            Agents Deployed
          </h2>
          <div
            className="mb-5"
            style={{ height: 1, background: 'linear-gradient(to right, rgba(99,102,241,0.4), transparent)' }}
          />
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Pulling from official sources, recent enforcement data, and real traveler reports.
          </p>
          <p className="text-sm mb-5" style={{ color: 'var(--color-text-tertiary)' }}>
            Takes a few minutes depending on depth. Feel free to navigate away. We&apos;ll email you when it&apos;s ready.
          </p>
        </div>
        {children}
      </div>

      {/* Brief skeleton — appears after agent rows finish staggering in (~0.75s) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {SKELETON_SECTIONS.map((s, i) => (
          <div
            key={i}
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {/* No inline background — skeleton-shimmer class owns the gradient + animation */}
            <div className="skeleton-shimmer" style={{ height: 13, width: s.headingWidth, borderRadius: 4, marginBottom: 4 }} />
            {Array.from({ length: s.lines }).map((_, j) => (
              <div
                key={j}
                className="skeleton-shimmer"
                style={{ height: 14, width: j === s.lines - 1 ? '70%' : '100%', borderRadius: 4 }}
              />
            ))}
          </div>
        ))}
      </motion.div>
    </>
  );
}
