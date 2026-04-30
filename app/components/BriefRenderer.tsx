'use client';

import type { VisaBrief, VisaOption, ConflictReport } from '@/src/types/index';
import { useState } from 'react';

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high:   'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    low:    'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[level]}`}>
      {level.toUpperCase()}
    </span>
  );
}

function TierLabel({ tier }: { tier: 1 | 2 | 3 | 4 }) {
  const isTop = tier <= 1;
  return (
    <span
      className={`font-mono text-xs px-2 py-0.5 rounded ${
        isTop ? 'bg-[#e8eef5] text-[#1e3a5f] font-medium' : 'bg-gray-100 text-gray-500'
      }`}
    >
      Tier {tier}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-xl font-bold mb-4 pb-3 border-b border-gray-200"
      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}
    >
      {children}
    </h3>
  );
}

function VisaOptionCard({ option }: { option: VisaOption }) {
  const suitabilityStyle = {
    best:       'border-green-400 bg-green-50',
    good:       'border-blue-300 bg-blue-50',
    acceptable: 'border-gray-300 bg-gray-50',
  };
  return (
    <div className={`rounded-lg border-l-4 p-4 mb-3 ${suitabilityStyle[option.suitability]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-gray-900">{option.name}</span>
        <span className="text-xs text-gray-500 font-mono">Max stay: {option.maxStay}</span>
      </div>
      <p className="text-sm text-gray-700 mb-2">{option.summary}</p>
      {option.pros.length > 0 && (
        <ul className="text-xs text-green-700 mb-1">
          {option.pros.map((p, i) => <li key={i}>+ {p}</li>)}
        </ul>
      )}
      {option.cons.length > 0 && (
        <ul className="text-xs text-red-600">
          {option.cons.map((c, i) => <li key={i}>− {c}</li>)}
        </ul>
      )}
    </div>
  );
}

