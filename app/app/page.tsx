'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import BriefRenderer from '@/app/components/BriefRenderer';
import type { VisaBrief, VisaRequest } from '@/src/types/index';
import { clientConfig } from '@/config/client';
import { PRICES } from '@/src/lib/stripe';

// ─── Static data ───────────────────────────────────────────────────────────

const DESTINATIONS = clientConfig.supportedDestinations;

const VISA_TYPES: Record<string, string[]> = {
  Thailand: ['Visa Exemption', 'Tourist Visa (TR)', 'Destination Thailand Visa (DTV)', 'Thailand Elite Visa', 'Non-Immigrant Visa', 'Long-Term Resident (LTR) Visa', 'Education Visa'],
  Vietnam: ['E-Visa', 'Visa on Arrival', 'Tourist Visa', 'Business Visa', 'Temporary Residence Card', 'Work Permit'],
  Indonesia: ['Visa on Arrival', 'Social/Cultural Visa (B211)', 'Business Visa', 'KITAS (Limited Stay Permit)', 'Retirement Visa', 'Digital Nomad Visa'],
  Malaysia: ['Visa Free Entry', 'eNTRI', 'Social Visit Pass', 'MM2H (Long-Term Residency)', 'Employment Pass', 'Business Visa'],
  Philippines: ['Visa Free', 'Tourist Visa', "Special Resident Retiree's Visa (SRRV)", 'Business Visa', '13A Permanent Resident'],
  Cambodia: ['Visa on Arrival', 'e-Visa', 'Tourist Visa (T)', 'Business Visa (E)', 'Ordinary Visa (EG)', 'Retirement Visa'],
  Laos: ['Visa on Arrival', 'e-Visa', 'Tourist Visa', 'Business Visa', 'Multiple Entry Visa'],
  Myanmar: ['e-Visa', 'Visa on Arrival', 'Tourist Visa', 'Business Visa', 'Social Visa'],
  Singapore: ['Visa Free', 'Social Visit Pass', 'Employment Pass', "Dependant's Pass", 'Long-Term Visit Pass'],
  Brunei: ['Visa Free', 'Tourist Visa', 'Business Visa', 'Social Visit Pass'],
};

const NATIONALITIES = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Argentine', 'Armenian', 'Australian', 'Austrian',
  'Azerbaijani', 'Bahamian', 'Bahraini', 'Bangladeshi', 'Belarusian', 'Belgian', 'Belizean', 'Bolivian', 'Bosnian', 'Brazilian',
  'British', 'Bulgarian', 'Cambodian', 'Canadian', 'Chilean', 'Chinese', 'Colombian', 'Costa Rican', 'Croatian', 'Cuban',
  'Czech', 'Danish', 'Dominican', 'Dutch', 'Ecuadorian', 'Egyptian', 'Emirati', 'Estonian', 'Ethiopian', 'Filipino',
  'Finnish', 'French', 'Georgian', 'German', 'Ghanaian', 'Greek', 'Guatemalan', 'Honduran', 'Hungarian', 'Indian',
  'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Jamaican', 'Japanese', 'Jordanian', 'Kazakhstani',
  'Kenyan', 'Korean', 'Kuwaiti', 'Kyrgyzstani', 'Lao', 'Latvian', 'Lebanese', 'Lithuanian', 'Luxembourgish', 'Malaysian',
  'Maldivian', 'Mexican', 'Moldovan', 'Mongolian', 'Moroccan', 'Mozambican', 'Myanmar', 'Namibian', 'Nepali', 'New Zealander',
  'Nigerian', 'Norwegian', 'Omani', 'Pakistani', 'Panamanian', 'Paraguayan', 'Peruvian', 'Polish', 'Portuguese', 'Qatari',
  'Romanian', 'Russian', 'Saudi', 'Senegalese', 'Serbian', 'Singaporean', 'Slovak', 'Slovenian', 'South African', 'Spanish',
  'Sri Lankan', 'Swedish', 'Swiss', 'Taiwanese', 'Tajikistani', 'Thai', 'Tunisian', 'Turkish', 'Ugandan', 'Ukrainian',
  'Uruguayan', 'Uzbekistani', 'Venezuelan', 'Vietnamese', 'Yemeni', 'Zambian', 'Zimbabwean',
];

