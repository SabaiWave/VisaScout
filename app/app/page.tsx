'use client';

import { useState, useEffect, Suspense, useTransition } from 'react';
import { ChevronRight, Check, Zap, Search, FileText, XCircle, AlertTriangle, Lock, Info } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useSearchParams, useRouter } from 'next/navigation';
import { clientConfig } from '@/config/client';
import { PRICES } from '@/src/lib/stripe';
import { BRIEF_DEPTHS, DEPTH_LABEL } from '@/src/lib/depth';
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

// ─── Rail static data ──────────────────────────────────────────────────────

const DEPTH_RAIL = {
  quick:    { src: '3', time: '~60s',   sources: '15' },
  standard: { src: '5', time: '~90s',   sources: '25' },
  deep:     { src: '8', time: '~180s',  sources: '40' },
} as const;

const RAIL_AGENTS = [
  { name: 'Official Policy',    tier: 'T1' },
  { name: 'Recent Changes',     tier: 'T1–T2' },
  { name: 'Entry Requirements', tier: 'T1' },
  { name: 'Community Intel',    tier: 'T4' },
  { name: 'Border Run',         tier: 'T1–T4' },
];

const BRIEF_SECTIONS = [
  'Parsed Situation',
  'Visa Options, Ranked',
  'Recommended Action + Deadline',
  'Entry Requirements',
  'Border Run Analysis',
  'Recent Changes & Watch Items',
  'Conflict Report',
  'Confidence Score + Citations',
  'Contingency',
];

// ─── Depth card config ─────────────────────────────────────────────────────

