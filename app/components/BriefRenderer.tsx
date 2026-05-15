'use client';

import type { VisaBrief, VisaOption, ConflictReport } from '@/src/types/index';
import { useState } from 'react';

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high:   { background: 'rgba(34,197,94,0.15)',  color: '#22c55e' },
    medium: { background: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    low:    { background: 'rgba(239,68,68,0.15)',  color: '#ef4444' },
  };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold tracking-wider"
      style={{ ...styles[level], fontFamily: 'var(--font-mono)' }}
    >
      {level.toUpperCase()}
    </span>
  );
}

function TierLabel({ tier }: { tier: 1 | 2 | 3 | 4 }) {
  const isTop = tier <= 1;
  return (
    <span
      className="font-mono text-xs px-2 py-0.5 rounded flex-shrink-0"
      style={{
        background: isTop ? 'var(--color-secondary-subtle)' : 'var(--color-bg-overlay)',
        color: isTop ? 'var(--color-secondary-light)' : 'var(--color-text-tertiary)',
        fontWeight: isTop ? 600 : 400,
      }}
    >
      Tier {tier}
    </span>
  );
}

function Label({ children, color, size = 'xs' }: { children: React.ReactNode; color?: string; size?: 'xs' | 'xl' }) {
  return (
    <p
      className={`text-${size} font-bold uppercase tracking-wider mb-1`}
      style={{ color: color ?? 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}
    >
      {children}
    </p>
  );
}

function WarningBox({ header, items, headerSize = 'xs' }: { header: string; items: string[]; headerSize?: 'xs' | 'xl' }) {
  return (
    <div className="rounded-lg px-4 py-3 border space-y-2" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)', boxShadow: '0 0 16px rgba(245,158,11,0.06)' }}>
      <Label color="#f59e0b" size={headerSize}>{header}</Label>
      {items.map((w, i) => (
        <p key={i} className="text-sm flex items-start gap-2" style={{ color: '#f59e0b' }}>
          <span className="flex-shrink-0">⚠</span><span>{w}</span>
        </p>
      ))}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h3
        className="text-xl font-bold mb-3"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}
      >
        <span style={{ color: 'var(--color-secondary)', marginRight: '0.4rem' }}>//</span>
        {children}
      </h3>
      <div className="mb-4 h-px" style={{ background: 'linear-gradient(to right, rgba(99,102,241,0.5), transparent)' }} />
    </>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="brief-section rounded-xl p-6 border"
      style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', boxShadow: '0 0 20px rgba(99,102,241,0.05)' }}
    >
      {children}
    </div>
  );
}

