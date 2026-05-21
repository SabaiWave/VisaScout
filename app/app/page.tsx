'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
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

const AGENT_DISPLAY_ORDER = ['officialPolicy', 'recentChanges', 'communityIntel', 'entryRequirements', 'borderRun', 'conflictResolver'];

// Only show an agent as complete/failed once all agents above it have displayed as complete.
// Uses a Map of authoritative backend statuses — avoids a race where the ref is updated for a
// later event before React runs an earlier event's setState, causing stale 'running' to slip through.
function withOrderedCompletions(statuses: AgentStatusEntry[], backendStatus: Map<string, 'complete' | 'failed'>): AgentStatusEntry[] {
  let prevDone = true;
  return AGENT_DISPLAY_ORDER.map(agentName => {
    const entry = statuses.find(s => s.agent === agentName) ?? { agent: agentName, status: 'queued' as const };
    const finalStatus = backendStatus.get(agentName);
    if (prevDone && finalStatus) {
      return { ...entry, status: finalStatus };
    }
    prevDone = false;
    return finalStatus ? { ...entry, status: 'running' as const } : entry;
  });
}

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

function AgentRow({ entry }: { entry: AgentStatusEntry }) {
  const isQueued = entry.status === 'queued';
  const isDone = entry.status === 'complete';
  const isFailed = entry.status === 'failed';

  const leftBorder = isFailed ? 'var(--color-error)' : isQueued ? 'var(--color-border-muted)' : 'var(--color-secondary)';
  const borderColor = isDone ? 'var(--color-border)' : isFailed ? 'rgba(239,68,68,0.3)' : isQueued ? 'var(--color-border-muted)' : 'rgba(99,102,241,0.15)';
  const bg = isDone ? 'var(--color-bg-elevated)' : isFailed ? 'var(--color-error-bg)' : isQueued ? 'transparent' : 'var(--color-secondary-subtle)';

  const dotColor = isDone ? 'var(--color-success)' : isFailed ? 'var(--color-error)' : isQueued ? 'var(--color-border-strong)' : 'var(--color-amber)';
  const isConflictResolver = entry.agent === 'conflictResolver';
  const runningLabel = isConflictResolver ? 'resolving' : 'scanning';
  const labelText = isDone ? 'complete' : isFailed ? 'failed' : isQueued ? 'queued' : runningLabel;
  const labelColor = isDone ? 'var(--color-success)' : isFailed ? 'var(--color-error)' : isQueued ? 'var(--color-text-tertiary)' : 'var(--color-secondary-light)';

  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-lg border mb-1.5"
      style={{
        borderLeft: `3px solid ${leftBorder}`,
        borderTop: `1px solid ${borderColor}`,
        borderRight: `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
        background: bg,
      }}
    >
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${entry.status === 'running' ? 'animate-pulse' : ''}`}
        style={{ background: dotColor }}
      />
      <span
        className="text-xs font-bold uppercase flex-1"
        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: isQueued ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)' }}
      >
        {AGENT_DISPLAY[entry.agent] ?? entry.agent}
      </span>
      <span className="text-xs uppercase" style={{ fontFamily: 'var(--font-mono)', color: labelColor }}>
        {entry.status === 'running' ? <ScanningDots label={runningLabel} /> : labelText}
      </span>
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
        <SectionHeading as="h1" size="sm" className="mb-2">Sign in to generate briefs</SectionHeading>
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

  const [phase, setPhase] = useState<Phase>(
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' && (searchParams.get('sim') === 'error' || searchParams.get('sim') === 'free-cap') ? 'error' : 'idle'
  );
  const [agentsVisible, setAgentsVisible] = useState(false);
  const agentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const backendStatusRef = useRef<Map<string, 'complete' | 'failed'>>(new Map());
  const [brief, setBrief] = useState<VisaBrief | null>(null);
  const [briefId, setBriefId] = useState<string | null>(null);
  const wasCancelled = searchParams.get('cancelled') === 'true';
  const devSim = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' ? searchParams.get('sim') : null;
  const devTrigger = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' ? searchParams.get('trigger') : null;
  const [error, setError] = useState<string | null>(
    devSim === 'error' ? '[Simulated] Brief generation failed. Try again or contact support.' :
    devSim === 'free-cap' ? 'Daily free brief limit reached. Upgrade to Standard or Deep for unlimited research.' :
    wasCancelled ? 'Payment was cancelled. Your brief was not generated.' : null
  );
  const [capReached, setCapReached] = useState(devSim === 'free-cap');
  const [submitted, setSubmitted] = useState(false);
  const [isCheckingCap, setIsCheckingCap] = useState(false);

  async function runBriefStream(params: { nationality: string; destination: string; visaType?: string; freeform: string; depth: 'quick' | 'standard' | 'deep' }) {
    setPhase('generating');
    setAgentsVisible(false);
    if (agentTimerRef.current) clearTimeout(agentTimerRef.current);
    agentTimerRef.current = setTimeout(() => setAgentsVisible(true), 2500);
    try {
      const response = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        let errMsg = `Something went wrong (${response.status}). Try again or contact support.`;
        const ct = response.headers.get('content-type') ?? '';
        if (ct.includes('application/json')) {
          try {
            const err = await response.json() as { error?: string };
            if (err.error) errMsg = err.error;
          } catch { /* fall through to generic message */ }
        }
        if (response.status === 429) setCapReached(true);
        throw new Error(errMsg);
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
              if (entry.status === 'complete' || entry.status === 'failed') {
                backendStatusRef.current = new Map([...backendStatusRef.current, [entry.agent, entry.status]]);
              }
              setAgentStatuses(prev => {
                const idx = prev.findIndex(a => a.agent === entry.agent);
                const raw = idx >= 0 ? prev.map((a, i) => i === idx ? entry : a) : [...prev, entry];
                const allFiveBackendDone = ['officialPolicy', 'recentChanges', 'communityIntel', 'entryRequirements', 'borderRun']
                  .every(a => backendStatusRef.current.has(a));
                const resolver = raw.find(a => a.agent === 'conflictResolver');
                const withResolver = allFiveBackendDone && resolver?.status === 'queued'
                  ? raw.map(a => a.agent === 'conflictResolver' ? { ...a, status: 'running' as const } : a)
                  : raw;
                return withOrderedCompletions(withResolver, backendStatusRef.current);
              });
              break;
            }
            case 'complete':
              setAgentsVisible(true);
              setBrief(data.brief as VisaBrief);
              if (data.briefId) setBriefId(data.briefId as string);
              backendStatusRef.current = new Map([...backendStatusRef.current, ['conflictResolver', 'complete']]);
              setAgentStatuses(prev => {
                const idx = prev.findIndex(a => a.agent === 'conflictResolver');
                const completed = { agent: 'conflictResolver', status: 'complete' as const };
                const raw = idx >= 0 ? prev.map((a, i) => i === idx ? completed : a) : [...prev, completed];
                return withOrderedCompletions(raw, backendStatusRef.current);
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (!nationality || !destination || !freeform) return;
    setAgentStatuses(INITIAL_AGENT_STATUSES);
    backendStatusRef.current = new Map();
    setParsedSituation(null);
    setBrief(null);
    setBriefId(null);
    setError(null);
    setCapReached(false);

    if (depth === 'quick') {
      setIsCheckingCap(true);
      try {
        const capRes = await fetch('/api/user/cap');
        if (capRes.ok) {
          const cap = await capRes.json() as { allowed: boolean };
          if (!cap.allowed) {
            setCapReached(true);
            setIsCheckingCap(false);
            return;
          }
        }
      } catch { /* network error — let the stream handle it */ }
      setIsCheckingCap(false);
    }

    if (depth === 'standard' || depth === 'deep') {
      setPhase('redirecting');
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nationality, destination, visaType: visaType || undefined, freeform, depth }),
        });
        if (!res.ok) {
          let errMsg = 'Failed to start checkout. Try again or contact support.';
          const ct = res.headers.get('content-type') ?? '';
          if (ct.includes('application/json')) {
            try {
              const err = await res.json() as { error?: string };
              if (err.error) errMsg = err.error;
            } catch { /* fall through */ }
          }
          throw new Error(errMsg);
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

  // Dev: auto-fire quick brief when navigated from /dev with ?trigger=quick
  useEffect(() => {
    if (devTrigger !== 'quick' || !isSignedIn || !isLoaded) return;
    setAgentStatuses(INITIAL_AGENT_STATUSES);
    backendStatusRef.current = new Map();
    setParsedSituation(null);
    setBrief(null);
    setBriefId(null);
    setError(null);
    setSubmitted(false);
    void runBriefStream({
      nationality: 'American',
      destination: 'Thailand',
      visaType: 'Visa Exemption',
      freeform: "I'm planning a 2 week trip to Thailand. How many days am I permitted to stay on a visa exemption? What are my visa options if I wanted to stay longer? What are the costs involved?",
      depth: 'quick',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devTrigger, isSignedIn, isLoaded]);

  useEffect(() => {
    if (devSim !== 'free-cap') return;
    fetch('/api/debug/sim?event=free-cap.reached').catch(() => {});
  }, [devSim]);

  function handleReset() {
    if (agentTimerRef.current) clearTimeout(agentTimerRef.current);
    agentTimerRef.current = null;
    setAgentsVisible(false);
    setPhase('idle');
    setBrief(null);
    setBriefId(null);
    setParsedSituation(null);
    setAgentStatuses([]);
    backendStatusRef.current = new Map();
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

              {error && !capReached && (
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
                      <Button
                        key={d}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDepth(d)}
                        className="flex-1 rounded-full border-0 transition-all"
                        style={{
                          background: depth === d ? 'var(--color-secondary)' : 'transparent',
                          color: depth === d ? '#ffffff' : 'var(--color-text-tertiary)',
                        }}
                      >
                        {d === 'quick' ? 'Quick' : d === 'standard' ? 'Standard' : 'Deep'}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs mt-1.5 text-center uppercase" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                    {depth === 'quick' && 'Free · Fast results · 3 sources per agent'}
                    {depth === 'standard' && `$${(PRICES.standard.amount / 100).toFixed(2)} · Balanced · 5 sources per agent`}
                    {depth === 'deep' && `$${(PRICES.deep.amount / 100).toFixed(2)} · Thorough · 8 sources per agent · slower`}
                  </p>
                </div>

                {capReached && (
                  <div
                    className="rounded-lg px-4 py-3 border"
                    style={{ background: 'var(--color-amber-subtle)', borderColor: 'rgba(245,158,11,0.35)' }}
                  >
                    <p className="text-xs font-bold uppercase mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--color-amber)' }}>
                      Daily free brief limit reached
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      You&apos;ve used your free brief. Select Standard or Deep above to continue with unlimited research.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={phase === 'redirecting' || isCheckingCap}
                  className="w-full py-3"
                >
                  {isCheckingCap
                    ? 'Checking…'
                    : phase === 'redirecting'
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

              {/* Splash — shown for 2.5s before agent table appears */}
              {phase === 'generating' && !agentsVisible && (
                <div className="flex flex-col items-center py-32 text-center">
                  <div
                    className="w-20 h-20 rounded-full animate-spin mb-8"
                    style={{ border: '3px solid rgba(99,102,241,0.2)', borderTopColor: 'var(--color-secondary)' }}
                  />
                  <h2
                    className="text-2xl font-bold uppercase mb-4"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', letterSpacing: '0.04em' }}
                  >
                    <span style={{ color: 'var(--color-secondary)', marginRight: '0.5rem' }}>//</span>
                    Agents Deployed
                  </h2>
                  <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
                    Cross-referencing official policy, enforcement records, and community intel.
                  </p>
                  {nationality && destination && (
                    <p className="text-xs mt-4 uppercase" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                      {nationality} → {destination}
                    </p>
                  )}
                </div>
              )}

              {/* We Understood — skeleton + live text during generation; BriefRenderer owns it once complete */}
              {phase === 'generating' && agentsVisible && (
                <div className="mb-6">
                  <div
                    className="brief-section rounded-xl px-4 py-3 border"
                    style={{ background: 'var(--color-secondary-subtle)', borderColor: 'rgba(99,102,241,0.2)', boxShadow: 'var(--shadow-card)' }}
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
              )}

              {/* Agent Status */}
              {agentsVisible && agentStatuses.length > 0 && (
                <div className="mb-8">
                  <div
                    className="brief-section rounded-xl p-5 border"
                    style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card)' }}
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

                  <div className="flex justify-center items-start gap-4 mt-4">
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
