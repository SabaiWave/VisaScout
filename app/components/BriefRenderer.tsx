'use client';

import type { VisaBrief, VisaOption, ConflictReport } from '@/src/types/index';
import { useState } from 'react';
import { ConfidenceBadge, TierLabel } from './ui/Badge';
import { BriefMeta } from './ui/BriefMeta';
import { CardHeading } from './ui/CardHeading';

// ─── Primitives ──────────────────────────────────────────────────────────────

function Label({ children, color, size = 'sm' }: { children: React.ReactNode; color?: string; size?: 'xs' | 'sm' | 'xl' }) {
  return (
    <p
      className={`text-${size} font-bold uppercase tracking-wider mb-1`}
      style={{ color: color ?? 'var(--color-secondary-light)', fontFamily: 'var(--font-mono)' }}
    >
      {children}
    </p>
  );
}

function CardHeader({ title, badge }: { title: string; badge?: React.ReactNode }) {
  return <CardHeading badge={badge}>{title}</CardHeading>;
}

function WarningBox({ header, items }: { header: string; items: string[] }) {
  return (
    <div className="rounded-lg px-4 py-3 border space-y-2" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)', boxShadow: 'var(--shadow-amber)' }}>
      <Label color="var(--color-amber)">{header}</Label>
      {items.map((w, i) => (
        <p key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--color-amber)' }}>
          <span className="flex-shrink-0">⚠</span><span>{w}</span>
        </p>
      ))}
    </div>
  );
}

