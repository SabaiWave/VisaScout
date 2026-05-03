'use client';

import { useState } from 'react';
import BriefRenderer from './components/BriefRenderer';
import type { VisaBrief, ConflictReport, VisaRequest } from '@/src/types/index';
import { clientConfig } from '@/config/client';

// ─── Static data ───────────────────────────────────────────────────────────

const DESTINATIONS = clientConfig.supportedDestinations;

const VISA_TYPES: Record<string, string[]> = {
  Thailand: ['Visa Exemption', 'Tourist Visa (TR)', 'Thailand Elite Visa', 'Non-Immigrant Visa', 'Long-Term Resident (LTR) Visa', 'Education Visa'],
  Vietnam: ['E-Visa', 'Visa on Arrival', 'Tourist Visa', 'Business Visa', 'Temporary Residence Card', 'Work Permit'],
  Indonesia: ['Visa on Arrival', 'Social/Cultural Visa (B211)', 'Business Visa', 'KITAS (Limited Stay Permit)', 'Retirement Visa', 'Digital Nomad Visa'],
  Malaysia: ['Visa Free Entry', 'eNTRI', 'Social Visit Pass', 'MM2H (Long-Term Residency)', 'Employment Pass', 'Business Visa'],
  Philippines: ['Visa Free', 'Tourist Visa', 'Special Resident Retiree\'s Visa (SRRV)', 'Business Visa', '13A Permanent Resident'],
  Cambodia: ['Visa on Arrival', 'e-Visa', 'Tourist Visa (T)', 'Business Visa (E)', 'Ordinary Visa (EG)', 'Retirement Visa'],
  Laos: ['Visa on Arrival', 'e-Visa', 'Tourist Visa', 'Business Visa', 'Multiple Entry Visa'],
  Myanmar: ['e-Visa', 'Visa on Arrival', 'Tourist Visa', 'Business Visa', 'Social Visa'],
  Singapore: ['Visa Free', 'Social Visit Pass', 'Employment Pass', 'Dependant\'s Pass', 'Long-Term Visit Pass'],
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

type Phase = 'idle' | 'generating' | 'complete' | 'error';

const AGENT_DISPLAY: Record<string, string> = {
  officialPolicy:    'Official Policy',
  recentChanges:     'Recent Changes',
  communityIntel:    'Community Intel',
  entryRequirements: 'Entry Requirements',
  borderRun:         'Border Run',
};

// ─── Sub-components ────────────────────────────────────────────────────────

function AgentRow({ entry }: { entry: AgentStatusEntry }) {
  const statusStyle = {
    running:  'border-[#2d5282] bg-[#f0f4f9]',
    complete: 'border-gray-200 bg-white',
    failed:   'border-red-200 bg-red-50',
  };
  const icon = { running: '⟳', complete: '✓', failed: '✕' };
  const iconStyle = { running: 'text-[#1e3a5f] animate-spin', complete: 'text-green-600', failed: 'text-red-500' };
  const confidenceColors: Record<string, string> = { high: 'bg-green-100 text-green-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-red-100 text-red-700' };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border mb-1.5 transition-all ${statusStyle[entry.status]}`}
         style={{ animation: entry.status === 'running' ? 'pulse-ring 1.5s ease infinite' : undefined }}>
      <span className={`text-base ${iconStyle[entry.status]}`}>{icon[entry.status]}</span>
      <span className="text-sm font-semibold text-gray-900 flex-1">
        {AGENT_DISPLAY[entry.agent] ?? entry.agent}
      </span>
      {entry.status === 'running' && <span className="text-xs text-[#1e3a5f]">analyzing…</span>}
      {entry.status === 'complete' && entry.confidence && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${confidenceColors[entry.confidence] ?? ''}`}>
          {entry.confidence}
        </span>
      )}
      {entry.status === 'complete' && entry.sourceTier && (
        <span className={`font-mono text-xs px-2 py-0.5 rounded ${entry.sourceTier === 1 ? 'bg-[#e8eef5] text-[#1e3a5f] font-medium' : 'bg-gray-100 text-gray-500'}`}>
          T{entry.sourceTier}
        </span>
      )}
      {entry.status === 'complete' && entry.durationMs !== undefined && (
        <span className="font-mono text-xs text-gray-400">{entry.durationMs}ms</span>
      )}
      {entry.status === 'failed' && <span className="text-xs text-red-500">failed</span>}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function Home() {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPhase('generating');
    setAgentStatuses([]);
    setParsedSituation(null);
    setBrief(null);
    setBriefId(null);
    setCopied(false);
    setError(null);

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

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-[1120px] mx-auto flex items-center justify-between">
          <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}>
            VisaScout
          </span>
          <span className="text-xs text-gray-400">{clientConfig.tagline}</span>
        </div>
      </nav>

      <main className="max-w-[1120px] mx-auto px-6 py-12">
        {/* ── Section 1: Input Form ── */}
        {(phase === 'idle' || phase === 'error') && (
          <div className="max-w-[560px] mx-auto">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}>
              Generate your visa brief
            </h1>
            <p className="text-gray-500 mb-8 text-sm">
              Official sources. Contradictions flagged. Confidence scored.
            </p>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nationality */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="nationality">
                  Your Nationality
                </label>
                <select
                  id="nationality"
                  value={nationality}
                  onChange={e => setNationality(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10"
                >
                  <option value="">Select nationality…</option>
                  {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="destination">
                  Destination
                </label>
                <select
                  id="destination"
                  value={destination}
                  onChange={e => { setDestination(e.target.value); setVisaType(''); }}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10"
                >
                  <option value="">Select destination…</option>
                  {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Visa Type — optional */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="visaType">
                  Current Visa Type
                  <span className="ml-1.5 text-xs font-normal text-gray-400">optional</span>
                </label>
                <select
                  id="visaType"
                  value={visaType}
                  onChange={e => setVisaType(e.target.value)}
                  disabled={!destination}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10 disabled:opacity-50"
                >
                  <option value="">{destination ? 'Select visa type…' : 'Select destination first'}</option>
                  {visaTypeOptions.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              {/* Freeform */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="freeform">
                  Describe your situation
                </label>
                <textarea
                  id="freeform"
                  value={freeform}
                  onChange={e => setFreeform(e.target.value)}
                  required
                  rows={4}
                  maxLength={2000}
                  placeholder="e.g. Arriving March 15, staying 28 days, planning one border run to Malaysia, work remotely for US company."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10 resize-vertical leading-relaxed"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{freeform.length}/2000</p>
              </div>

              {/* Depth selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Research Depth</label>
                <div className="flex bg-gray-100 rounded-full p-1 gap-1">
                  {(['quick', 'standard', 'deep'] as const).map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDepth(d)}
                      className={`flex-1 py-1.5 text-sm rounded-full font-medium transition-all ${
                        depth === d
                          ? 'bg-[#1e3a5f] text-white font-semibold shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {depth === 'quick' && 'Fast results · 3 sources per agent'}
                  {depth === 'standard' && 'Balanced · 5 sources per agent'}
                  {depth === 'deep' && 'Thorough · 8 sources per agent · slower'}
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 rounded-lg font-semibold text-white text-base transition-colors"
                style={{ background: 'var(--color-navy)' }}
              >
                Generate Brief
              </button>
            </form>
          </div>
        )}

        {/* ── Section 2: Parsed Confirmation ── */}
        {parsedSituation && (phase === 'generating' || phase === 'complete') && (
          <div className="max-w-[760px] mx-auto mb-6">
            <div className="bg-[#f0f4f9] border border-[#c3d3e8] rounded-lg px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f] mb-1">We understood</p>
              <p className="text-sm text-gray-700 leading-relaxed">{parsedSituation.parsedSummary}</p>
            </div>
          </div>
        )}

        {/* ── Section 3: Agent Progress + Output ── */}
        {(phase === 'generating' || phase === 'complete') && (
          <div className="max-w-[760px] mx-auto">
            {/* Agent progress */}
            {agentStatuses.length > 0 && (
              <div className="mb-8">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Agent Status</p>
                  {agentStatuses.map(entry => (
                    <AgentRow key={entry.agent} entry={entry} />
                  ))}
                  {isGenerating && agentStatuses.every(a => a.status !== 'running') && agentStatuses.length === 5 && (
                    <p className="text-xs text-gray-400 mt-2 text-center">Resolving conflicts and synthesizing brief…</p>
                  )}
                </div>
              </div>
            )}

            {/* Generating spinner (before agents start) */}
            {isGenerating && agentStatuses.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">
                <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-[#1e3a5f] rounded-full animate-spin mb-3" />
                <p>Parsing your situation…</p>
              </div>
            )}

            {/* Brief output */}
            {brief && (
              <div>
                <BriefRenderer brief={brief} />

                {/* Shareable link (only shown when persisted) */}
                {briefId && (
                  <div className="mt-6 bg-[#f0f4f9] border border-[#c3d3e8] rounded-lg px-4 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f] mb-0.5">Shareable link</p>
                      <p className="text-sm text-gray-600 font-mono truncate">{`/brief/${briefId}`}</p>
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold border border-[#1e3a5f] text-[#1e3a5f] hover:bg-white transition-colors"
                    >
                      {copied ? '✓ Copied' : 'Copy link'}
                    </button>
                  </div>
                )}

                <div className="flex gap-3 mt-4 max-w-[760px] mx-auto">
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-[#1e3a5f] text-[#1e3a5f] hover:bg-gray-50 transition-colors"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    New Brief
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