function ConflictSection({ report }: { report: ConflictReport }) {
  const [open, setOpen] = useState(false);
  const total = report.confirmed.length + report.contested.length + report.unverified.length;
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="font-semibold text-gray-700 text-sm">
          Conflict Report — {total} item{total !== 1 ? 's' : ''}
          {report.contested.length > 0 && (
            <span className="ml-2 text-amber-600">({report.contested.length} contested)</span>
          )}
        </span>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-5 py-4 space-y-4">
          {report.confirmed.length > 0 && (
            <div>
              <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">Confirmed</p>
              {report.confirmed.map((item, i) => (
                <div key={i} className="mb-2 text-sm">
                  <span className="font-medium text-gray-900">{item.topic}</span>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          )}
          {report.contested.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Contested</p>
              {report.contested.map((item, i) => (
                <div key={i} className="mb-2 text-sm border-l-2 border-amber-400 pl-3">
                  <span className="font-medium text-gray-900">{item.topic}</span>
                  <p className="text-gray-600">{item.description}</p>
                  {item.resolution && <p className="text-amber-700 text-xs mt-1">Resolution: {item.resolution}</p>}
                </div>
              ))}
            </div>
          )}
          {report.unverified.length > 0 && (
            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">Unverified</p>
              {report.unverified.map((item, i) => (
                <div key={i} className="mb-2 text-sm">
                  <span className="font-medium text-gray-900">{item.topic}</span>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BriefRenderer({ brief }: { brief: VisaBrief }) {
  const [contingencyOpen, setContingencyOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-[760px] mx-auto">
      {/* Disclaimer — always visible */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 flex items-start gap-3 text-sm text-amber-900">
        <span className="flex-shrink-0 mt-0.5">⚠</span>
        <span>{brief.disclaimer}</span>
      </div>

      {/* Recommended Action */}
      <div className="border-l-4 border-amber-400 bg-amber-50 rounded-r-lg px-5 py-4">
        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Recommended Action</p>
        <p className="text-lg font-bold text-gray-900 mb-1">{brief.recommendedAction.action}</p>
        {brief.recommendedAction.deadline && (
          <p className="text-sm font-semibold text-red-600">Deadline: {brief.recommendedAction.deadline}</p>
        )}
        <p className="text-sm text-gray-700 mt-2">{brief.recommendedAction.rationale}</p>
        <div className="mt-2">
          <ConfidenceBadge level={brief.confidenceScore.overall} />
          <span className="ml-2 text-xs text-gray-500">overall confidence</span>
        </div>
      </div>

      {/* Parsed Situation */}
      <div className="brief-section bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <SectionHeading>Parsed Situation</SectionHeading>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{brief.parsedSituation}</p>
      </div>

      {/* Visa Options */}
      <div className="brief-section bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <SectionHeading>Visa Options</SectionHeading>
        {brief.visaOptions.map((opt, i) => <VisaOptionCard key={i} option={opt} />)}
      </div>

      {/* Entry Requirements */}
      <div className="brief-section bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <SectionHeading>Entry Requirements</SectionHeading>
        {brief.entryRequirements.documents.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Required Documents</p>
            <ul className="text-sm text-gray-700 space-y-1">
              {brief.entryRequirements.documents.map((d, i) => <li key={i}>• {d}</li>)}
            </ul>
          </div>
        )}
        {brief.entryRequirements.proofOfFunds && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Proof of Funds</p>
            <p className="text-sm text-gray-700">{brief.entryRequirements.proofOfFunds}</p>
          </div>
        )}
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Onward Ticket</p>
          <p className="text-sm text-gray-700">{brief.entryRequirements.onwardTicket ? 'Required' : 'Not required'}</p>
        </div>
        {brief.entryRequirements.notes.length > 0 && (
          <ul className="text-xs text-gray-500 space-y-1">
            {brief.entryRequirements.notes.map((n, i) => <li key={i}>• {n}</li>)}
          </ul>
        )}
      </div>

      {/* Border Run Analysis */}
      <div className="brief-section bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <SectionHeading>Border Run Analysis</SectionHeading>
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Eligible</p>
            <p className="text-gray-700">{brief.borderRunAnalysis.eligible ? 'Yes' : 'No'}</p>
          </div>
          {brief.borderRunAnalysis.limitsPerYear && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Annual Limit</p>
              <p className="text-gray-700">{brief.borderRunAnalysis.limitsPerYear}</p>
            </div>
          )}
        </div>
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Enforcement Posture</p>
          <p className="text-sm text-gray-700">{brief.borderRunAnalysis.enforcementPosture}</p>
        </div>
        {brief.borderRunAnalysis.warnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {brief.borderRunAnalysis.warnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-800">⚠ {w}</p>
            ))}
          </div>
        )}
      </div>

      {/* Recent Changes */}
      {brief.recentChanges.hasChanges && (
        <div className="brief-section bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <SectionHeading>Recent Changes & Watch Items</SectionHeading>
          <ul className="text-sm text-gray-700 space-y-2 mb-4">
            {brief.recentChanges.items.map((item, i) => <li key={i}>• {item}</li>)}
          </ul>
          {brief.recentChanges.watchItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Watch Items</p>
              {brief.recentChanges.watchItems.map((w, i) => (
                <p key={i} className="text-xs text-amber-800">⚠ {w}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Source Citations */}
      {brief.confidenceScore.sourceCitations.length > 0 && (
        <div className="brief-section bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <SectionHeading>Source Citations</SectionHeading>
          <ul className="space-y-2">
            {brief.confidenceScore.sourceCitations.map((cite, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <TierLabel tier={cite.tier} />
                <div>
                  <p className="text-gray-700">{cite.claim}</p>
                  <a
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-blue-600 hover:underline break-all"
                  >
                    {cite.url}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conflict Report */}
      <div className="brief-section">
        <ConflictSection report={brief.conflictReport} />
      </div>

      {/* Contingency — collapsible */}
      <div className="brief-section border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setContingencyOpen(!contingencyOpen)}
          className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <span className="font-semibold text-gray-700 text-sm">Contingency Planning</span>
          <span className="text-gray-400 text-sm">{contingencyOpen ? '▲' : '▼'}</span>
        </button>
        {contingencyOpen && (
          <div className="px-5 py-4 space-y-4 text-sm">
            {brief.contingency.deniedEntrySteps.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">If Denied Entry</p>
                <ul className="text-gray-700 space-y-1">
                  {brief.contingency.deniedEntrySteps.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Overstay Scenario</p>
              <p className="text-gray-700">{brief.contingency.overstayScenario}</p>
            </div>
            {brief.contingency.emergencyContacts.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Emergency Contacts</p>
                <ul className="text-gray-700 space-y-1">
                  {brief.contingency.emergencyContacts.map((c, i) => <li key={i}>• {c}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="text-xs text-gray-400 font-mono text-center pb-4">
        Generated {new Date(brief.metadata.generatedAt).toLocaleString()} · {brief.metadata.model} · {brief.metadata.depth} depth
        {brief.metadata.degraded && <span className="ml-2 text-amber-600">· degraded output</span>}
      </div>
    </div>
  );
}
