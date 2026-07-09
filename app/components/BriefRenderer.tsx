'use client';

import type { VisaBrief, VisaOption, ConflictReport } from '@/src/types/index';
import { DEPTH_LABEL, DEPTH_CTA } from '@/src/lib/depth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, RefreshCw, Flag, ExternalLink, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import { ConfidenceBadge, TierLabel } from './ui/Badge';
import { BriefMeta } from './ui/BriefMeta';
import { CardHeading } from './ui/CardHeading';
import { Button } from './ui/Button';
import { AGENT_DISPLAY_LABELS } from './AgentsDeployedScreen';

// Strip em dashes from LLM-generated brief content — UI copy rule applies to rendered output too
function noDash(text: string): string {
  return text.replace(/ — /g, '. ').replace(/—/g, '. ');
}

// Render text with URLs as clickable links
function renderWithLinks(text: string): React.ReactNode {
  const clean = noDash(text);
  const parts = clean.split(/(https?:\/\/[^\s<>"()\[\]{};,]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-secondary)', textDecoration: 'underline', wordBreak: 'break-all' }}>{part}</a>
      : part
  );
}

function renderActionSteps(
  text: string,
  opts: { textClass?: string; textColor?: string } = {},
): React.ReactNode {
  const { textClass = 'text-base', textColor = 'var(--color-text-primary)' } = opts;
  const hasSteps = /Step\s+\d+[.:]/i.test(text);
  if (!hasSteps) {
    return (
      <p className={`${textClass} leading-relaxed`} style={{ color: textColor, textWrap: 'pretty' } as React.CSSProperties}>
        {renderWithLinks(text)}
      </p>
    );
  }
  const steps = text.split(/(?=Step\s+\d+[.:])/i).filter(s => s.trim());
  return (
    <ol className="space-y-3 pl-0 list-none">
      {steps.map((step, i) => {
        const labelMatch = step.match(/^(Step\s+\d+[.:])\s*/i);
        const label = labelMatch ? labelMatch[1].replace(/[.:]$/, '') : `Step ${i + 1}`;
        const content = step.replace(/^Step\s+\d+[.:]\s*/i, '').trim();
        return (
          <li key={i} className="flex gap-3 items-start">
            <span
              className="shrink-0 text-xs font-bold uppercase mt-0.5 px-2 py-0.5 rounded"
              style={{ color: 'var(--color-amber)', fontFamily: 'var(--font-mono)', background: 'rgba(245,158,11,0.12)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}
            >
              {label}
            </span>
            <span className={`${textClass} leading-relaxed`} style={{ color: textColor, textWrap: 'pretty' } as React.CSSProperties}>
              {renderWithLinks(content)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ─── Primitives ──────────────────────────────────────────────────────────────

function Label({ children, color, size = 'xs' }: { children: React.ReactNode; color?: string; size?: 'xs' | 'sm' | 'xl' }) {
  return (
    <p
      className={`text-${size} font-bold uppercase mb-2`}
      style={{ color: color ?? 'var(--color-secondary-light)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}
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
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-amber)' }} /><span>{noDash(w)}</span>
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
        className="w-full flex items-center justify-between px-5 py-3 min-h-[44px] transition-colors text-left normal-case tracking-normal border-0 rounded-none hover:opacity-100"
        style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
      >
        {header}
        {open ? <ChevronUp size={14} className="flex-shrink-0 ml-4" style={{ color: 'var(--color-text-tertiary)' }} /> : <ChevronDown size={14} className="flex-shrink-0 ml-4" style={{ color: 'var(--color-text-tertiary)' }} />}
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

function VisaOptionCard({ option, depth }: { option: VisaOption; depth: string }) {
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
      className="rounded-lg p-5 mb-4 border"
      style={{ background: bg, borderColor: 'var(--color-border)' }}
    >
      {/* Name + suitability badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="font-bold leading-snug" style={{ color: 'var(--color-text-primary)' }}>{option.name}</span>
        <span
          className="text-[0.65rem] font-bold uppercase px-2 py-0.5 flex-shrink-0"
          style={{ ...badgeColors, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', borderRadius: '4px' }}
        >
          {suitabilityLabel}
        </span>
      </div>

      {/* Max stay — stacked, label above value */}
      <div className="mb-4">
        <span className="text-xs font-bold uppercase block mb-0.5" style={{ color: 'var(--color-secondary-light)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>Max Stay</span>
        <span className="text-sm leading-snug" style={{ color: 'var(--color-text-primary)' }}>{noDash(option.maxStay)}</span>
      </div>

      <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)', textWrap: 'pretty' } as React.CSSProperties}>{noDash(option.summary)}</p>

      {(option.pros.length > 0 || option.cons.length > 0) && (
        <ul className="text-sm space-y-2 mt-3">
          {option.pros.map((p, i) => (
            <li key={`pro-${i}`} className="flex items-start gap-2">
              <span className="flex-shrink-0 text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>Pro</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{noDash(p)}</span>
            </li>
          ))}
          {option.cons.map((c, i) => (
            <li key={`con-${i}`} className="flex items-start gap-2">
              <span className="flex-shrink-0 text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--color-error)', fontFamily: 'var(--font-mono)' }}>Con</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{noDash(c)}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Application docs — gated for Scout */}
      <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-border-muted)' }}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold uppercase" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-text-tertiary)' }}>
            Application Documents
          </span>
          {depth !== 'quick' && option.applicationUrl && (
            <a
              href={option.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[0.65rem] font-bold uppercase px-2 py-0.5"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-secondary)', background: 'rgba(99,102,241,0.10)', borderRadius: '4px' }}
            >
              Apply Online <ExternalLink size={9} />
            </a>
          )}
        </div>
        {depth === 'quick' ? (
          <p className="text-sm flex items-center gap-1.5 flex-wrap" style={{ color: 'var(--color-text-tertiary)' }}>
            <Lock size={12} style={{ flexShrink: 0 }} />
            Available in Intel and Dossier.{' '}
            <a href="/app?depth=standard" className="inline-flex items-center gap-0.5" style={{ color: 'var(--color-secondary)', textDecoration: 'underline' }}>
              Upgrade <ArrowRight size={11} />
            </a>
          </p>
        ) : option.applicationDocs && option.applicationDocs.length > 0 ? (
          <ul className="list-disc pl-4 space-y-1.5">
            {option.applicationDocs.map((doc, i) => (
              <li key={i} className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {noDash(doc)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function VisaOptionsSection({ options, forPrint, depth }: { options: VisaOption[]; forPrint: boolean; depth: string }) {
  return (
    <CollapsibleCard header={<CardHeader title="Visa Options" />} forPrint={forPrint}>
      {options.map((opt, i) => <VisaOptionCard key={i} option={opt} depth={depth} />)}
    </CollapsibleCard>
  );
}

function EntryRequirementsSection({ req, forPrint }: { req: VisaBrief['entryRequirements']; forPrint: boolean }) {
  return (
    <CollapsibleCard header={<CardHeader title="Entry Requirements" />} forPrint={forPrint}>
      {req.documents.length > 0 && (
        <div>
          <Label>Required Documents</Label>
          <ul className="list-disc pl-4 text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
            {req.documents.map((d, i) => <li key={i}>{noDash(d)}</li>)}
          </ul>
        </div>
      )}
      {req.proofOfFunds && (
        <div>
          <Label>Proof of Funds</Label>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{noDash(req.proofOfFunds)}</p>
        </div>
      )}
      <div>
        <Label>Onward Ticket</Label>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{req.onwardTicket ? 'Required' : 'Not required'}</p>
      </div>
      {req.notes.length > 0 && (
        <ul className="list-disc pl-4 text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
          {req.notes.map((n, i) => <li key={i}>{noDash(n)}</li>)}
        </ul>
      )}
    </CollapsibleCard>
  );
}

function BorderRunSection({ analysis, forPrint }: { analysis: VisaBrief['borderRunAnalysis']; forPrint: boolean }) {
  return (
    <CollapsibleCard header={<CardHeader title="Border Run Analysis" />} forPrint={forPrint}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{noDash(analysis.enforcementPosture)}</p>
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
      <ul className="list-disc pl-4 text-sm space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
        {changes.items.map((item, i) => <li key={i}>{noDash(item)}</li>)}
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
              <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.topic}</span>
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
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.topic}</span>
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
              <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.topic}</span>
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
          <ul className="list-disc pl-4 text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
            {contingency.deniedEntrySteps.map((s, i) => <li key={i}>{noDash(s)}</li>)}
          </ul>
        </div>
      )}
      <div>
        <Label>Overstay Scenario</Label>
        {renderActionSteps(contingency.overstayScenario, { textClass: 'text-sm', textColor: 'var(--color-text-secondary)' })}
      </div>
      {contingency.emergencyContacts.length > 0 && (
        <div>
          <Label>Emergency Contacts</Label>
          <ul className="list-disc pl-4 text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
            {contingency.emergencyContacts.map((c, i) => <li key={i}>{noDash(c)}</li>)}
          </ul>
        </div>
      )}
    </CollapsibleCard>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function BriefRenderer({ brief, forPrint = false, hideMetadata = false, hideParsedSituation = false, briefId, isPaidBrief = false, canRerun = false }: { brief: VisaBrief; forPrint?: boolean; hideMetadata?: boolean; hideParsedSituation?: boolean; briefId?: string; isPaidBrief?: boolean; canRerun?: boolean }) {
  const failedAgents = brief.metadata?.agentStatuses?.filter(s => s.status === 'failed') ?? [];
  const router = useRouter();
  const [rerunLoading, setRerunLoading] = useState(false);
  const [rerunError, setRerunError] = useState<string | null>(null);

  async function handleRerun() {
    if (!briefId) return;
    setRerunLoading(true);
    setRerunError(null);
    try {
      const res = await fetch(`/api/brief/${briefId}/rerun`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setRerunError((body as { error?: string }).error ?? 'Re-run failed. Contact support.');
        return;
      }
      router.push(`/brief/${briefId}?pending=1`);
    } catch {
      setRerunError('Network error. Try again.');
    } finally {
      setRerunLoading(false);
    }
  }

  const failedAgentNames = failedAgents.map(s => {
    const key = (s.agent.charAt(0).toLowerCase() + s.agent.slice(1)) as keyof typeof AGENT_DISPLAY_LABELS;
    return AGENT_DISPLAY_LABELS[key] ?? s.agent;
  });

  return (
    <div className="space-y-6 max-w-[760px] mx-auto">
      {/* Degraded notice */}
      {failedAgents.length > 0 && (
        <div
          className="rounded-lg px-5 py-4 border"
          style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.25)' }}
        >
          <p className="text-xs font-bold uppercase mb-2" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-amber)' }}>
            {isPaidBrief ? 'Limited Data' : 'Data Note'}
          </p>
          {isPaidBrief && canRerun && briefId && !forPrint ? (
            <>
              <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                {failedAgentNames.join(', ')}{' '}{failedAgents.length === 1 ? 'was' : 'were'}{' '}unavailable during generation. Re-run to fetch fresh data. No additional charge. Takes a few minutes.
              </p>
              <button
                onClick={handleRerun}
                disabled={rerunLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 min-h-[44px] rounded text-xs font-bold uppercase transition-opacity disabled:opacity-50"
                style={{
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                  background: 'rgba(245,158,11,0.15)',
                  border: '1px solid rgba(245,158,11,0.4)',
                  color: 'var(--color-amber)',
                  cursor: rerunLoading ? 'default' : 'pointer',
                }}
              >
                <RefreshCw size={12} className={rerunLoading ? 'animate-spin' : ''} />
                {rerunLoading ? 'Queuing Re-run...' : 'Re-run Brief'}
              </button>
              {rerunError && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--color-error)', fontFamily: 'var(--font-body)' }}>
                  {rerunError}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {failedAgentNames.join(', ')}{' '}{failedAgents.length === 1 ? 'was' : 'were'}{' '}
              {isPaidBrief
                ? 'unavailable. Confidence is reduced for affected sections. Verify with official immigration sources before travel.'
                : 'unavailable. Recommendations are based on available sources. Verify directly with official immigration portals before travel.'
              }
            </p>
          )}
        </div>
      )}

      {/* We Understood */}
      {!hideParsedSituation && brief.parsedSituation && (
        <div
          className="brief-section rounded-lg px-5 py-4 border"
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
        <div className="px-5 py-5" style={{ background: 'rgba(245,158,11,0.06)' }}>
          {/* Deadline callout — most urgent, show first */}
          {brief.recommendedAction.deadline && (
            <div
              className="flex items-start gap-2.5 rounded px-3.5 py-3 mb-4"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <Flag size={12} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: '3px' }} />
              <div>
                <p className="text-xs font-bold uppercase mb-0.5" style={{ color: 'var(--color-error)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>Deadline</p>
                <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-error)' }}>{noDash(brief.recommendedAction.deadline)}</p>
              </div>
            </div>
          )}

          {/* Action */}
          {renderActionSteps(brief.recommendedAction.action)}

          {/* Rationale */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(245,158,11,0.18)' }}>
            <p className="text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--color-amber)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', opacity: 0.7 }}>Why</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)', textWrap: 'pretty' } as React.CSSProperties}>{renderWithLinks(brief.recommendedAction.rationale)}</p>
          </div>

          {/* Stale policy warning */}
          {brief.recommendedAction.stalePolicyWarning && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border-amber)' }}>
              <p className="text-xs font-bold leading-relaxed" style={{ color: 'var(--color-amber)', fontFamily: 'var(--font-mono)' }}>
                {noDash(brief.recommendedAction.stalePolicyWarning)}
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

      <VisaOptionsSection options={brief.visaOptions} forPrint={forPrint} depth={brief.metadata.depth} />
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