const DEPTH_CONFIG = {
  quick: {
    icon: Zap,
    label: 'Scout',
    price: 'Free',
    description: 'Is there a visa issue I need to know about?',
    color: 'var(--color-depth-quick)',
  },
  standard: {
    icon: Search,
    label: 'Intel',
    price: `$${(PRICES.standard.amount / 100).toFixed(2)}`,
    description: 'Booking soon. Need all options on the table.',
    color: 'var(--color-depth-standard)',
  },
  deep: {
    icon: FileText,
    label: 'Dossier',
    price: `$${(PRICES.deep.amount / 100).toFixed(2)}`,
    description: "Complex situation or can't afford to be wrong.",
    color: 'var(--color-depth-deep)',
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
  const [, startTransition] = useTransition();

  const [phase, setPhase] = useState<Phase>(
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' && (searchParams.get('sim') === 'error' || searchParams.get('sim') === 'free-cap' || searchParams.get('sim') === 'off-topic') ? 'error' : 'idle'
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
  const [error, setError] = useState<string | null>(
    devSim === 'error' ? '[Simulated] Brief generation failed. Try again or contact support.' :
    devSim === 'free-cap' ? `Daily free brief limit reached. Upgrade to ${DEPTH_LABEL.standard} or ${DEPTH_LABEL.deep} for unlimited research.` :
    devSim === 'off-topic' ? "Your query doesn't appear to be about visa requirements or entry rules for a supported destination." :
    wasCancelled ? 'Payment was cancelled. Your brief was not generated.' : null
  );
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(
    devSim === 'invalid-code' ? 'Invalid invite code.' :
    devSim === 'code-already-used' ? 'This invite code has already been used.' : null
  );
  const [inviteErrorType, setInviteErrorType] = useState<'invalid' | 'already-used' | null>(
    devSim === 'invalid-code' ? 'invalid' :
    devSim === 'code-already-used' ? 'already-used' : null
  );
  const [capReached, setCapReached] = useState(devSim === 'free-cap');
  const [submitted, setSubmitted] = useState(false);
  const [isCheckingCap, setIsCheckingCap] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteAccess, setInviteAccess] = useState(false);
  const [showInviteInput, setShowInviteInput] = useState(devSim === 'invalid-code' || devSim === 'code-already-used');
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
      setPhase('redirecting');
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
        startTransition(() => { router.push(`/brief/${briefId}?pending=1`); });
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
          // Invite code errors: stay on form so user can fix or dismiss
          if (inviteCode.trim() && (res.status === 400 || res.status === 409)) {
            setInviteCodeError(errMsg);
            setInviteErrorType(res.status === 409 ? 'already-used' : 'invalid');
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


  useEffect(() => {
    if (devSim !== 'free-cap') return;
    fetch('/api/debug/sim?event=free-cap.reached').catch(() => {});
  }, [devSim]);

  useEffect(() => {
    if (devSim === 'invalid-code') fetch('/api/debug/sim?event=invite.invalid-code').catch(() => {});
    else if (devSim === 'code-already-used') fetch('/api/debug/sim?event=invite.already-used').catch(() => {});
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

  const routeCompleted = (nationality ? 1 : 0) + (destination ? 1 : 0) + (freeform.trim().length > 0 ? 1 : 0) + 1; // depth always set
  const readyToDispatch = nationality && destination && freeform.trim().length > 0;
  const depthCfg = DEPTH_CONFIG[depth];
  const railDepth = DEPTH_RAIL[depth];

  return (
    <div className="relative">
      {/* Page-scoped layout CSS — namespaced app-* to avoid collision */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── Layout ── */
        .app-work { display: grid; grid-template-columns: 1fr 360px; align-items: start; }
        .app-work-l { padding: 0 48px 80px 64px; }
        .app-work-r { display: flex; flex-direction: column; }

        /* ── Right rail panels (untouched) ── */
        .app-rp { border: 1px solid var(--color-border); background: var(--color-bg-elevated); }
        .app-rp + .app-rp { margin-top: 14px; }
        .app-rp-h { display: flex; align-items: center; padding: 9px 12px; font-family: var(--font-mono); font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.22em; color: var(--color-secondary); border-bottom: 1px solid var(--color-border); background: var(--color-bg-base); gap: 0; white-space: nowrap; }
        .app-rp-h i { flex: 1; height: 1px; background: linear-gradient(to right, rgba(200,120,10,0.34), transparent); margin: 0 10px; font-style: normal; display: block; min-width: 10px; }
        .app-rp-ct { font-size: 8px; color: var(--color-text-tertiary); letter-spacing: 0.14em; font-weight: 400; white-space: nowrap; }
        .app-rp-b { padding: 12px; }
        .app-bfield { display: grid; grid-template-columns: 80px 1fr; padding: 7px 0; /* border-bottom from vs-row */ }
        .app-bfield:last-child { padding-bottom: 0; }
        .app-bkey { font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--color-text-tertiary); padding-top: 2px; }
        .app-bval { font-family: var(--font-mono); font-size: 12px; color: var(--color-text-primary); }
        .app-bval.pending { color: var(--color-text-tertiary); font-style: italic; }
        .app-bval.hi { color: var(--color-secondary); }
        .app-agent-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid var(--color-border); font-family: var(--font-mono); font-size: 10px; color: var(--color-text-secondary); }
        .app-agent-row:first-child { padding-top: 0; }
        .app-agent-row:last-child { border-bottom: none; padding-bottom: 0; }
        .app-agent-st { font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-text-tertiary); }
        .app-tier-chip { font-size: 7px; color: var(--color-text-tertiary); border: 1px solid var(--color-border); padding: 1px 4px; margin-left: 6px; }
        .app-metrics { display: grid; grid-template-columns: 1fr 1fr; }
        .app-m-cell { padding: 11px 12px; border-right: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
        .app-m-cell:nth-child(2n) { border-right: none; }
        .app-m-cell:nth-last-child(-n+2) { border-bottom: none; }
        .app-m-k { font-family: var(--font-mono); font-size: 7px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-text-tertiary); margin-bottom: 4px; }
        .app-m-v { font-family: var(--font-mono); font-size: 20px; font-weight: 700; line-height: 1; color: var(--color-secondary); }
        .app-outline { list-style: none; margin: 0; padding: 0; }
        .app-outline li { display: flex; gap: 10px; align-items: baseline; padding: 7px 0; font-family: var(--font-mono); font-size: 12px; color: var(--color-text-secondary); border-bottom: 1px solid var(--color-border); }
        .app-outline li:first-child { padding-top: 0; }
        .app-outline li:last-child { border-bottom: none; padding-bottom: 0; }
        .app-outline .n { font-size: 8px; letter-spacing: 0.12em; color: var(--color-text-tertiary); min-width: 20px; }
        .app-outline li:nth-child(n+4) { opacity: 0.45; }
        .app-outline li:nth-child(n+7) { opacity: 0.2; }
        .app-outline li:nth-child(n+9) { opacity: 0.1; }
        .app-panel-panels { padding: 80px 16px 16px; display: flex; flex-direction: column; gap: 14px; flex: 1; }
        .app-panel-foot { border-top: 1px solid var(--color-border); padding: 10px 14px; font-family: var(--font-mono); font-size: 9px; color: var(--color-text-tertiary); flex-shrink: 0; }
        .app-sq { display: inline-block; width: 5px; height: 5px; background: var(--color-secondary); margin-right: 6px; vertical-align: middle; }

        /* ── Form groups ── */
        .app-grp { padding: 34px 0; border-bottom: 1px solid rgba(255,255,255,0.05); max-width: 900px; }
        .app-grp:last-of-type { border-bottom: none; }
        .app-grp-head { display: flex; align-items: baseline; gap: 14px; margin-bottom: 18px; }
        .app-grp-n { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.2em; color: var(--color-secondary); }
        .app-grp-t { font-family: var(--font-display); font-size: 19px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: var(--color-text-primary); }
        .app-grp-req { margin-left: auto; font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-text-tertiary); border: 1px solid rgba(255,255,255,0.08); padding: 3px 7px; }
        .app-pair { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }

        /* ── Coord-row inputs ── */
        .app-coord-row { display: flex; border: 1px solid var(--color-border-strong); transition: border-color 0.15s; }
        .app-coord-row:focus-within { border-color: var(--color-secondary); }
        .app-coord-row.error { border-color: var(--color-error); }
        .app-coord-row.disabled { opacity: 0.44; }
        .app-coord-pfx { background: var(--color-bg-base); color: var(--color-secondary); font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; padding: 0 14px; display: flex; align-items: center; line-height: 1; white-space: nowrap; flex-shrink: 0; width: 154px; border-right: 1px solid var(--color-border); }
        .app-coord-combo { flex: 1; min-width: 0; background: var(--color-bg-overlay); }
        .app-coord-combo > div { width: 100%; }
        .app-coord-combo input { border: none !important; border-radius: 0 !important; box-shadow: none !important; background: var(--color-bg-overlay) !important; font-family: var(--font-mono) !important; padding-left: 14px !important; font-size: 1rem !important; }
        @media (min-width: 768px) { .app-coord-combo input { font-size: 13px !important; } }
        .app-coord-combo > ul { background: var(--color-bg-base) !important; border: 1px solid var(--color-secondary) !important; border-top: none !important; border-radius: 0 !important; top: 100% !important; left: -155px !important; right: 0 !important; padding: 0 !important; box-shadow: none !important; }
        .app-coord-combo > ul li { border-radius: 0 !important; font-family: var(--font-mono) !important; font-size: 12px !important; padding: 9px 14px !important; border-bottom: 1px solid rgba(255,255,255,0.04) !important; }
        .app-coord-combo > ul li:last-child { border-bottom: none !important; }
        .app-field-note { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.11em; text-transform: uppercase; color: var(--color-text-tertiary); margin-top: 8px; }
        .app-freetext { font-size: 1rem; }
        @media (min-width: 768px) { .app-freetext { font-size: 13px !important; line-height: 1.85 !important; } }

        /* ── Depth strip ── */
        .app-depth-strip { border: 1px solid var(--color-border); max-width: 900px; }
        .app-tier { display: grid; grid-template-columns: 44px 150px 1fr auto; align-items: center; gap: 16px; width: 100%; padding: 16px 18px 16px 0; background: transparent; cursor: pointer; text-align: left; border: none; border-bottom: 1px solid rgba(255,255,255,0.05); position: relative; transition: background .14s; }
        .app-tier:last-child { border-bottom: none; }
        .app-tier:hover { background: var(--color-bg-elevated); }
        .app-tier.on { background: var(--color-bg-elevated); }

        @media (max-width: 960px) {
          .app-work { grid-template-columns: 1fr; }
          .app-work-l { padding: 32px 24px 56px; }
          .app-work-r { border-top: 1px solid var(--color-border); }
          .app-tier { grid-template-columns: 44px 1fr auto; }
          .app-tier > :nth-child(3) { display: none; }
        }
        @media (max-width: 480px) {
          .app-work-l { padding: 24px 16px 40px; }
          .app-tier { gap: 10px; padding: 14px 12px 14px 0; }
          .app-depth-strip { max-width: 100%; }
        }
      `}} />

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[480px] z-0" style={{ background: 'var(--bloom-app-bg)' }} />

      <main className="relative z-10 app-work" style={{ maxWidth: 1320, margin: '0 auto' }}>

        {/* ── LEFT — form ── */}
        <div className="app-work-l">

          <div style={{ padding: '56px 0 34px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-secondary)', marginBottom: 20 }}>
              <span style={{ width: 26, height: 1, background: 'var(--color-secondary)', display: 'block', flexShrink: 0 }} />
              Intake
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(44px, 5.6vw, 88px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.9, letterSpacing: '-0.01em', color: 'var(--color-text-primary)', marginBottom: 24 }}>Generate Brief</h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.95, color: 'var(--color-text-secondary)', maxWidth: 560, paddingLeft: '1.4em', borderLeft: '1px solid var(--color-secondary)' }}>
              Tell us your situation. We&apos;ll cross-check official sources, recent policy changes, and real traveler reports. One clear brief with every claim sourced.
            </p>
          </div>

          {/* Error states */}
          {error && !capReached && (
            error.includes("doesn't appear to be about visa") ? (
              <div style={{ border: '1px solid rgba(var(--color-secondary-rgb),0.3)', background: 'rgba(var(--color-secondary-rgb),0.06)', padding: 16, marginBottom: 24 }}>
                <div className="flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-secondary)', marginBottom: 6 }}>
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
            ) : wasCancelled ? (
              <div style={{ border: '1px solid var(--color-border)', borderLeft: '3px solid var(--color-amber)', background: 'var(--color-bg-elevated)', padding: 16, marginBottom: 24 }}>
                <div className="flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-amber)', marginBottom: 6 }}>
                  <Info size={16} aria-hidden="true" />
                  Payment Not Completed
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', lineHeight: 1.65, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
                  You left before completing payment. No charge was made and no brief was generated.
                </p>
                <button type="button" onClick={handleReset} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: 'var(--color-amber)', color: 'var(--color-bg-base)', border: '1px solid var(--color-amber)', padding: '8px 20px', cursor: 'pointer' }}>
                  Start Over
                </button>
              </div>
            ) : (
              <div style={{ border: '1px solid var(--color-error-border)', background: 'var(--color-error-bg)', padding: 16, marginBottom: 24 }}>
                <div className="flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-error)', marginBottom: 6 }}>
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

          {/* Auth Prompt */}
          {phase === 'auth-prompt' ? (
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', padding: 40, textAlign: 'center' }}>
              <Lock size={32} aria-hidden="true" style={{ color: 'var(--color-text-tertiary)', margin: '0 auto', display: 'block' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.5rem', lineHeight: 1.1, letterSpacing: '0.01em', textTransform: 'uppercase', color: 'var(--color-text-primary)', marginTop: 16 }}>
                Sign In to Generate
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--color-text-secondary)', marginTop: 8, marginBottom: 24 }}>
                Your brief is saved to your account so you can access it anytime.
              </p>
              <button
                type="button"
                onClick={() => {
                  try { sessionStorage.setItem('visascout_form_state', JSON.stringify({ nationality, destination, visaType, freeform, depth })); } catch { /* ignore */ }
                  router.push('/sign-in');
                }}
                style={{ width: '100%', background: 'var(--color-secondary)', color: 'var(--color-bg-base)', border: '1px solid var(--color-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', padding: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
          ) : (
            <form onSubmit={handleSubmit} noValidate>

              {/* Group 01 — Route */}
              <div className="app-grp">
                <div className="app-grp-head">
                  <span className="app-grp-n">01</span>
                  <span className="app-grp-t">Route</span>
                  <span className="app-grp-req">Required</span>
                </div>
                <div className="app-pair" style={{ marginBottom: 10 }}>
                  <div>
                    <div className={`app-coord-row${submitted && !nationality ? ' error' : ''}`}>
                      <div className="app-coord-pfx">Nationality <svg width="4" height="7" viewBox="0 0 5 8" fill="currentColor" aria-hidden="true" style={{ marginLeft: 5, flexShrink: 0 }}><path d="M0 0L5 4L0 8Z" /></svg></div>
                      <SearchableCombobox
                        className="app-coord-combo"
                        id="nationality"
                        options={NATIONALITIES}
                        value={nationality}
                        onChange={setNationality}
                        placeholder="Select…"
                        hasError={submitted && !nationality}
                      />
                    </div>
                    {submitted && !nationality && <FieldError />}
                  </div>
                  <div>
                    <div className={`app-coord-row${submitted && !destination ? ' error' : ''}`}>
                      <div className="app-coord-pfx">Destination <svg width="4" height="7" viewBox="0 0 5 8" fill="currentColor" aria-hidden="true" style={{ marginLeft: 5, flexShrink: 0 }}><path d="M0 0L5 4L0 8Z" /></svg></div>
                      <SearchableCombobox
                        className="app-coord-combo"
                        id="destination"
                        options={DESTINATIONS}
                        value={destination}
                        onChange={v => { setDestination(v); setVisaType(''); }}
                        placeholder="Select…"
                        hasError={submitted && !destination}
                      />
                    </div>
                    {submitted && !destination && <FieldError />}
                  </div>
                </div>
                <div className={`app-coord-row${!destination ? ' disabled' : ''}`} style={{ marginTop: 8 }}>
                  <div className="app-coord-pfx">Current Visa <svg width="4" height="7" viewBox="0 0 5 8" fill="currentColor" aria-hidden="true" style={{ marginLeft: 5, flexShrink: 0 }}><path d="M0 0L5 4L0 8Z" /></svg></div>
                  <SearchableCombobox
                    className="app-coord-combo"
                    id="visaType"
                    options={visaTypeOptions}
                    value={visaType}
                    onChange={setVisaType}
                    placeholder={destination ? 'Select visa type…' : 'Select destination first'}
                    disabled={!destination}
                  />
                </div>
                <p className="app-field-note">Current visa type is optional. Unlocks once a destination is set.</p>
              </div>

              {/* Group 02 — Situation */}
              <div className="app-grp">
                <div className="app-grp-head">
                  <span className="app-grp-n">02</span>
                  <span className="app-grp-t">Describe Your Situation</span>
                  <span className="app-grp-req">Required</span>
                </div>
                <div style={{ border: `1px solid ${submitted && !freeform ? 'var(--color-error)' : textareaFocused ? 'var(--color-secondary)' : 'var(--color-border)'}`, transition: 'border-color 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-base)', padding: '0 14px', height: 30, borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-secondary)' }}>Free Text · Normalized on Submit</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: freeform.length > 1800 ? 'var(--color-secondary)' : 'var(--color-text-tertiary)' }}>{freeform.length} / 2000</span>
                  </div>
                  <textarea
                    id="freeform"
                    className="app-freetext"
                    value={freeform}
                    onChange={e => setFreeform(e.target.value)}
                    onFocus={() => setTextareaFocused(true)}
                    onBlur={() => setTextareaFocused(false)}
                    rows={5}
                    maxLength={2000}
                    aria-invalid={submitted && !freeform ? true : undefined}
                    aria-required="true"
                    placeholder="I'm arriving in Portugal in two weeks and planning to stay 90 days. I'm a freelance developer and considering a border run to Morocco if I need to extend my stay."
                    style={{
                      display: 'block', width: '100%', minHeight: 132, resize: 'vertical',
                      background: 'var(--color-bg-elevated)', border: 'none',
                      padding: '16px 14px', fontFamily: 'var(--font-mono)',
                      fontSize: '1rem', lineHeight: 1.85,
                      color: 'var(--color-text-primary)', outline: 'none',
                      touchAction: 'manipulation',
                    }}
                  />
                </div>
                {submitted && !freeform && <FieldError />}
              </div>

              {/* Group 03 — Depth */}
              <div className="app-grp">
                <div className="app-grp-head">
                  <span className="app-grp-n">03</span>
                  <span className="app-grp-t">Research Depth</span>
                  <span className="app-grp-req">Required</span>
                </div>
                <div className="app-depth-strip">
                  {BRIEF_DEPTHS.map((d, i) => {
                    const cfg = DEPTH_CONFIG[d];
                    const selected = depth === d;
                    const isLast = i === BRIEF_DEPTHS.length - 1;
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setDepth(d)}
                        className={`app-tier${selected ? ' on' : ''}`}
                        style={{
                          borderLeft: `3px solid ${selected ? cfg.color : 'transparent'}`,
                          borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                          borderTop: 'none', borderRight: 'none',
                        }}
                      >
                        {/* Checkbox */}
                        <div style={{ display: 'grid', placeItems: 'center' }}>
                          <div style={{ width: 10, height: 10, border: `1px solid ${selected ? cfg.color : 'var(--color-border-strong)'}`, background: selected ? cfg.color : 'transparent' }} />
                        </div>
                        {/* Name */}
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, textTransform: 'uppercase', lineHeight: 1, color: selected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                          {cfg.label}
                        </div>
                        {/* Description */}
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: selected ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)', minWidth: 0 }}>
                          {cfg.description}
                        </div>
                        {/* Price */}
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: selected ? cfg.color : 'var(--color-text-tertiary)', minWidth: 62, textAlign: 'right' }}>
                          {cfg.price}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cap reached / submit CTA */}
              {capReached ? (
                <div style={{ border: '1px solid rgba(var(--color-secondary-rgb),0.3)', background: 'rgba(var(--color-secondary-rgb),0.06)', padding: 20 }}>
                  <div className="flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-secondary)', marginBottom: 6 }}>
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
                        onChange={e => { setInviteCode(e.target.value); setInviteCodeError(null); setInviteErrorType(null); }}
                        placeholder="VS-XXXX-XXXX"
                        aria-label="Invite code"
                        className="app-freetext"
                        style={{ flex: 1, minWidth: 0, background: 'var(--color-bg-base)', border: '1px solid var(--color-border-strong)', padding: '7px 12px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', outline: 'none' }}
                      />
                      <button type="button" onClick={() => setShowInviteInput(true)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-strong)', padding: '6px 14px', cursor: 'pointer' }}>Apply</button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: 900, paddingTop: 34 }}>
                  <button
                    type="submit"
                    disabled={phase === 'redirecting' || isCheckingCap}
                    style={{
                      width: '100%', border: 'none', cursor: phase === 'redirecting' || isCheckingCap ? 'not-allowed' : 'pointer',
                      opacity: phase === 'redirecting' || isCheckingCap ? 0.65 : 1,
                      background: depthCfg.color,
                      color: 'var(--color-neutral)',
                      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                      letterSpacing: '0.04em', textTransform: 'uppercase', padding: 19,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {isCheckingCap || phase === 'redirecting'
                      ? 'Generating…'
                      : !isSignedIn
                          ? 'Sign In to Generate'
                          : depth === 'quick' || inviteAccess
                            ? 'Generate Brief · Free'
                            : depth === 'standard'
                              ? `Generate Brief · $${(PRICES.standard.amount / 100).toFixed(2)}`
                              : `Generate Brief · $${(PRICES.deep.amount / 100).toFixed(2)}`}
                  </button>

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
                          className="w-full flex items-center justify-center gap-1 uppercase"
                          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', fontWeight: 400, letterSpacing: '0.04em', color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
                        >
                          Have an invite code?
                          <svg width="7" height="4" viewBox="0 0 8 5" fill="currentColor" aria-hidden="true" style={{ transform: showInviteInput ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}><path d="M0 0L8 0L4 5Z" /></svg>
                        </button>
                        {showInviteInput && (
                          <div style={{ marginTop: 8 }}>
                            <input
                              type="text"
                              value={inviteCode}
                              onChange={e => { setInviteCode(e.target.value); setInviteCodeError(null); setInviteErrorType(null); }}
                              placeholder="Enter invite code"
                              onFocus={() => setInviteInputFocused(true)}
                              onBlur={() => setInviteInputFocused(false)}
                              className="app-freetext"
                              style={{
                                ...INPUT_STYLE,
                                fontFamily: 'var(--font-mono)',
                                border: `1px solid ${inviteCodeError ? 'var(--color-error)' : inviteInputFocused ? 'var(--color-secondary)' : 'var(--color-border-strong)'}`,
                                boxShadow: inviteInputFocused && !inviteCodeError ? '0 0 0 3px rgba(var(--color-secondary-rgb),0.18)' : 'none',
                              }}
                            />
                            {inviteErrorType === 'invalid' && (
                              <div style={{ marginTop: 8, border: '1px solid rgba(200,120,10,0.3)', background: 'rgba(200,120,10,0.06)', padding: '12px 14px' }}>
                                <div className="flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-secondary)', marginBottom: 6 }}>
                                  <AlertTriangle size={14} aria-hidden="true" />
                                  Invalid Invite Code
                                </div>
                                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.65, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
                                  That code wasn't recognized. Check for typos and try again.
                                </p>
                                <button type="button" onClick={() => { setInviteCode(''); setInviteCodeError(null); setInviteErrorType(null); }}
                                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'transparent', color: 'var(--color-secondary)', border: '1px solid var(--color-secondary)', padding: '5px 12px', cursor: 'pointer' }}>
                                  Try a Different Code
                                </button>
                              </div>
                            )}
                            {inviteErrorType === 'already-used' && (
                              <div style={{ marginTop: 8, border: '1px solid var(--color-error-border)', background: 'var(--color-error-bg)', padding: '12px 14px' }}>
                                <div className="flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-error)', marginBottom: 6 }}>
                                  <XCircle size={14} aria-hidden="true" />
                                  Code Already Used
                                </div>
                                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: 1.65, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
                                  This invite code has already been redeemed. Contact support if you think this is a mistake.
                                </p>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                                  <a href="/contact" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'transparent', color: 'var(--color-error)', border: '1px solid var(--color-error-border)', padding: '5px 12px', textDecoration: 'none', cursor: 'pointer' }}>
                                    Contact Support
                                  </a>
                                  <button type="button" onClick={() => { setInviteCode(''); setInviteCodeError(null); setInviteErrorType(null); setShowInviteInput(false); }}
                                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-strong)', padding: '5px 12px', cursor: 'pointer' }}>
                                    Continue Without Code
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null
                  )}

                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-tertiary)', lineHeight: 1.65, textAlign: 'left' }}>
                    For informational purposes only. <a href="/terms" style={{ color: 'var(--color-text-tertiary)', textDecoration: 'underline' }}>See terms.</a>
                  </p>
                </div>
              )}
            </form>
          )}
        </div>

        {/* ── RIGHT — instrument rail ── */}
        <aside className="app-work-r">
          <div className="app-panel-panels">

            {/* Panel 01 — Route */}
            <div className="app-rp">
              <div className="app-rp-h">
                Route<i></i><span className="app-rp-ct">{routeCompleted}/4 Set</span>
              </div>
              <div className="app-rp-b">
                <div className="app-bfield vs-row">
                  <div className="app-bkey">Passport</div>
                  <div className={`app-bval${nationality ? '' : ' pending'}`}>{nationality || 'Not set'}</div>
                </div>
                <div className="app-bfield vs-row">
                  <div className="app-bkey">Destination</div>
                  <div className={`app-bval${destination ? '' : ' pending'}`}>{destination || 'Not set'}</div>
                </div>
                <div className="app-bfield vs-row">
                  <div className="app-bkey">Status</div>
                  <div className={`app-bval${visaType ? '' : ' pending'}`}>{visaType || 'Unspecified'}</div>
                </div>
                <div className="app-bfield vs-row">
                  <div className="app-bkey">Depth</div>
                  <div className="app-bval hi">{depthCfg.label} &middot; {depthCfg.price}</div>
                </div>
              </div>
              <div className="app-panel-foot">
                <span className="app-sq" />{readyToDispatch ? 'Ready to Dispatch' : 'Awaiting Dispatch'}
              </div>
            </div>

            {/* Panel 02 — Agents Queued */}
            <div className="app-rp">
              <div className="app-rp-h">
                Agents Queued<i></i><span className="app-rp-ct">5 Parallel</span>
              </div>
              <div className="app-rp-b">
                {RAIL_AGENTS.map(a => (
                  <div key={a.name} className="app-agent-row">
                    <span>{a.name}<span className="app-tier-chip">{a.tier}</span></span>
                    <span className="app-agent-st">Queued</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 03 — Dispatch Parameters */}
            <div className="app-rp">
              <div className="app-rp-h">
                Dispatch Parameters<i></i><span className="app-rp-ct">{depthCfg.label}</span>
              </div>
              <div className="app-metrics">
                <div className="app-m-cell"><div className="app-m-k">Agents</div><div className="app-m-v">5</div></div>
                <div className="app-m-cell"><div className="app-m-k">Sources / Agent</div><div className="app-m-v">{railDepth.src}</div></div>
                <div className="app-m-cell"><div className="app-m-k">Est. Time</div><div className="app-m-v">{railDepth.time}</div></div>
                <div className="app-m-cell"><div className="app-m-k">Sources Total</div><div className="app-m-v">{railDepth.sources}</div></div>
              </div>
            </div>

            {/* Panel 04 — Brief Outline */}
            <div className="app-rp">
              <div className="app-rp-h">
                Brief Outline<i></i><span className="app-rp-ct">01&ndash;09</span>
              </div>
              <div className="app-rp-b">
                <ul className="app-outline">
                  {BRIEF_SECTIONS.map((s, i) => (
                    <li key={s}><span className="n">{String(i + 1).padStart(2, '0')}</span>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
          <div className="app-panel-foot">Preview only. Nothing has been dispatched yet.</div>
        </aside>

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
