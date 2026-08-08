'use client';

import { useState, useEffect, Suspense } from 'react';
import { ChevronRight, Check, ChevronDown, Zap, Search, FileText, XCircle, AlertTriangle, Lock } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams, useRouter } from 'next/navigation';
import { clientConfig } from '@/config/client';
import { PRICES } from '@/src/lib/stripe';
import { BRIEF_DEPTHS, DEPTH_LABEL } from '@/src/lib/depth';
import { Button } from '@/app/components/ui/Button';
import { SectionHeading } from '@/app/components/ui/SectionHeading';

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
    color: '#10b981',
    colorRgb: '16,185,129',
  },
  standard: {
    icon: Search,
    label: 'Intel',
    price: `$${(PRICES.standard.amount / 100).toFixed(2)}`,
    description: 'Booking soon. Need all options on the table.',
    color: 'var(--color-depth-standard)',
    colorRgb: '200,120,10',
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

type Phase = 'idle' | 'redirecting' | 'error' | 'auth-prompt';

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
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' && (searchParams.get('sim') === 'error' || searchParams.get('sim') === 'free-cap') ? 'error' : 'idle'
  );
  const [nationality, setNationality] = useState(() => searchParams.get('nationality') || '');
  const [destination, setDestination] = useState(() => searchParams.get('destination') || '');
  const [visaType, setVisaType] = useState('');
  const [freeform, setFreeform] = useState('');
  const depthParam = searchParams.get('depth');
  const [depth, setDepth] = useState<'quick' | 'standard' | 'deep'>(
    depthParam === 'quick' || depthParam === 'deep' ? depthParam : 'standard'
  );
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (!nationality || !destination || !freeform) return;

    if (!isSignedIn) {
      setPhase('auth-prompt');
      return;
    }

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
      } catch { /* network error — let the main request handle it */ }
      setIsCheckingCap(false);

      try {
        const res = await fetch('/api/brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nationality, destination, visaType: visaType || undefined, freeform, depth }),
        });
        if (!res.ok) {
          let errMsg = `Something went wrong (${res.status}). Try again or contact support.`;
          const ct = res.headers.get('content-type') ?? '';
          if (ct.includes('application/json')) {
            try { const err = await res.json() as { error?: string }; if (err.error) errMsg = err.error; } catch { /* fall through */ }
          }
          if (res.status === 429) setCapReached(true);
          throw new Error(errMsg);
        }
        const { briefId } = await res.json() as { briefId: string };
        router.push(`/brief/${briefId}?pending=1`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setPhase('error');
      }
      return;
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
        try { sessionStorage.setItem('visascout_form_state', JSON.stringify({ nationality, destination, visaType, freeform, depth })); } catch { /* ignore */ }
        window.location.href = checkoutUrl;
        return;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
        setPhase('error');
        return;
      }
    }
  }

  // Dev: auto-fire quick brief when navigated from /dev with ?trigger=quick
  useEffect(() => {
    if (devTrigger !== 'quick' || !isSignedIn || !isLoaded) return;
    setError(null);
    void (async () => {
      try {
        const res = await fetch('/api/brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nationality: 'American',
            destination: 'Thailand',
            visaType: 'Visa Exemption',
            freeform: "I'm planning a 2 week trip to Thailand. How many days am I permitted to stay on a visa exemption? What are my visa options if I wanted to stay longer? What are the costs involved?",
            depth: (depthParam === 'quick' || depthParam === 'deep' ? depthParam : 'standard') as 'quick' | 'standard' | 'deep',
            simDegraded: devSimDegraded,
            forceDryRun: devForceDryRun,
          }),
        });
        if (!res.ok) throw new Error('Dev trigger failed');
        const { briefId } = await res.json() as { briefId: string };
        router.push(`/brief/${briefId}?pending=1`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Dev trigger failed');
        setPhase('error');
      }
    })();
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
    setPhase('idle');
    setError(null);
    setSubmitted(false);
    setNationality('');
    setDestination('');
    setVisaType('');
    setFreeform('');
    setDepth('standard');
  }

  const visaTypeOptions = destination ? (VISA_TYPES[destination] ?? []) : [];

  if (!isLoaded && phase !== 'redirecting') {
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
          {phase !== 'auth-prompt' && (
            <div className="max-w-[860px] mx-auto">
              <SectionHeading as="h1" size="md" className="mb-4">Generate Brief</SectionHeading>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Tell us your situation. We'll cross-check official sources, recent policy changes, and real traveler reports. One clear brief with every claim sourced.
              </p>

              {/* State: Off-Topic Rejection (amber) or Pipeline Error (red) */}
              {error && !capReached && (
                error.includes("doesn't appear to be about visa") ? (
                  <div className="mb-6" style={{ border: '1px solid rgba(var(--color-secondary-rgb),0.3)', background: 'rgba(var(--color-secondary-rgb),0.06)', padding: 16 }}>
                    <div className="flex items-center gap-2 mb-1.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-secondary)' }}>
                      <AlertTriangle size={16} aria-hidden="true" />
                      Out of Scope
                    </div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.65, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
                      VisaScout covers visa intelligence for the 20 supported destinations. Your query doesn&apos;t appear to be about visa requirements or entry rules.
                    </p>
                    <button type="button" onClick={handleReset} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: 'var(--color-secondary)', color: 'var(--color-bg-base)', border: '1px solid var(--color-secondary)', padding: '8px 20px', cursor: 'pointer' }}>
                      Try a Different Query
                    </button>
                  </div>
                ) : (
                  <div className="mb-6" style={{ border: '1px solid var(--color-error-border)', background: 'var(--color-error-bg)', padding: 16 }}>
                    <div className="flex items-center gap-2 mb-1.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-error)' }}>
                      <XCircle size={16} aria-hidden="true" />
                      Generation Failed
                    </div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.65, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
                      We hit an issue processing your request. Please try again.
                    </p>
                    <button type="button" onClick={handleReset} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: 'transparent', color: 'var(--color-secondary)', border: '1px solid var(--color-secondary)', padding: '8px 20px', cursor: 'pointer' }}>
                      Try Again
                    </button>
                  </div>
                )
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
                      boxShadow: textareaFocused ? '0 0 0 3px rgba(var(--color-secondary-rgb),0.18)' : 'none',
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
                            boxShadow: selected ? `0 0 0 3px rgba(${cfg.colorRgb},0.15)` : 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            outline: 'none',
                            transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
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

                {/* State: Free Cap Reached (Var A) — replaces CTA */}
                {capReached ? (
                  <div style={{ border: '1px solid rgba(var(--color-secondary-rgb),0.3)', background: 'rgba(var(--color-secondary-rgb),0.06)', padding: 20 }}>
                    <div className="flex items-center gap-2 mb-1.5" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-secondary)' }}>
                      Daily Free Brief Limit Reached
                    </div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.65, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
                      You&apos;ve used your free brief today. Upgrade to run an Intel or Dossier brief.
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                      <button type="button" onClick={() => { setDepth('standard'); setCapReached(false); }} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: 'var(--color-secondary)', color: 'var(--color-bg-base)', border: '1px solid var(--color-secondary)', padding: '8px 20px', cursor: 'pointer' }}>
                        Run Intel · ${(PRICES.standard.amount / 100).toFixed(2)}
                      </button>
                      <button type="button" onClick={() => { setDepth('deep'); setCapReached(false); }} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: 'transparent', color: 'var(--color-secondary)', border: '1px solid var(--color-secondary)', padding: '8px 20px', cursor: 'pointer' }}>
                        Run Dossier · ${(PRICES.deep.amount / 100).toFixed(2)}
                      </button>
                    </div>
                    {process.env.NEXT_PUBLIC_ENABLE_INVITE_CODES === 'true' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(var(--color-secondary-rgb),0.18)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-secondary)' }}>Have an invite code?</span>
                        <input
                          type="text"
                          value={inviteCode}
                          onChange={e => { setInviteCode(e.target.value); setInviteCodeError(null); }}
                          placeholder="VS-XXXX-XXXX"
                          aria-label="Invite code"
                          style={{ flex: 1, minWidth: 0, background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)', padding: '7px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-primary)', outline: 'none' }}
                        />
                        <button type="button" onClick={() => setShowInviteInput(true)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-strong)', padding: '6px 14px', cursor: 'pointer' }}>Apply</button>
                      </div>
                    )}
                  </div>
                ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Button
                    type="submit"
                    disabled={phase === 'redirecting' || isCheckingCap}
                    className="w-full py-3"
                    style={
                      inviteAccess
                        ? {}
                        : depth === 'quick'
                          ? { background: '#10b981', color: '#0a0a0a', boxShadow: '0 0 0 1px rgba(16,185,129,0.4), 0 0 24px rgba(16,185,129,0.2)' }
                          : depth === 'standard'
                            ? { background: 'var(--color-depth-standard)', color: 'var(--color-neutral)', boxShadow: '0 0 0 1px rgba(var(--color-secondary-rgb),0.4), 0 0 24px rgba(var(--color-secondary-rgb),0.2)' }
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
                                boxShadow: inviteInputFocused && !inviteCodeError ? '0 0 0 3px rgba(var(--color-secondary-rgb),0.18)' : 'none',
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
                )} {/* end capReached else */}
              </form>
            </div>
          )}

          {/* ── Auth Prompt (Sign-In card) ── */}
          {phase === 'auth-prompt' && (
            <div className="max-w-[860px] mx-auto">
              <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', padding: 40, textAlign: 'center' }}>
                <Lock size={32} aria-hidden="true" style={{ color: 'var(--color-text-tertiary)', margin: '0 auto', display: 'block' }} />
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', lineHeight: 1.1, letterSpacing: '0.01em', textTransform: 'uppercase', color: 'var(--color-text-primary)', marginTop: 16 }}>
                  Sign In to Generate
                </h4>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginTop: 8, marginBottom: 24 }}>
                  Your brief is saved to your account so you can access it anytime.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    try { sessionStorage.setItem('visascout_form_state', JSON.stringify({ nationality, destination, visaType, freeform, depth })); } catch { /* ignore */ }
                    router.push('/sign-in');
                  }}
                  style={{ width: '100%', background: 'var(--color-secondary)', color: 'var(--color-bg-base)', border: '1px solid var(--color-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Sign In
                </button>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 16 }}>
                  Don&apos;t have an account?{' '}
                  <a href="/sign-up" style={{ color: 'var(--color-secondary)', textDecoration: 'none', fontWeight: 700 }}>Sign up</a>
                </p>
                <button
                  type="button"
                  onClick={() => setPhase('idle')}
                  style={{ marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Back to form
                </button>
              </div>
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