// ─── Types ─────────────────────────────────────────────────────────────────

type AgentStatusEntry = {
  agent: string;
  status: 'running' | 'complete' | 'failed';
  confidence?: string;
  sourceTier?: number;
  durationMs?: number;
  error?: string;
};

type Phase = 'idle' | 'generating' | 'redirecting' | 'complete' | 'error';

const AGENT_DISPLAY: Record<string, string> = {
  officialPolicy:    'Official Policy',
  recentChanges:     'Recent Changes',
  communityIntel:    'Community Intel',
  entryRequirements: 'Entry Requirements',
  borderRun:         'Border Run',
};

// ─── Agent row ─────────────────────────────────────────────────────────────

function AgentRow({ entry }: { entry: AgentStatusEntry }) {
  const borderColor = {
    running:  'var(--color-secondary)',
    complete: 'var(--color-border)',
    failed:   '#3d1515',
  }[entry.status];

  const bg = {
    running:  'var(--color-secondary-subtle)',
    complete: 'var(--color-bg-elevated)',
    failed:   '#1a0a0a',
  }[entry.status];

  const leftBorder = {
    running:  'var(--color-secondary)',
    complete: 'var(--color-secondary)',
    failed:   'var(--color-error)',
  }[entry.status];

  const confidenceStyle: Record<string, { bg: string; color: string }> = {
    high:   { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e' },
    medium: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    low:    { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444' },
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg border mb-1.5"
      style={{
        borderTop: `1px solid ${borderColor}`,
        borderRight: `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${leftBorder}`,
        background: bg,
        animation: entry.status === 'running' ? 'pulse-ring 1.5s ease infinite' : undefined,
      }}
    >
      <span
        className="text-base"
        style={{
          color: entry.status === 'running' ? 'var(--color-secondary)' : entry.status === 'complete' ? 'var(--color-success)' : 'var(--color-error)',
          animation: entry.status === 'running' ? 'spin 1s linear infinite' : undefined,
        }}
      >
        {entry.status === 'running' ? '⟳' : entry.status === 'complete' ? '✓' : '✕'}
      </span>
      <span className="text-sm font-bold flex-1" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
        {AGENT_DISPLAY[entry.agent] ?? entry.agent}
      </span>
      {entry.status === 'running' && (
        <span className="text-xs" style={{ color: 'var(--color-secondary-light)', fontFamily: 'var(--font-mono)' }}>analyzing…</span>
      )}
      {entry.status === 'complete' && entry.confidence && (() => {
        const s = confidenceStyle[entry.confidence];
        return (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ background: s?.bg, color: s?.color, fontFamily: 'var(--font-mono)' }}
          >
            {entry.confidence}
          </span>
        );
      })()}
      {entry.status === 'complete' && entry.sourceTier && (
        <span
          className="text-xs px-2 py-0.5 rounded"
          style={{
            fontFamily: 'var(--font-mono)',
            background: entry.sourceTier === 1 ? 'var(--color-secondary-subtle)' : 'var(--color-bg-overlay)',
            color: entry.sourceTier === 1 ? 'var(--color-secondary-light)' : 'var(--color-text-tertiary)',
            border: `1px solid ${entry.sourceTier === 1 ? 'rgba(99,102,241,0.3)' : 'var(--color-border)'}`,
            fontWeight: entry.sourceTier === 1 ? 500 : 400,
          }}
        >
          T{entry.sourceTier}
        </span>
      )}
      {entry.status === 'complete' && entry.durationMs !== undefined && (
        <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
          {entry.durationMs}ms
        </span>
      )}
      {entry.status === 'failed' && (
        <span className="text-xs" style={{ color: 'var(--color-error)' }}>failed</span>
      )}
    </div>
  );
}

// ─── Sign-in prompt ────────────────────────────────────────────────────────

