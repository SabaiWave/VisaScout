'use client';

import { useState, Suspense } from 'react';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import BriefRenderer from '@/app/components/BriefRenderer';
import type { VisaBrief, VisaRequest } from '@/src/types/index';
import { clientConfig } from '@/config/client';
import { PRICES } from '@/src/lib/stripe';
import { Button } from '@/app/components/ui/Button';
import { DownloadPdfButton } from '@/app/components/ui/DownloadPdfButton';
import { ShareButton } from '@/app/components/ui/ShareButton';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { CardHeading } from '@/app/components/ui/CardHeading';
import { SearchableCombobox } from '@/app/components/ui/SearchableCombobox';

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
  status: 'queued' | 'running' | 'complete' | 'failed';
  confidence?: string;
  sourceTier?: number;
  durationMs?: number;
  error?: string;
};

const INITIAL_AGENT_STATUSES: AgentStatusEntry[] = [
  { agent: 'officialPolicy',    status: 'running' },
  { agent: 'recentChanges',     status: 'running' },
  { agent: 'communityIntel',    status: 'running' },
  { agent: 'entryRequirements', status: 'running' },
  { agent: 'borderRun',         status: 'running' },
  { agent: 'conflictResolver',  status: 'queued' },
];

type Phase = 'idle' | 'generating' | 'redirecting' | 'complete' | 'error';

const AGENT_DISPLAY: Record<string, string> = {
  officialPolicy:    'Official Policy',
  recentChanges:     'Recent Changes',
  communityIntel:    'Community Intel',
  entryRequirements: 'Entry Requirements',
  borderRun:         'Border Run',
  conflictResolver:  'Conflict Resolver',
};

// ─── Agent row ─────────────────────────────────────────────────────────────

