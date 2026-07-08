'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { ChevronRight, Check, ChevronDown, Zap, Search, FileText } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams, useRouter } from 'next/navigation';
import { clientConfig } from '@/config/client';
import { PRICES } from '@/src/lib/stripe';
import { BRIEF_DEPTHS, DEPTH_LABEL } from '@/src/lib/depth';
import { Button } from '@/app/components/ui/Button';
import { SectionHeading } from '@/app/components/ui/SectionHeading';
import { AgentsDeployedScreen, AgentRowList, AGENT_DISPLAY_ORDER } from '@/app/components/AgentsDeployedScreen';

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
  Japan: ['Visa Exemption', 'Tourist Visa (C-3)', 'Work Visa', 'Specified Skilled Worker Visa', 'Student Visa'],
  'South Korea': ['Visa Exemption', 'K-ETA', 'Tourist Visa (C-3)', 'Digital Nomad Visa (F-1-D)', 'Working Holiday Visa (H-1)', 'Work Visa'],
  Germany: ['Schengen Visa (C)', 'National Visa (D)', 'Freelance Visa', 'Job Seeker Visa', 'EU Blue Card'],
  Portugal: ['Schengen Visa (C)', 'National Visa (D)', 'Digital Nomad Visa (D8)', 'Non-Habitual Resident (NHR)', 'Golden Visa'],
  Spain: ['Schengen Visa (C)', 'National Visa (D)', 'Digital Nomad Visa', 'Non-Lucrative Residency Visa', 'Golden Visa'],
  Netherlands: ['Schengen Visa (C)', 'National Visa (D)', 'Highly Skilled Migrant Permit', 'Orientation Year Visa'],
  France: ['Schengen Visa (C)', 'National Visa (D)', 'Talent Passport', 'Freelancer / Self-Employed Visa'],
  Mexico: ['FMM Tourist Card', 'Temporary Resident Visa', 'Permanent Resident Visa', 'Work Visa'],
  Colombia: ['Tourist Visa (90 days)', 'Digital Nomad Visa (M-10)', 'Temporary Resident (Migrant)', 'Permanent Resident'],
  Schengen: ['Schengen Visa (C)', 'National Visa (D)'],
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

// ─── Depth card config ─────────────────────────────────────────────────────

const DEPTH_CONFIG = {
  quick: {
    icon: Zap,
    label: 'Scout',
    price: 'Free',
    description: 'Is there a visa issue I need to know about?',
    color: 'var(--color-depth-quick)',
    colorRgb: '129,140,248',
  },
  standard: {
    icon: Search,
    label: 'Intel',
    price: `$${(PRICES.standard.amount / 100).toFixed(2)}`,
    description: 'Booking soon. Need all options on the table.',
    color: '#6366F1',
    colorRgb: '99,102,241',
  },
  deep: {
    icon: FileText,
    label: 'Dossier',
    price: `$${(PRICES.deep.amount / 100).toFixed(2)}`,
    description: "Complex situation or can't afford to be wrong.",
    color: 'var(--color-depth-deep)',
    colorRgb: '251,191,36',
  },
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────

// Used only for typing SSE event data — display model uses agentDisplayCount instead.
type AgentStatusEntry = {
  agent: string;
  status: 'queued' | 'running' | 'complete' | 'failed';
  confidence?: string;
  sourceTier?: number;
  durationMs?: number;
  error?: string;
};

type Phase = 'idle' | 'generating' | 'redirecting' | 'error';

// Minimum ms between sequential agent reveal steps. Prevents instant cascade when agents
// complete near-simultaneously (DRY_RUN / fast pipeline). Matches paid flow stagger feel.
const MIN_REVEAL_STAGGER_MS = 400;

// ─── Field error ───────────────────────────────────────────────────────────

function FieldError() {
  return (
    <p
      className="mt-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
      style={{ color: 'var(--color-error)', fontFamily: 'var(--font-mono)' }}
    >
      <ChevronRight size={10} aria-hidden="true" /> Required
    </p>
  );
}

// ─── Input styles ──────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px',
  fontSize: '1rem', // must stay ≥16px — iOS Safari auto-zooms on focus if smaller
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text-primary)',
  background: 'var(--color-bg-elevated)',
  outline: 'none',
  touchAction: 'manipulation', // prevent double-tap zoom on mobile inputs
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  fontFamily: 'var(--font-mono)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--color-text-secondary)',
  marginBottom: '8px',
};