function SignInPrompt() {
  return (
    <div className="max-w-[560px] mx-auto text-center py-20">
      <div className="mb-6">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ background: 'var(--color-secondary-subtle)' }}
        >
          <svg className="w-8 h-8" style={{ color: 'var(--color-secondary)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
          <span style={{ color: 'var(--color-secondary)' }}>//</span> Sign in to generate briefs
        </h1>
        <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
          VisaScout runs a multi-agent intelligence pipeline — official sources, recent enforcement, and community ground truth — to build your visa brief.
        </p>
      </div>
      <SignInButton mode="modal">
        <button
          className="px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-white transition-colors"
          style={{ background: 'var(--color-secondary)', fontFamily: 'var(--font-mono)' }}
        >
          Sign in to get started
        </button>
      </SignInButton>
      <p className="mt-4 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        No account?{' '}
        <a href="/sign-up" className="font-medium transition-colors" style={{ color: 'var(--color-secondary-light)' }}>
          Create one free
        </a>
      </p>
    </div>
  );
}

// ─── Input styles ──────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px',
  fontSize: '0.875rem',
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-elevated)',
  outline: 'none',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  fontFamily: 'var(--font-mono)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-tertiary)',
  marginBottom: '6px',
};

// ─── Main page ─────────────────────────────────────────────────────────────

function AppContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<Phase>('idle');
  const [nationality, setNationality] = useState('');
  const [destination, setDestination] = useState('');
  const [visaType, setVisaType] = useState('');
  const [freeform, setFreeform] = useState('');
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [parsedSituation, setParsedSituation] = useState<VisaRequest | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatusEntry[]>([]);
  const [brief, setBrief] = useState<VisaBrief | null>(null);
  const [briefId, setBriefId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGenerating = phase === 'generating';
  const wasCancelled = searchParams.get('cancelled') === 'true';

  useEffect(() => {
    if (wasCancelled) {
      setError('Payment was cancelled. Your brief was not generated.');
    }
  }, [wasCancelled]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAgentStatuses([]);
    setParsedSituation(null);
    setBrief(null);
    setBriefId(null);
    setCopied(false);
    setError(null);

    if (depth === 'standard' || depth === 'deep') {
      setPhase('redirecting');
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nationality, destination, visaType: visaType || undefined, freeform, depth }),
        });
        if (!res.ok) {
          const err = await res.json() as { error?: string };
          throw new Error(err.error ?? 'Failed to start checkout');
        }
        const { checkoutUrl } = await res.json() as { checkoutUrl: string };
        window.location.href = checkoutUrl;
        return;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
        setPhase('error');
        return;
      }
    }

    setPhase('generating');
    try {
      const response = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationality, destination, visaType: visaType || undefined, freeform, depth }),
      });

      if (!response.ok) {
        const err = await response.json() as { error?: string };
        throw new Error(err.error ?? 'Request failed');
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          let data: Record<string, unknown>;
          try { data = JSON.parse(line.slice(6)) as Record<string, unknown>; } catch { continue; }

          switch (data.type) {
            case 'parsed':
              setParsedSituation(data.data as VisaRequest);
              break;
            case 'status': {
              const entry = data as AgentStatusEntry;
              setAgentStatuses(prev => {
                const idx = prev.findIndex(a => a.agent === entry.agent);
                return idx >= 0 ? prev.map((a, i) => i === idx ? entry : a) : [...prev, entry];
              });
              break;
            }
            case 'complete':
              setBrief(data.brief as VisaBrief);
              if (data.briefId) setBriefId(data.briefId as string);
              setPhase('complete');
              break;
            case 'error':
              throw new Error(data.message as string);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setPhase('error');
    }
  }

  function handleReset() {
    setPhase('idle');
    setBrief(null);
    setBriefId(null);
    setCopied(false);
    setParsedSituation(null);
    setAgentStatuses([]);
    setError(null);
  }

  async function handleCopyLink() {
    if (!briefId) return;
    const url = `${window.location.origin}/brief/${briefId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  }

  const visaTypeOptions = destination ? (VISA_TYPES[destination] ?? []) : [];

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--color-border-strong)', borderTopColor: 'var(--color-secondary)' }}
        />
      </div>
    );
  }

  return (
    <main className="max-w-[1120px] mx-auto px-6 py-12">
      {!isSignedIn ? (
        <SignInPrompt />
      ) : (
        <>
          {/* ── Form ── */}
          {(phase === 'idle' || phase === 'error' || phase === 'redirecting') && (
            <div className="max-w-[560px] mx-auto">
              <h1
                className="text-3xl font-bold mb-3"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}
              >
                <span style={{ color: 'var(--color-secondary)', marginRight: '0.5rem' }}>//</span>
                Generate Brief
              </h1>
              <div className="mb-4 h-px" style={{ background: 'linear-gradient(to right, rgba(99,102,241,0.5), transparent)' }} />
              <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                Official sources. Contradictions flagged. Confidence scored.
              </p>

              {error && (
                <div
                  className="mb-6 rounded-lg px-4 py-3 text-sm border"
                  style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: 'var(--color-error)' }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label style={LABEL_STYLE} htmlFor="nationality">Your Nationality</label>
                  <select
                    id="nationality"
                    value={nationality}
                    onChange={e => setNationality(e.target.value)}
                    required
                    style={INPUT_STYLE}
                  >
                    <option value="">Select nationality…</option>
                    {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                <div>
                  <label style={LABEL_STYLE} htmlFor="destination">Destination</label>
                  <select
                    id="destination"
                    value={destination}
                    onChange={e => { setDestination(e.target.value); setVisaType(''); }}
                    required
                    style={INPUT_STYLE}
                  >
                    <option value="">Select destination…</option>
                    {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label style={LABEL_STYLE} htmlFor="visaType">
                    Current Visa Type
                    <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--color-text-tertiary)' }}>optional</span>
                  </label>
                  <select
                    id="visaType"
                    value={visaType}
                    onChange={e => setVisaType(e.target.value)}
                    disabled={!destination}
                    style={{ ...INPUT_STYLE, opacity: !destination ? 0.5 : 1 }}
                  >
                    <option value="">{destination ? 'Select visa type…' : 'Select destination first'}</option>
                    {visaTypeOptions.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>

                <div>
                  <label style={LABEL_STYLE} htmlFor="freeform">Describe your situation</label>
                  <textarea
                    id="freeform"
                    value={freeform}
                    onChange={e => setFreeform(e.target.value)}
                    required
                    rows={4}
                    maxLength={2000}
                    placeholder="e.g. Arriving March 15, staying 28 days, planning one border run to Malaysia, work remotely for US company."
                    style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.75, minHeight: 100 }}
                  />
                  <p className="text-xs mt-1 text-right" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {freeform.length}/2000
                  </p>
                </div>

                {/* Depth selector */}
                <div>
                  <label style={LABEL_STYLE}>Research Depth</label>
                  <div
                    className="flex p-1 gap-1 rounded-full"
                    style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
                  >
                    {(['quick', 'standard', 'deep'] as const).map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDepth(d)}
                        className="flex-1 py-1.5 text-xs rounded-full font-bold uppercase tracking-wider transition-all"
                        style={{
                          background: depth === d ? 'var(--color-secondary)' : 'transparent',
                          color: depth === d ? '#fff' : 'var(--color-text-tertiary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {d === 'quick' ? 'Quick' : d === 'standard' ? 'Standard' : 'Deep'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {depth === 'quick' && 'Free · Fast results · 3 sources per agent'}
                    {depth === 'standard' && `$${(PRICES.standard.amount / 100).toFixed(2)} · Balanced · 5 sources per agent`}
                    {depth === 'deep' && `$${(PRICES.deep.amount / 100).toFixed(2)} · Thorough · 8 sources per agent · slower`}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={phase === 'redirecting'}
                  className="w-full py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-white transition-colors"
                  style={{ background: 'var(--color-secondary)', fontFamily: 'var(--font-mono)', opacity: phase === 'redirecting' ? 0.6 : 1, cursor: phase === 'redirecting' ? 'not-allowed' : 'pointer' }}
                >
                  {phase === 'redirecting'
                    ? 'Redirecting to checkout…'
                    : depth === 'quick'
                      ? 'Generate Brief — Free'
                      : depth === 'standard'
                        ? `Generate Brief — $${(PRICES.standard.amount / 100).toFixed(2)}`
                        : `Generate Brief — $${(PRICES.deep.amount / 100).toFixed(2)}`}
                </button>
              </form>
            </div>
          )}

          {/* ── Parsed Confirmation ── */}
          {parsedSituation && (phase === 'generating' || phase === 'complete') && (
            <div className="max-w-[760px] mx-auto mb-6">
              <div
                className="rounded-lg px-4 py-3 border"
                style={{ background: 'var(--color-secondary-subtle)', borderColor: 'rgba(99,102,241,0.2)', boxShadow: '0 0 20px rgba(99,102,241,0.1)' }}
              >
                <p
                  className="text-xl font-bold uppercase tracking-wider mb-1"
                  style={{ color: 'var(--color-secondary-light)', fontFamily: 'var(--font-mono)' }}
                >
                  We understood
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {parsedSituation.parsedSummary}
                </p>
              </div>
            </div>
          )}

          {/* ── Agent Progress + Output ── */}
          {(phase === 'generating' || phase === 'complete') && (
            <div className="max-w-[760px] mx-auto">
              {agentStatuses.length > 0 && (
                <div className="mb-8">
                  <div
                    className="rounded-xl p-5 border"
                    style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', boxShadow: '0 0 20px rgba(99,102,241,0.06)' }}
                  >
                    <p
                      className="text-xl font-bold uppercase tracking-wider mb-3"
                      style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}
                    >
                      Agent Status
                    </p>
                    {agentStatuses.map(entry => (
                      <AgentRow key={entry.agent} entry={entry} />
                    ))}
                    {isGenerating && agentStatuses.every(a => a.status !== 'running') && agentStatuses.length === 5 && (
                      <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                        Resolving conflicts and synthesizing brief…
                      </p>
                    )}
                  </div>
                </div>
              )}

              {isGenerating && agentStatuses.length === 0 && (
                <div className="text-center py-12 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                  <div
                    className="inline-block w-6 h-6 rounded-full border-2 animate-spin mb-3"
                    style={{ borderColor: 'var(--color-border-strong)', borderTopColor: 'var(--color-secondary)' }}
                  />
                  <p>Parsing your situation…</p>
                </div>
              )}

              {brief && (
                <div>
                  <BriefRenderer brief={brief} />

                  <div className="flex justify-center gap-4 mt-8">
                    {briefId && (
                      <button
                        onClick={handleCopyLink}
                        className="btn-brief-primary px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors"
                        style={{ background: copied ? 'var(--color-secondary-dark)' : 'var(--color-secondary)', borderColor: 'var(--color-secondary)', color: '#ffffff', fontFamily: 'var(--font-mono)' }}
                      >
                        {copied ? '✓ Copied' : 'Share'}
                      </button>
                    )}
                    <button
                      onClick={() => window.print()}
                      className="btn-brief-secondary px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors"
                      style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)', background: 'transparent', fontFamily: 'var(--font-mono)' }}
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={handleReset}
                      className="btn-brief-ghost px-8 py-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'transparent', fontFamily: 'var(--font-mono)' }}
                    >
                      New Brief
                    </button>
                  </div>

                  <div className="mt-6 rounded-lg px-4 py-3 border space-y-2" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)', boxShadow: '0 0 16px rgba(245,158,11,0.06)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>Disclaimer</p>
                    <p className="text-sm flex items-start gap-2" style={{ color: '#f59e0b' }}>
                      <span className="flex-shrink-0">⚠</span><span>{brief.disclaimer}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <div
      className="w-6 h-6 rounded-full border-2 animate-spin"
      style={{ borderColor: 'var(--color-border-strong)', borderTopColor: 'var(--color-secondary)' }}
    />
  </div>
);

export default function AppPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AppContent />
    </Suspense>
  );
}
