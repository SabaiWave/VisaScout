'use client';

import type { VisaBrief, VisaOption, ConflictReport } from '@/src/types/index';
import { DEPTH_LABEL, DEPTH_CTA } from '@/src/lib/depth';
import { useState } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { ConfidenceBadge, TierLabel } from './ui/Badge';
import { BriefMeta } from './ui/BriefMeta';
import { CardHeading } from './ui/CardHeading';
import { Button } from './ui/Button';

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

function DepthGateTeaser({ title, message, href }: { title: string; message: string; href: string }) {
  return (
    <div className="brief-section rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ background: 'var(--color-bg-elevated)' }}>
        <CardHeader title={title} />
        <Lock size={14} className="flex-shrink-0 ml-4" style={{ color: 'var(--color-text-tertiary)' }} />
      </div>
      <div className="px-5 py-5" style={{ background: 'var(--color-bg-base)' }}>
        <p className="text-sm flex items-center gap-1.5 flex-wrap" style={{ color: 'var(--color-text-secondary)' }}>
          {message}{' '}
          <a href={href} className="inline-flex items-center gap-0.5" style={{ color: 'var(--color-secondary)', textDecoration: 'underline' }}>
            Upgrade <ArrowRight size={12} />
          </a>
        </p>
      </div>
    </div>
  );
}