// ─── Main page ─────────────────────────────────────────────────────────────

function AppContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>(
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' && searchParams.get('trigger') === 'quick' ? 'generating' :
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' && (searchParams.get('sim') === 'error' || searchParams.get('sim') === 'free-cap') ? 'error' : 'idle'
  );
  const [agentsVisible, setAgentsVisible] = useState(
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' && searchParams.get('trigger') === 'quick'
  );
  const agentsVisibleRef = useRef(false);
  const revealTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pendingBriefIdRef = useRef<string | null>(null);
  // Sequential reveal model: agents complete visually top-to-bottom, one at a time.
  const [agentDisplayCount, setAgentDisplayCount] = useState(0);
  const agentDisplayCountRef = useRef(0);
  const lastRevealRef = useRef(0);       // timestamp of last reveal (for min-stagger enforcement)
  const revealScheduledRef = useRef(-1); // which idx currently has a pending reveal timer (-1 = none)
  const [nationality, setNationality] = useState('');
  const [destination, setDestination] = useState('');
  const [visaType, setVisaType] = useState('');
  const [freeform, setFreeform] = useState('');
  const depthParam = searchParams.get('depth');
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep'>(
    depthParam === 'quick' || depthParam === 'deep' ? depthParam : 'standard'
  );
  const backendStatusRef = useRef<Map<string, 'complete' | 'failed'>>(new Map());
  const wasCancelled = searchParams.get('cancelled') === 'true';
  const devSim = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' ? searchParams.get('sim') : null;
  const devTrigger = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' ? searchParams.get('trigger') : null;
  const devSimDegraded = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' && searchParams.get('sim_degraded') === 'true';
  const devForceDryRun = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' && searchParams.get('force_dry_run') === 'true';
  const [error, setError] = useState<string | null>(
    devSim === 'error' ? '[Simulated] Brief generation failed. Try again or contact support.' :
    devSim === 'free-cap' ? `Daily free brief limit reached. Upgrade to ${DEPTH_LABEL.standard} or ${DEPTH_LABEL.deep} for unlimited research.` :
    wasCancelled ? 'Payment was cancelled. Your brief was not generated.' : null
  );
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(
    devSim === 'invalid-code' ? 'Invalid invite code.' :
    devSim === 'code-already-used' ? 'This invite code has already been used.' : null
  );
  const [capReached, setCapReached] = useState(devSim === 'free-cap');
  const [submitted, setSubmitted] = useState(false);
  const [isCheckingCap, setIsCheckingCap] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteAccess, setInviteAccess] = useState(false);
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [textareaFocused, setTextareaFocused] = useState(false);
  const [inviteInputFocused, setInviteInputFocused] = useState(false);

  // Advance display count by one step, respecting MIN_REVEAL_STAGGER_MS between reveals.
  // Cascades automatically — after revealing idx N, immediately checks if N+1 is ready.
  // Only one reveal timer is active at a time (guarded by revealScheduledRef).
  function scheduleNextReveal() {
    const idx = agentDisplayCountRef.current;
    if (idx >= AGENT_DISPLAY_ORDER.length) return;
    if (revealScheduledRef.current === idx) return; // already scheduled

    const nextAgent = AGENT_DISPLAY_ORDER[idx];
    if (!backendStatusRef.current.has(nextAgent)) return; // not done yet — will be called again on completion

    revealScheduledRef.current = idx;
    const now = Date.now();
    const delay = Math.max(0, lastRevealRef.current + MIN_REVEAL_STAGGER_MS - now);

    const t = setTimeout(() => {
      revealScheduledRef.current = -1;
      lastRevealRef.current = Date.now();
      agentDisplayCountRef.current = idx + 1;
      setAgentDisplayCount(idx + 1);
      scheduleNextReveal(); // cascade to next agent if already completed
    }, delay);
    revealTimersRef.current.push(t);
  }

  useEffect(() => {
    agentsVisibleRef.current = agentsVisible;
    if (!agentsVisible) {
      revealTimersRef.current.forEach(t => clearTimeout(t));
      revealTimersRef.current = [];
      revealScheduledRef.current = -1;
      return;
    }
    // agentsVisible just became true — reset display state and start cascading reveals
    agentDisplayCountRef.current = 0;
    setAgentDisplayCount(0);
    lastRevealRef.current = 0;
    revealScheduledRef.current = -1;
    scheduleNextReveal(); // cascade through any agents already completed (DRY_RUN / fast pipeline)
  }, [agentsVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  // When all 6 agents have revealed, pause briefly so the resolver row stays green,
  // then redirect to the brief page. Matches the paid flow redirect behavior.
  useEffect(() => {
    if (agentDisplayCount < AGENT_DISPLAY_ORDER.length) return;
    if (!pendingBriefIdRef.current) return;
    const id = pendingBriefIdRef.current;
    pendingBriefIdRef.current = null;
    const t = setTimeout(() => {
      router.push(`/brief/${id}`);
    }, 600);
    revealTimersRef.current.push(t);
  }, [agentDisplayCount]); // eslint-disable-line react-hooks/exhaustive-deps

  async function runBriefStream(params: { nationality: string; destination: string; visaType?: string; freeform: string; depth: 'quick' | 'standard' | 'deep'; simDegraded?: boolean; forceDryRun?: boolean }) {
    setPhase('generating');
    setAgentsVisible(true);
    agentDisplayCountRef.current = 0;
    setAgentDisplayCount(0);
    lastRevealRef.current = 0;
    revealScheduledRef.current = -1;
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
            case 'brief_id':
              if (data.briefId) pendingBriefIdRef.current = data.briefId as string;
              break;
            case 'status': {
              const entry = data as AgentStatusEntry;
              if (entry.status === 'complete' || entry.status === 'failed') {
                backendStatusRef.current = new Map([...backendStatusRef.current, [entry.agent, entry.status]]);
                if (agentsVisibleRef.current) scheduleNextReveal();
              }
              break;
            }
            case 'complete':
              backendStatusRef.current = new Map([...backendStatusRef.current, ['conflictResolver', 'complete']]);
              if (data.briefId) pendingBriefIdRef.current = data.briefId as string;
              if (agentsVisibleRef.current) scheduleNextReveal();
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

    if (!isSignedIn) {
      try {
        sessionStorage.setItem('visascout_form_state', JSON.stringify({ nationality, destination, visaType, freeform, depth }));
      } catch { /* ignore storage errors */ }
      router.push('/sign-in');
      return;
    }

    backendStatusRef.current = new Map();
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
          body: JSON.stringify({ nationality, destination, visaType: visaType || undefined, freeform, depth, inviteCode: inviteCode.trim() || undefined }),
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
          // Invite code errors: stay on form so user can fix the code
          if (inviteCode.trim() && (res.status === 400 || res.status === 409)) {
            setInviteCodeError(errMsg);
            setPhase('idle');
            return;
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
    backendStatusRef.current = new Map();
    setError(null);
    setSubmitted(false);
    void runBriefStream({
      nationality: 'American',
      destination: 'Thailand',
      visaType: 'Visa Exemption',
      freeform: "I'm planning a 2 week trip to Thailand. How many days am I permitted to stay on a visa exemption? What are my visa options if I wanted to stay longer? What are the costs involved?",
      depth: (depthParam === 'quick' || depthParam === 'deep' ? depthParam : 'standard') as 'quick' | 'standard' | 'deep',
      simDegraded: devSimDegraded,
      forceDryRun: devForceDryRun,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devTrigger, isSignedIn, isLoaded]);

  useEffect(() => {
    if (devSim !== 'free-cap') return;
    fetch('/api/debug/sim?event=free-cap.reached').catch(() => {});
  }, [devSim]);

  useEffect(() => {
    if (devSim !== 'invalid-code' && devSim !== 'code-already-used') return;
    fetch('/api/debug/sim?event=invite.invalid-code').catch(() => {});
  }, [devSim]);

  useEffect(() => {
    if (!isSignedIn || !isLoaded) return;
    fetch('/api/user/cap')
      .then(r => r.ok ? r.json() : null)
      .then((data: { inviteAccess?: boolean } | null) => { if (data?.inviteAccess) setInviteAccess(true); })
      .catch(() => {});
  }, [isSignedIn, isLoaded]);

  // Restore form state saved before auth redirect
  useEffect(() => {
    if (!isSignedIn || !isLoaded) return;
    try {
      const saved = sessionStorage.getItem('visascout_form_state');
      if (!saved) return;
      sessionStorage.removeItem('visascout_form_state');
      const state = JSON.parse(saved) as Partial<{ nationality: string; destination: string; visaType: string; freeform: string; depth: 'quick' | 'standard' | 'deep' }>;
      if (state.nationality) setNationality(state.nationality);
      if (state.destination) setDestination(state.destination);
      if (state.visaType) setVisaType(state.visaType);
      if (state.freeform) setFreeform(state.freeform);
      if (state.depth && ['quick', 'standard', 'deep'].includes(state.depth)) setDepth(state.depth);
    } catch { /* corrupt state — ignore */ }
  }, [isSignedIn, isLoaded]);

  function handleReset() {
    revealTimersRef.current.forEach(t => clearTimeout(t));
    revealTimersRef.current = [];
    pendingBriefIdRef.current = null;
    agentDisplayCountRef.current = 0;
    lastRevealRef.current = 0;
    revealScheduledRef.current = -1;
    setAgentDisplayCount(0);
    setAgentsVisible(false);
    setPhase('idle');
    backendStatusRef.current = new Map();
    setError(null);
    setSubmitted(false);
    setNationality('');
    setDestination('');
    setVisaType('');
    setFreeform('');
    setDepth('standard');
  }

  // handleReset kept for future use (e.g. error state "Try again" button)
  void handleReset;

  const visaTypeOptions = destination ? (VISA_TYPES[destination] ?? []) : [];

  if (!isLoaded && phase !== 'generating' && phase !== 'redirecting') {
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
      <>
          {/* ── Form ── */}
          {(phase === 'idle' || phase === 'error' || phase === 'redirecting') && (
            <div className="max-w-[560px] mx-auto">
              <SectionHeading as="h1" size="md" className="mb-4">Generate Brief</SectionHeading>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Tell us your situation. We'll cross-check official sources, recent policy changes, and real traveler reports. One clear brief with every claim sourced.
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
                {/* Nationality + Destination — paired row */}
                <div className="grid grid-cols-2 gap-3 items-start">
                  <div>
                    <label style={LABEL_STYLE} htmlFor="nationality">Nationality <span style={{ color: 'var(--color-error)' }}>*</span></label>
                    <SearchableCombobox
                      id="nationality"
                      options={NATIONALITIES}
                      value={nationality}
                      onChange={setNationality}
                      placeholder="Select…"
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
                      placeholder="Select…"
                      hasError={submitted && !destination}
                    />
                    {submitted && !destination && <FieldError />}
                  </div>
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
                    onFocus={() => setTextareaFocused(true)}
                    onBlur={() => setTextareaFocused(false)}
                    rows={5}
                    maxLength={2000}
                    aria-invalid={submitted && !freeform ? true : undefined}
                    aria-required="true"
                    placeholder="I'm arriving in Thailand on March 15 and staying about 28 days. I work remotely for a US company and I'm thinking about a quick border run to Malaysia to reset my stay."
                    style={{
                      ...INPUT_STYLE,
                      resize: 'vertical',
                      lineHeight: 1.75,
                      minHeight: 130,
                      border: `1px solid ${submitted && !freeform ? 'var(--color-error)' : textareaFocused ? 'var(--color-secondary)' : 'var(--color-border)'}`,
                      boxShadow: textareaFocused ? '0 0 0 3px rgba(99,102,241,0.18)' : 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                  />
                  <p className="text-xs mt-1 text-right" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {freeform.length}/2000
                  </p>
                  {submitted && !freeform && <FieldError />}
                </div>

                {/* Depth selector */}
                <div>
                  <p style={LABEL_STYLE}>Research Depth</p>
                  <div className="grid grid-cols-3 gap-3">
                    {BRIEF_DEPTHS.map(d => {
                      const cfg = DEPTH_CONFIG[d];
                      const Icon = cfg.icon;
                      const selected = depth === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setDepth(d)}
                          style={{
                            padding: '14px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${selected ? `rgba(${cfg.colorRgb},0.5)` : 'var(--color-border-strong)'}`,
                            background: selected ? `rgba(${cfg.colorRgb},0.07)` : 'var(--color-bg-elevated)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            outline: 'none',
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                        >
                          <div style={{ marginBottom: 10 }}>
                            <Icon size={16} aria-hidden="true" style={{ color: selected ? cfg.color : 'var(--color-text-tertiary)' }} />
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: selected ? cfg.color : 'var(--color-text-primary)', marginBottom: 4 }}>
                            {cfg.label}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: selected ? cfg.color : 'var(--color-text-tertiary)', marginBottom: 8 }}>
                            {cfg.price}
                          </div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--color-text-tertiary)', lineHeight: 1.45 }}>
                            {cfg.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {capReached && (
                  <div
                    className="rounded-lg px-4 py-3 border"
                    style={{ background: 'var(--color-amber-subtle)', borderColor: 'rgba(245,158,11,0.35)' }}
                  >
                    <p className="text-xs font-bold uppercase mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-amber)' }}>
                      Daily free brief limit reached
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      You&apos;ve used your free brief. Select {DEPTH_LABEL.standard} or {DEPTH_LABEL.deep} above to continue with unlimited research.
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Button
                    type="submit"
                    disabled={phase === 'redirecting' || isCheckingCap}
                    className="w-full py-3"
                    style={
                      inviteAccess
                        ? {}
                        : depth === 'quick'
                          ? { background: '#818cf8', color: '#ffffff', boxShadow: '0 0 0 1px rgba(129,140,248,0.4), 0 0 24px rgba(129,140,248,0.2)' }
                          : depth === 'standard'
                            ? { background: '#6366F1', color: '#ffffff', boxShadow: '0 0 0 1px rgba(99,102,241,0.4), 0 0 24px rgba(99,102,241,0.2)' }
                            : { background: 'var(--color-depth-deep)', color: 'var(--color-neutral)' }
                    }
                  >
                    {isCheckingCap
                      ? 'Checking…'
                      : phase === 'redirecting'
                        ? 'Starting…'
                        : !isSignedIn
                          ? 'Sign In to Generate'
                          : depth === 'quick' || inviteAccess
                            ? 'Generate Brief · Free'
                            : depth === 'standard'
                              ? `Generate Brief · $${(PRICES.standard.amount / 100).toFixed(2)}`
                              : `Generate Brief · $${(PRICES.deep.amount / 100).toFixed(2)}`}
                  </Button>

                  {process.env.NEXT_PUBLIC_ENABLE_INVITE_CODES === 'true' && (
                    inviteAccess ? (
                      <p className="text-center text-xs font-bold uppercase flex items-center justify-center gap-1.5" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-success)' }}>
                        <Check size={12} aria-hidden="true" /> Invite access active
                      </p>
                    ) : (depth === 'standard' || depth === 'deep') ? (
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowInviteInput(v => !v)}
                          className="w-full flex items-center justify-center gap-1 text-xs uppercase"
                          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
                        >
                          Have an invite code?
                          <ChevronDown
                            size={11}
                            aria-hidden="true"
                            style={{ transform: showInviteInput ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
                          />
                        </button>
                        {showInviteInput && (
                          <div style={{ marginTop: 8 }}>
                            <input
                              type="text"
                              value={inviteCode}
                              onChange={e => { setInviteCode(e.target.value); setInviteCodeError(null); }}
                              placeholder="Enter invite code"
                              onFocus={() => setInviteInputFocused(true)}
                              onBlur={() => setInviteInputFocused(false)}
                              style={{
                                ...INPUT_STYLE,
                                border: `1px solid ${inviteCodeError ? 'var(--color-error)' : inviteInputFocused ? 'var(--color-secondary)' : 'var(--color-border-strong)'}`,
                                boxShadow: inviteInputFocused && !inviteCodeError ? '0 0 0 3px rgba(99,102,241,0.18)' : 'none',
                              }}
                            />
                            {inviteCodeError && (
                              <p className="mt-1.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--color-error)', fontFamily: 'var(--font-mono)' }}>
                                <ChevronRight size={10} aria-hidden="true" /> {inviteCodeError}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null
                  )}
                </div>
              </form>
            </div>
          )}

          {/* ── Generating ── */}
          {phase === 'generating' && (
            <div className="max-w-[760px] mx-auto">
              {agentsVisible && (
                <AgentsDeployedScreen>
                  <AgentRowList
                    displayCount={agentDisplayCount}
                    failedAgents={Object.fromEntries(
                      Array.from(backendStatusRef.current.entries())
                        .filter(([, v]) => v === 'failed')
                        .map(([k]) => [k, true])
                    )}
                  />
                </AgentsDeployedScreen>
              )}
            </div>
          )}
        </>
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