function AgentRow({ entry }: { entry: AgentStatusEntry }) {
  const borderColor = {
    queued:   'var(--color-border-muted)',
    running:  'var(--color-secondary)',
    complete: 'var(--color-border)',
    failed:   'var(--color-error-border)',
  }[entry.status];

  const bg = {
    queued:   'transparent',
    running:  'var(--color-secondary-subtle)',
    complete: 'var(--color-bg-elevated)',
    failed:   'var(--color-error-bg)',
  }[entry.status];

  const leftBorder = {
    queued:   'var(--color-border-muted)',
    running:  'var(--color-secondary)',
    complete: 'var(--color-secondary)',
    failed:   'var(--color-error)',
  }[entry.status];

  const confidenceStyle: Record<string, { bg: string; color: string }> = {
    high:   { bg: 'rgba(34,197,94,0.15)',  color: 'var(--color-confidence-high)' },
    medium: { bg: 'rgba(245,158,11,0.15)', color: 'var(--color-confidence-medium)' },
    low:    { bg: 'rgba(239,68,68,0.15)',  color: 'var(--color-confidence-low)' },
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-3 sm:px-4 py-3 rounded-lg border mb-1.5"
      style={{
        borderTop: `1px solid ${borderColor}`,
        borderRight: `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${leftBorder}`,
        background: bg,
        animation: entry.status === 'running' ? 'pulse-ring 1.5s ease infinite' : undefined,
      }}
    >
      {/* Status dot + agent name — always on same line */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {entry.status === 'queued' ? (
          <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: 'var(--color-border-strong)' }} />
        ) : entry.status === 'running' ? (
          <span className="w-2 h-2 rounded-full animate-pulse inline-block flex-shrink-0" style={{ background: 'var(--color-amber)' }} />
        ) : (
          <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: entry.status === 'complete' ? 'var(--color-success)' : 'var(--color-error)' }} />
        )}
        <span
          className="text-sm font-bold truncate"
          style={{ color: entry.status === 'queued' ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          {AGENT_DISPLAY[entry.agent] ?? entry.agent}
        </span>
      </div>
      {/* Badges — wrap on narrow screens */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {entry.status === 'queued' && (
          <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>queued</span>
        )}
        {entry.status === 'running' && (
          <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-secondary-light)', fontFamily: 'var(--font-mono)' }}>analyzing…</span>
        )}
        {entry.status === 'complete' && entry.confidence && (() => {
          const s = confidenceStyle[entry.confidence];
          return (
            <span
              className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
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
          <span className="text-xs hidden sm:inline" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
            {entry.durationMs}ms
          </span>
        )}
        {entry.status === 'failed' && (
          <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-error)', fontFamily: 'var(--font-mono)' }}>failed</span>
        )}
      </div>
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
          VisaScout cross-checks official sources, recent enforcement, and community ground truth to build your visa brief.
        </p>
      </div>
      <SignInButton mode="modal">
        <Button>Sign in to get started</Button>
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

// ─── Field error ───────────────────────────────────────────────────────────

function FieldError() {
  return (
    <p
      className="mt-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
      style={{ color: 'var(--color-error)', fontFamily: 'var(--font-mono)' }}
    >
      <span>▸</span> Required
    </p>
  );
}

// ─── Input styles ──────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px',
  fontSize: '1rem',
  fontFamily: 'var(--font-body)',
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
  letterSpacing: '0.08em',
  color: 'var(--color-text-secondary)',
  marginBottom: '8px',
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
  const depthParam = searchParams.get('depth');
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep'>(
    depthParam === 'quick' || depthParam === 'deep' ? depthParam : 'standard'
  );
  const [parsedSituation, setParsedSituation] = useState<VisaRequest | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatusEntry[]>([]);
  const [brief, setBrief] = useState<VisaBrief | null>(null);
  const [briefId, setBriefId] = useState<string | null>(null);
  const wasCancelled = searchParams.get('cancelled') === 'true';
  const [error, setError] = useState<string | null>(
    wasCancelled ? 'Payment was cancelled. Your brief was not generated.' : null
  );
  const [submitted, setSubmitted] = useState(false);
  const isGenerating = phase === 'generating';

  async function runBriefStream(params: { nationality: string; destination: string; visaType?: string; freeform: string; depth: 'quick' | 'standard' | 'deep' }) {
    setPhase('generating');
    try {
      const response = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
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
                const updated = idx >= 0 ? prev.map((a, i) => i === idx ? entry : a) : [...prev, entry];
                const fiveAgents = updated.filter(a => a.agent !== 'conflictResolver');
                const allDone = fiveAgents.length === 5 && fiveAgents.every(a => a.status !== 'running' && a.status !== 'queued');
                const resolver = updated.find(a => a.agent === 'conflictResolver');
                if (allDone && resolver?.status === 'queued') {
                  return updated.map(a => a.agent === 'conflictResolver' ? { ...a, status: 'running' as const } : a);
                }
                return updated;
              });
              break;
            }
            case 'complete':
              setBrief(data.brief as VisaBrief);
              if (data.briefId) setBriefId(data.briefId as string);
              setAgentStatuses(prev => {
                const idx = prev.findIndex(a => a.agent === 'conflictResolver');
                const completed = { agent: 'conflictResolver', status: 'complete' as const };
                return idx >= 0 ? prev.map((a, i) => i === idx ? completed : a) : [...prev, completed];
              });
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!nationality || !destination || !freeform) return;
    setAgentStatuses(INITIAL_AGENT_STATUSES);
    setParsedSituation(null);
    setBrief(null);
    setBriefId(null);
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

    await runBriefStream({ nationality, destination, visaType: visaType || undefined, freeform, depth });
  }

  async function handleFreeBrief() {
    setAgentStatuses(INITIAL_AGENT_STATUSES);
    setParsedSituation(null);
    setBrief(null);
    setBriefId(null);
    setError(null);
    await runBriefStream({
      nationality: 'American',
      destination: 'Thailand',
      visaType: 'Visa Exemption',
      freeform: "I'm planning a 2 week trip to Thailand. How many days am I permitted to stay on a visa exemption? What are my visa options if I wanted to stay longer? What are the costs involved?",
      depth: 'quick',
    });
  }

  function handleReset() {
    setPhase('idle');
    setBrief(null);
    setBriefId(null);
    setParsedSituation(null);
    setAgentStatuses([]);
    setError(null);
    setSubmitted(false);
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
    <div className="relative">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[480px] z-0" style={{ background: 'var(--bloom-app-bg)' }} />
    <main className="relative z-10 max-w-[1120px] mx-auto px-6 py-12">
      {!isSignedIn ? (
        <SignInPrompt />
      ) : (
        <>
          {/* ── Form ── */}
          {(phase === 'idle' || phase === 'error' || phase === 'redirecting') && (
            <div className="max-w-[560px] mx-auto">
              <SectionHeading as="h1" className="mb-4">Generate Brief</SectionHeading>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Official sources. Contradictions flagged. Confidence scored.
              </p>

              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleFreeBrief}
                  disabled={isGenerating}
                  className="w-full mb-8 py-2.5"
                >
                  Dev Mode: Generate a Free Brief — USA → Thailand, Visa Exemption
                </Button>
              )}

              {error && (
                <div
                  className="mb-6 rounded-lg px-4 py-3 text-sm border"
                  style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: 'var(--color-error)' }}
                >
                  {error}{' '}
                  <a href="/contact" style={{ color: 'var(--color-error)', textDecoration: 'underline', opacity: 0.8 }}>Contact us</a>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <label style={LABEL_STYLE} htmlFor="nationality">Your Nationality <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <SearchableCombobox
                    id="nationality"
                    options={NATIONALITIES}
                    value={nationality}
                    onChange={setNationality}
                    placeholder="Select nationality…"
                    hasError={submitted && !nationality}
                  />
                  {submitted && !nationality && <FieldError />}
                </div>

                <div>
                  <label style={LABEL_STYLE} htmlFor="destination">Destination <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <SearchableCombobox
                    id="destination"
                    options={DESTINATIONS}
                    value={destination}
                    onChange={v => { setDestination(v); setVisaType(''); }}
                    placeholder="Select destination…"
                    hasError={submitted && !destination}
                  />
                  {submitted && !destination && <FieldError />}
                </div>

                <div>
                  <label style={LABEL_STYLE} htmlFor="visaType">
                    Current Visa Type
                    <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--color-text-tertiary)' }}>(optional)</span>
                  </label>
                  <SearchableCombobox
                    id="visaType"
                    options={visaTypeOptions}
                    value={visaType}
                    onChange={setVisaType}
                    placeholder={destination ? 'Select visa type…' : 'Select destination first'}
                    disabled={!destination}
                  />
                </div>

                <div>
                  <label style={LABEL_STYLE} htmlFor="freeform">Describe your situation <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <textarea
                    id="freeform"
                    value={freeform}
                    onChange={e => setFreeform(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    placeholder="e.g. Arriving March 15, staying 28 days, planning one border run to Malaysia, work remotely for US company."
                    style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.75, minHeight: 100, border: `1px solid ${submitted && !freeform ? 'var(--color-error)' : 'var(--color-border)'}` }}
                  />
                  <p className="text-xs mt-1 text-right" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {freeform.length}/2000
                  </p>
                  {submitted && !freeform && <FieldError />}
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
                          color: depth === d ? '#ffffff' : 'var(--color-text-tertiary)',
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

                <Button
                  type="submit"
                  disabled={phase === 'redirecting'}
                  className="w-full py-3"
                >
                  {phase === 'redirecting'
                    ? 'Redirecting to checkout…'
                    : depth === 'quick'
                      ? 'Generate Brief · Free'
                      : depth === 'standard'
                        ? `Generate Brief · $${(PRICES.standard.amount / 100).toFixed(2)}`
                        : `Generate Brief · $${(PRICES.deep.amount / 100).toFixed(2)}`}
                </Button>
              </form>
            </div>
          )}

          {/* ── Generating / Complete output ── */}
          {(phase === 'generating' || phase === 'complete') && (
            <div className="max-w-[760px] mx-auto">

              {/* We Understood — always first; skeleton while orchestrator parses */}
              <div className="mb-6">
                <div
                  className="brief-section rounded-xl px-4 py-3 border"
                  style={{ background: 'var(--color-secondary-subtle)', borderColor: 'rgba(99,102,241,0.2)', boxShadow: '0 0 20px rgba(99,102,241,0.1)' }}
                >
                  <p className="mb-1"><CardHeading>We Understood</CardHeading></p>
                  {parsedSituation ? (
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      {parsedSituation.parsedSummary}
                    </p>
                  ) : (
                    <div className="space-y-2 mt-2">
                      <div className="h-3 rounded animate-pulse" style={{ background: 'rgba(99,102,241,0.2)', width: '85%' }} />
                      <div className="h-3 rounded animate-pulse" style={{ background: 'rgba(99,102,241,0.2)', width: '60%' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Agent Status */}
              {agentStatuses.length > 0 && (
                <div className="mb-8">
                  <div
                    className="brief-section rounded-xl p-5 border"
                    style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', boxShadow: '0 0 20px rgba(99,102,241,0.06)' }}
                  >
                    <p className="mb-3"><CardHeading>Agent Status</CardHeading></p>
                    {agentStatuses.map(entry => (
                      <AgentRow key={entry.agent} entry={entry} />
                    ))}
                  </div>
                </div>
              )}

              {brief && (
                <div>
                  <div id="brief-content">
                    <BriefRenderer brief={brief} forPrint={false} />
                  </div>

                  <div className="flex justify-center gap-4 mt-4">
                    {briefId && (
                      <DownloadPdfButton briefId={briefId} depth={depth} className="px-8 py-3" />
                    )}
                    {briefId && (
                      <ShareButton
                        url={`${window.location.origin}/brief/${briefId}`}
                        briefId={briefId}
                        className="px-8 py-3"
                      />
                    )}
                    <Button variant="ghost" onClick={handleReset} className="px-8 py-3">
                      New Brief
                    </Button>
                  </div>

                  <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--color-border-muted)' }}>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-tertiary)', textWrap: 'pretty' } as React.CSSProperties}>
                      ⚠ {brief.disclaimer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
    </div>
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