function VisaOptionCard({ option }: { option: VisaOption }) {
  const borderColor = {
    best:       '#22c55e',
    good:       'var(--color-secondary)',
    acceptable: 'var(--color-border-strong)',
  }[option.suitability];
  const bg = {
    best:       'rgba(34,197,94,0.06)',
    good:       'rgba(99,102,241,0.06)',
    acceptable: 'var(--color-bg-base)',
  }[option.suitability];

  return (
    <div
      className="rounded-lg border-l-4 p-4 mb-3"
      style={{ background: bg, borderTop: `1px solid var(--color-border)`, borderRight: `1px solid var(--color-border)`, borderBottom: `1px solid var(--color-border)`, borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{option.name}</span>
        <span className="text-xs font-mono" style={{ color: 'var(--color-text-tertiary)' }}>Max stay: {option.maxStay}</span>
      </div>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>{option.summary}</p>
      {(option.pros.length > 0 || option.cons.length > 0) && (
        <ul className="text-sm space-y-1.5 mt-2">
          {option.pros.map((p, i) => (
            <li key={`pro-${i}`} className="flex items-start gap-2">
              <span
                className="flex-shrink-0 text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontFamily: 'var(--font-mono)' }}
              >Pro</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{p}</span>
            </li>
          ))}
          {option.cons.map((c, i) => (
            <li key={`con-${i}`} className="flex items-start gap-2">
              <span
                className="flex-shrink-0 text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontFamily: 'var(--font-mono)' }}
              >Con</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{c}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConflictSection({ report, forPrint = false }: { report: ConflictReport; forPrint?: boolean }) {
  const [open, setOpen] = useState(false);
  const showContent = forPrint || open;
  const total = report.confirmed.length + report.contested.length + report.unverified.length;
  return (
    <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 transition-colors text-left"
        style={{ background: 'var(--color-bg-elevated)' }}
      >
        <span className="font-bold text-xl" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
          <span style={{ color: 'var(--color-secondary)', marginRight: '0.4rem' }}>//</span>Conflict Report — {total} item{total !== 1 ? 's' : ''}
          {report.contested.length > 0 && (
            <span className="ml-2 text-sm" style={{ color: 'var(--color-amber)' }}>({report.contested.length} contested)</span>
          )}
        </span>
        <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {showContent && (
        <div className="px-5 py-4 space-y-4" style={{ background: 'var(--color-bg-base)' }}>
          {report.confirmed.length > 0 && (
            <div>
              <Label color="#22c55e">Confirmed</Label>
              {report.confirmed.map((item, i) => (
                <div key={i} className="mb-2 text-sm">
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.topic}</span>
                  <p style={{ color: 'var(--color-text-secondary)' }}>{item.description}</p>
                </div>
              ))}
            </div>
          )}
          {report.contested.length > 0 && (
            <div>
              <Label color="#f59e0b">Contested</Label>
              {report.contested.map((item, i) => (
                <div key={i} className="mb-2 text-sm border-l-2 pl-3" style={{ borderColor: '#f59e0b' }}>
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.topic}</span>
                  <p style={{ color: 'var(--color-text-secondary)' }}>{item.description}</p>
                  {item.resolution && (
                    <div className="mt-2">
                      <Label color="#f59e0b">Resolution</Label>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{item.resolution}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {report.unverified.length > 0 && (
            <div>
              <Label color="#ef4444">Unverified</Label>
              {report.unverified.map((item, i) => (
                <div key={i} className="mb-2 text-sm">
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.topic}</span>
                  <p style={{ color: 'var(--color-text-secondary)' }}>{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BriefRenderer({ brief, forPrint = false }: { brief: VisaBrief; forPrint?: boolean }) {
  const [contingencyOpen, setContingencyOpen] = useState(false);
  const showContingency = forPrint || contingencyOpen;

  return (
    <div className="space-y-6 max-w-[760px] mx-auto">
      {/* Recommended Action */}
      <div
        className="border-l-4 rounded-r-lg px-5 py-4"
        style={{
          background: 'rgba(245,158,11,0.06)',
          borderTop: '1px solid rgba(245,158,11,0.2)',
          borderRight: '1px solid rgba(245,158,11,0.2)',
          borderBottom: '1px solid rgba(245,158,11,0.2)',
          borderLeft: '4px solid var(--color-amber)',
          boxShadow: '0 0 20px rgba(245,158,11,0.08)',
        }}
      >
        <Label color="var(--color-amber)" size="xl">Recommended Action</Label>
        <p className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{brief.recommendedAction.action}</p>
        {brief.recommendedAction.deadline && (
          <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>Deadline: {brief.recommendedAction.deadline}</p>
        )}
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>{brief.recommendedAction.rationale}</p>
        <div className="mt-2">
          <ConfidenceBadge level={brief.confidenceScore.overall} />
          <span className="ml-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>Overall Confidence</span>
        </div>
      </div>

      {/* Visa Options */}
      <SectionCard>
        <SectionHeading>Visa Options</SectionHeading>
        {brief.visaOptions.map((opt, i) => <VisaOptionCard key={i} option={opt} />)}
      </SectionCard>

      {/* Entry Requirements */}
      <SectionCard>
        <SectionHeading>Entry Requirements</SectionHeading>
        {brief.entryRequirements.documents.length > 0 && (
          <div className="mb-3">
            <Label>Required Documents</Label>
            <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
              {brief.entryRequirements.documents.map((d, i) => <li key={i}>• {d}</li>)}
            </ul>
          </div>
        )}
        {brief.entryRequirements.proofOfFunds && (
          <div className="mb-3">
            <Label>Proof of Funds</Label>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{brief.entryRequirements.proofOfFunds}</p>
          </div>
        )}
        <div className="mb-3">
          <Label>Onward Ticket</Label>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{brief.entryRequirements.onwardTicket ? 'Required' : 'Not required'}</p>
        </div>
        {brief.entryRequirements.notes.length > 0 && (
          <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
            {brief.entryRequirements.notes.map((n, i) => <li key={i}>• {n}</li>)}
          </ul>
        )}
      </SectionCard>

      {/* Border Run Analysis */}
      <SectionCard>
        <SectionHeading>Border Run Analysis</SectionHeading>
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <Label>Eligible</Label>
            <p style={{ color: 'var(--color-text-secondary)' }}>{brief.borderRunAnalysis.eligible ? 'Yes' : 'No'}</p>
          </div>
          {brief.borderRunAnalysis.limitsPerYear && (
            <div>
              <Label>Annual Limit</Label>
              <p style={{ color: 'var(--color-text-secondary)' }}>{brief.borderRunAnalysis.limitsPerYear}</p>
            </div>
          )}
        </div>
        <div className="mb-3">
          <Label>Enforcement Posture</Label>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{brief.borderRunAnalysis.enforcementPosture}</p>
        </div>
        {brief.borderRunAnalysis.warnings.length > 0 && (
          <WarningBox header="Warnings" items={brief.borderRunAnalysis.warnings} />
        )}
      </SectionCard>

      {/* Recent Changes */}
      {brief.recentChanges.hasChanges && (
        <SectionCard>
          <SectionHeading>Recent Changes & Watch Items</SectionHeading>
          <ul className="text-sm space-y-2 mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            {brief.recentChanges.items.map((item, i) => <li key={i}>• {item}</li>)}
          </ul>
          {brief.recentChanges.watchItems.length > 0 && (
            <WarningBox header="Watch Items" items={brief.recentChanges.watchItems} />
          )}
        </SectionCard>
      )}

      {/* Source Citations */}
      {brief.confidenceScore.sourceCitations.length > 0 && (
        <SectionCard>
          <SectionHeading>Source Citations</SectionHeading>
          <ul className="space-y-2">
            {brief.confidenceScore.sourceCitations.map((cite, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <TierLabel tier={cite.tier} />
                <div>
                  <p style={{ color: 'var(--color-text-secondary)' }}>{cite.claim}</p>
                  <a
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs hover:underline break-all"
                    style={{ color: 'var(--color-secondary-light)' }}
                  >
                    {cite.url}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Conflict Report */}
      <div className="brief-section">
        <ConflictSection report={brief.conflictReport} forPrint={forPrint} />
      </div>

      {/* Contingency */}
      <div className="brief-section rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setContingencyOpen(!contingencyOpen)}
          className="w-full flex items-center justify-between px-5 py-3 transition-colors text-left"
          style={{ background: 'var(--color-bg-elevated)' }}
        >
          <span className="font-bold text-xl" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}><span style={{ color: 'var(--color-secondary)', marginRight: '0.4rem' }}>//</span>Contingency Planning</span>
          <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{contingencyOpen ? '▲' : '▼'}</span>
        </button>
        {showContingency && (
          <div className="px-5 py-4 space-y-4 text-sm" style={{ background: 'var(--color-bg-base)' }}>
            {brief.contingency.deniedEntrySteps.length > 0 && (
              <div>
                <Label>If Denied Entry</Label>
                <ul className="space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {brief.contingency.deniedEntrySteps.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </div>
            )}
            <div>
              <Label>Overstay Scenario</Label>
              <p style={{ color: 'var(--color-text-secondary)' }}>{brief.contingency.overstayScenario}</p>
            </div>
            {brief.contingency.emergencyContacts.length > 0 && (
              <div>
                <Label>Emergency Contacts</Label>
                <ul className="space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {brief.contingency.emergencyContacts.map((c, i) => <li key={i}>• {c}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="text-xs font-mono text-center pb-4" style={{ color: 'var(--color-text-tertiary)' }}>
        Generated {new Date(brief.metadata.generatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC · {brief.metadata.depth} depth
        {brief.metadata.degraded && <span className="ml-2" style={{ color: '#f59e0b' }}>· degraded output</span>}
      </div>

    </div>
  );
}