function CollapsibleCard({
  header,
  children,
  forPrint = false,
  defaultOpen = true,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
  forPrint?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const showContent = forPrint || open;
  return (
    <div className="brief-section rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 transition-colors text-left focus-visible:outline-none"
        style={{ background: 'var(--color-bg-elevated)' }}
      >
        {header}
        <span className="text-sm flex-shrink-0 ml-4" style={{ color: 'var(--color-text-tertiary)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {showContent && (
        <div className="px-5 py-5 space-y-4" style={{ background: 'var(--color-bg-base)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Visa Option ─────────────────────────────────────────────────────────────

function VisaOptionCard({ option }: { option: VisaOption }) {
  const borderColor = {
    best:       'var(--color-success)',
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
        <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{option.name}</span>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-secondary-light)', fontFamily: 'var(--font-mono)' }}>Max stay: {option.maxStay}</span>
      </div>
      <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>{option.summary}</p>
      {(option.pros.length > 0 || option.cons.length > 0) && (
        <ul className="text-sm space-y-1.5 mt-2">
          {option.pros.map((p, i) => (
            <li key={`pro-${i}`} className="flex items-start gap-2">
              <span className="flex-shrink-0 text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>Pro</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{p}</span>
            </li>
          ))}
          {option.cons.map((c, i) => (
            <li key={`con-${i}`} className="flex items-start gap-2">
              <span className="flex-shrink-0 text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--color-error)', fontFamily: 'var(--font-mono)' }}>Con</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{c}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function VisaOptionsSection({ options, forPrint }: { options: VisaOption[]; forPrint: boolean }) {
  return (
    <CollapsibleCard header={<CardHeader title="Visa Options" />} forPrint={forPrint}>
      {options.map((opt, i) => <VisaOptionCard key={i} option={opt} />)}
    </CollapsibleCard>
  );
}

function EntryRequirementsSection({ req, forPrint }: { req: VisaBrief['entryRequirements']; forPrint: boolean }) {
  return (
    <CollapsibleCard header={<CardHeader title="Entry Requirements" />} forPrint={forPrint}>
      {req.documents.length > 0 && (
        <div>
          <Label>Required Documents</Label>
          <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
            {req.documents.map((d, i) => <li key={i}>• {d}</li>)}
          </ul>
        </div>
      )}
      {req.proofOfFunds && (
        <div>
          <Label>Proof of Funds</Label>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{req.proofOfFunds}</p>
        </div>
      )}
      <div>
        <Label>Onward Ticket</Label>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{req.onwardTicket ? 'Required' : 'Not required'}</p>
      </div>
      {req.notes.length > 0 && (
        <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
          {req.notes.map((n, i) => <li key={i}>• {n}</li>)}
        </ul>
      )}
    </CollapsibleCard>
  );
}

function BorderRunSection({ analysis, forPrint }: { analysis: VisaBrief['borderRunAnalysis']; forPrint: boolean }) {
  return (
    <CollapsibleCard header={<CardHeader title="Border Run Analysis" />} forPrint={forPrint}>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <Label>Eligible</Label>
          <p style={{ color: 'var(--color-text-secondary)' }}>{analysis.eligible ? 'Yes' : 'No'}</p>
        </div>
        {analysis.limitsPerYear && (
          <div>
            <Label>Annual Limit</Label>
            <p style={{ color: 'var(--color-text-secondary)' }}>{analysis.limitsPerYear}</p>
          </div>
        )}
      </div>
      <div>
        <Label>Enforcement Posture</Label>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{analysis.enforcementPosture}</p>
      </div>
      {analysis.warnings.length > 0 && (
        <WarningBox header="Warnings" items={analysis.warnings} />
      )}
    </CollapsibleCard>
  );
}

function RecentChangesSection({ changes, forPrint }: { changes: VisaBrief['recentChanges']; forPrint: boolean }) {
  if (!changes.hasChanges) return null;
  return (
    <CollapsibleCard header={<CardHeader title="Recent Changes & Watch Items" />} forPrint={forPrint}>
      <ul className="text-sm space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
        {changes.items.map((item, i) => <li key={i}>• {item}</li>)}
      </ul>
      {changes.watchItems.length > 0 && (
        <WarningBox header="Watch Items" items={changes.watchItems} />
      )}
    </CollapsibleCard>
  );
}

function SourceCitationsSection({ citations, forPrint }: { citations: VisaBrief['confidenceScore']['sourceCitations']; forPrint: boolean }) {
  if (citations.length === 0) return null;
  return (
    <CollapsibleCard header={<CardHeader title="Source Citations" />} forPrint={forPrint}>
      <ul className="space-y-3">
        {citations.map((cite, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <TierLabel tier={cite.tier} />
            <div>
              <p style={{ color: 'var(--color-text-secondary)' }}>{cite.claim}</p>
              <a
                href={cite.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs hover:underline break-all"
                style={{ color: 'var(--color-secondary-light)', fontFamily: 'var(--font-mono)' }}
              >
                {cite.url}
              </a>
            </div>
          </li>
        ))}
      </ul>
    </CollapsibleCard>
  );
}

function ConflictSection({ report, forPrint }: { report: ConflictReport; forPrint: boolean }) {
  const total = report.confirmed.length + report.contested.length + report.unverified.length;
  const badge = report.contested.length > 0
    ? <span style={{ color: 'var(--color-amber)' }}>({report.contested.length} contested)</span>
    : undefined;
  return (
    <CollapsibleCard header={<CardHeader title={`Conflict Report: ${total} item${total !== 1 ? 's' : ''}`} badge={badge} />} forPrint={forPrint}>
      {report.confirmed.length > 0 && (
        <div>
          <Label color="var(--color-success)">Confirmed</Label>
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
          <Label color="var(--color-amber)">Contested</Label>
          {report.contested.map((item, i) => (
            <div key={i} className="mb-2 text-sm border-l-2 pl-3" style={{ borderColor: 'var(--color-amber)' }}>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.topic}</span>
              <p style={{ color: 'var(--color-text-secondary)' }}>{item.description}</p>
              {item.resolution && (
                <div className="mt-2">
                  <Label color="var(--color-amber)">Resolution</Label>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{item.resolution}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {report.unverified.length > 0 && (
        <div>
          <Label color="var(--color-error)">Unverified</Label>
          {report.unverified.map((item, i) => (
            <div key={i} className="mb-2 text-sm">
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.topic}</span>
              <p style={{ color: 'var(--color-text-secondary)' }}>{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </CollapsibleCard>
  );
}

function ContingencySection({ contingency, forPrint }: { contingency: VisaBrief['contingency']; forPrint: boolean }) {
  return (
    <CollapsibleCard header={<CardHeader title="Contingency Planning" />} forPrint={forPrint}>
      {contingency.deniedEntrySteps.length > 0 && (
        <div>
          <Label>If Denied Entry</Label>
          <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
            {contingency.deniedEntrySteps.map((s, i) => <li key={i}>• {s}</li>)}
          </ul>
        </div>
      )}
      <div>
        <Label>Overstay Scenario</Label>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{contingency.overstayScenario}</p>
      </div>
      {contingency.emergencyContacts.length > 0 && (
        <div>
          <Label>Emergency Contacts</Label>
          <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
            {contingency.emergencyContacts.map((c, i) => <li key={i}>• {c}</li>)}
          </ul>
        </div>
      )}
    </CollapsibleCard>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function BriefRenderer({ brief, forPrint = false, hideMetadata = false }: { brief: VisaBrief; forPrint?: boolean; hideMetadata?: boolean }) {
  return (
    <div className="space-y-6 max-w-[760px] mx-auto">
      {/* Recommended Action */}
      <div
        className="brief-section border-l-4 rounded-r-lg px-5 py-4"
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
          <p className="text-sm font-semibold" style={{ color: 'var(--color-error)' }}>Deadline: {brief.recommendedAction.deadline}</p>
        )}
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>{brief.recommendedAction.rationale}</p>
        <div className="mt-2">
          <ConfidenceBadge level={brief.confidenceScore.overall} />
          <span className="ml-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>Overall Confidence</span>
        </div>
      </div>

      <VisaOptionsSection options={brief.visaOptions} forPrint={forPrint} />
      <EntryRequirementsSection req={brief.entryRequirements} forPrint={forPrint} />
      <BorderRunSection analysis={brief.borderRunAnalysis} forPrint={forPrint} />
      <RecentChangesSection changes={brief.recentChanges} forPrint={forPrint} />
      <SourceCitationsSection citations={brief.confidenceScore.sourceCitations} forPrint={forPrint} />
      <ConflictSection report={brief.conflictReport} forPrint={forPrint} />
      <ContingencySection contingency={brief.contingency} forPrint={forPrint} />

      {!hideMetadata && (
        <BriefMeta
          depth={brief.metadata.depth}
          generatedAt={brief.metadata.generatedAt}
          degraded={brief.metadata.degraded}
          center
          className="pb-4"
        />
      )}
    </div>
  );
}