function WarningBox({ header, items }: { header: string; items: string[] }) {
  return (
    <div className="rounded-lg px-4 py-3 border space-y-2" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)', boxShadow: 'var(--shadow-amber)' }}>
      <Label color="var(--color-amber)">{header}</Label>
      {items.map((w, i) => (
        <p key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="flex-shrink-0" style={{ color: 'var(--color-amber)' }}>⚠</span><span>{w}</span>
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
      <Button
        variant="ghost"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 transition-colors text-left normal-case tracking-normal border-0 rounded-none hover:opacity-100"
        style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
      >
        {header}
        <span className="text-sm flex-shrink-0 ml-4" style={{ color: 'var(--color-text-tertiary)' }}>{open ? '▲' : '▼'}</span>
      </Button>
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
  const bg = {
    best:       'rgba(34,197,94,0.06)',
    good:       'rgba(99,102,241,0.06)',
    acceptable: 'var(--color-bg-base)',
  }[option.suitability];
  const suitabilityLabel = { best: 'Best Fit', good: 'Good Fit', acceptable: 'Acceptable' }[option.suitability];
  const badgeColors = {
    best:       { background: 'rgba(34,197,94,0.15)', color: 'var(--color-success)' },
    good:       { background: 'rgba(99,102,241,0.12)', color: 'var(--color-secondary-light)' },
    acceptable: { background: 'var(--color-bg-overlay)', color: 'var(--color-text-tertiary)' },
  }[option.suitability];

  return (
    <div
      className="rounded-lg p-4 mb-3 border"
      style={{ background: bg, borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{option.name}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xs font-bold uppercase flex-shrink-0" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>Max Stay</span>
            <span className="text-xs" style={{ color: 'var(--color-secondary-light)', fontFamily: 'var(--font-mono)' }}>{option.maxStay}</span>
          </div>
        </div>
        <span
          className="text-[0.65rem] font-bold uppercase px-2 py-0.5 flex-shrink-0"
          style={{ ...badgeColors, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', borderRadius: '4px' }}
        >
          {suitabilityLabel}
        </span>
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
      {option.applicationDocs && option.applicationDocs.length > 0 && (
        <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-border-muted)' }}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-text-tertiary)' }}>
              Application Documents
            </span>
            {option.applicationUrl && (
              <a
                href={option.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.65rem] font-bold uppercase px-2 py-0.5"
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-secondary)', background: 'rgba(99,102,241,0.10)', borderRadius: '4px' }}
              >
                Apply Online ↗
              </a>
            )}
          </div>
          <ul className="space-y-1">
            {option.applicationDocs.map((doc, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-secondary)', opacity: 0.6 }}>•</span>
                {doc}
              </li>
            ))}
          </ul>
        </div>
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
  const badge = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <ConfidenceBadge level={report.overallConfidence} />
      {report.contested.length > 0 && (
        <span style={{ color: 'var(--color-amber)' }}>({report.contested.length} contested)</span>
      )}
    </span>
  );
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
            <div key={i} className="mb-3 text-sm flex gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--color-amber)' }} />
              <div>
                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.topic}</span>
                <p style={{ color: 'var(--color-text-secondary)' }}>{item.description}</p>
                {item.resolution && (
                  <div className="mt-2">
                    <Label color="var(--color-amber)">Resolution</Label>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{item.resolution}</p>
                  </div>
                )}
              </div>
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

export default function BriefRenderer({ brief, forPrint = false, hideMetadata = false, hideParsedSituation = false }: { brief: VisaBrief; forPrint?: boolean; hideMetadata?: boolean; hideParsedSituation?: boolean }) {
  return (
    <div className="space-y-6 max-w-[760px] mx-auto">
      {/* We Understood */}
      {!hideParsedSituation && brief.parsedSituation && (
        <div
          className="brief-section rounded-xl px-4 py-3 border"
          style={{ background: 'var(--color-secondary-subtle)', borderColor: 'rgba(99,102,241,0.2)', boxShadow: 'var(--shadow-card)' }}
        >
          <CardHeading>We Understood</CardHeading>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{brief.parsedSituation}</p>
        </div>
      )}

      {/* Recommended Action */}
      <div
        className="brief-section rounded-lg overflow-hidden"
        style={{
          border: '1px solid var(--color-border-amber)',
          boxShadow: 'var(--shadow-amber)',
        }}
      >
        <div className="px-5 py-2.5" style={{ background: 'rgba(245,158,11,0.14)', borderBottom: '1px solid var(--color-border-amber)' }}>
          <Label color="var(--color-amber)">Recommended Action</Label>
        </div>
        <div className="px-5 py-4" style={{ background: 'rgba(245,158,11,0.06)' }}>
          <p className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{brief.recommendedAction.action}</p>
          {brief.recommendedAction.deadline && (
            <p className="text-sm font-semibold" style={{ color: 'var(--color-error)' }}>Deadline: {brief.recommendedAction.deadline}</p>
          )}
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>{brief.recommendedAction.rationale}</p>
          {brief.recommendedAction.stalePolicyWarning && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border-amber)' }}>
              <p className="text-xs font-bold leading-relaxed" style={{ color: 'var(--color-amber)', fontFamily: 'var(--font-mono)' }}>
                {brief.recommendedAction.stalePolicyWarning}
              </p>
              {brief.metadata.depth === 'quick' && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {DEPTH_LABEL.standard} and {DEPTH_LABEL.deep} include a dedicated Recent Changes agent with retry.{' '}
                  <a href="/app?depth=standard" className="inline-flex items-center gap-0.5" style={{ color: 'var(--color-secondary)', textDecoration: 'underline' }}>
                    Upgrade <ArrowRight size={11} />
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <VisaOptionsSection options={brief.visaOptions} forPrint={forPrint} />
      <EntryRequirementsSection req={brief.entryRequirements} forPrint={forPrint} />
      {brief.metadata.depth === 'quick' ? (
        <DepthGateTeaser
          title="Border Run Analysis"
          message={`Border run analysis included in ${DEPTH_LABEL.standard} and ${DEPTH_LABEL.deep}.`}
          href="/app?depth=standard"
        />
      ) : (
        <BorderRunSection analysis={brief.borderRunAnalysis} forPrint={forPrint} />
      )}
      <RecentChangesSection changes={brief.recentChanges} forPrint={forPrint} />
      <SourceCitationsSection citations={brief.confidenceScore.sourceCitations} forPrint={forPrint} />
      {brief.metadata.depth === 'quick' ? (
        (() => {
          const contested = brief.conflictReport.contested.length + brief.conflictReport.unverified.length;
          return contested > 0 ? (
            <DepthGateTeaser
              title="Conflict Report"
              message={`${contested} contested policy item${contested !== 1 ? 's' : ''} identified. ${DEPTH_LABEL.standard} and ${DEPTH_LABEL.deep} include full conflict resolution.`}
              href="/app?depth=standard"
            />
          ) : null;
        })()
      ) : (
        <ConflictSection report={brief.conflictReport} forPrint={forPrint} />
      )}
      {brief.metadata.depth === 'quick' ? (
        <DepthGateTeaser
          title="Contingency Planning"
          message={`Contingency planning included in ${DEPTH_LABEL.standard} and ${DEPTH_LABEL.deep}.`}
          href="/app?depth=standard"
        />
      ) : (
        <ContingencySection contingency={brief.contingency} forPrint={forPrint} />
      )}

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
