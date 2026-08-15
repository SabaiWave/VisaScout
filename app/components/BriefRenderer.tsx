'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import BriefDocument from './BriefDocument';
import { BriefNavActions } from '@/app/brief/[id]/BriefNavActions';
import { Button } from '@/app/components/ui/Button';
import { AGENT_DISPLAY_LABELS } from './agentLabels';
import type { VisaBrief } from '@/src/types/index';

export default function BriefRenderer({
  brief,
  nationality = '',
  destination = '',
  briefId,
  isPaidBrief = false,
  canRerun = false,
  initialPdfError,
}: {
  brief: VisaBrief;
  nationality?: string;
  destination?: string;
  briefId?: string;
  isPaidBrief?: boolean;
  canRerun?: boolean;
  initialPdfError?: string;
  // legacy props — no longer used, accepted for backward compat during transition
  hideMetadata?: boolean;
  hideParsedSituation?: boolean;
}) {
  const router = useRouter();
  const [rerunLoading, setRerunLoading] = useState(false);
  const [rerunError, setRerunError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(initialPdfError ?? null);

  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;

    // Wire collapse toggles
    document.querySelectorAll<HTMLElement>('.sh-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = btn.closest('.sec');
        if (!sec) return;
        const collapsed = sec.classList.toggle('collapsed');
        btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      }, { signal });
    });

    // Wire single expand/collapse all toggle
    const toggleBtn = document.querySelector<HTMLElement>('.all-toggle');
    let allCollapsed = false;
    toggleBtn?.addEventListener('click', () => {
      allCollapsed = !allCollapsed;
      document.querySelectorAll<HTMLElement>('.sec').forEach(sec => {
        const t = sec.querySelector<HTMLElement>('.sh-toggle');
        if (!t || getComputedStyle(t).display === 'none') return;
        sec.classList.toggle('collapsed', allCollapsed);
        t.setAttribute('aria-expanded', allCollapsed ? 'false' : 'true');
      });
      toggleBtn.setAttribute('data-state', allCollapsed ? 'collapsed' : 'expanded');
    }, { signal });

    // Wire TOC scroll-spy via scroll listener — more reliable than IntersectionObserver
    // when sections are short/collapsed and multiple fit in the viewport at once.
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('#bd-toc a'));
    const targets = links.map(a => document.querySelector(a.getAttribute('href') ?? ''));

    function getScrollParent(el: Element | null): Element | Window {
      if (!el) return window;
      const ov = getComputedStyle(el).overflowY;
      if (ov === 'auto' || ov === 'scroll') return el;
      return getScrollParent(el.parentElement);
    }
    const scrollTarget = getScrollParent(document.querySelector('.doc'));

    function updateToc() {
      const NAV_OFFSET = 88; // nav height + buffer
      let activeIdx = 0;
      targets.forEach((t, i) => {
        if (!(t instanceof Element)) return;
        if (t.getBoundingClientRect().top <= NAV_OFFSET) activeIdx = i;
      });
      links.forEach((a, n) => a.classList.toggle('on', n === activeIdx));
      const rail = document.querySelector<HTMLElement>('.rail');
      const link = links[activeIdx];
      if (rail && link) {
        const linkTop = link.offsetTop;
        const linkH = link.offsetHeight;
        const railH = rail.clientHeight;
        if (linkTop < rail.scrollTop || linkTop + linkH > rail.scrollTop + railH) {
          rail.scrollTop = linkTop - railH / 2 + linkH / 2;
        }
      }
    }

    if (links.length) {
      scrollTarget.addEventListener('scroll', updateToc, { signal, passive: true } as AddEventListenerOptions);
      updateToc();
    }

    return () => { ac.abort(); };
  }, [brief]);

  const failedAgents = brief.metadata?.agentStatuses?.filter(s => s.status === 'failed') ?? [];
  const failedAgentNames = failedAgents.map(s => {
    const key = (s.agent.charAt(0).toLowerCase() + s.agent.slice(1)) as keyof typeof AGENT_DISPLAY_LABELS;
    return AGENT_DISPLAY_LABELS[key] ?? s.agent;
  });

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

  const degradedNotice = failedAgents.length > 0 ? (
    <div
      style={{
        borderLeft: '3px solid var(--color-amber)',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-elevated)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-amber)', marginBottom: '5px', fontWeight: 700 }}>
          {isPaidBrief ? 'Limited Data' : 'Data Note'}
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6', margin: 0 }}>
          {failedAgentNames.join(', ')}{' '}{failedAgents.length === 1 ? 'was' : 'were'}{' '}
          {isPaidBrief && canRerun && briefId
            ? 'unavailable during generation. Re-run to fetch fresh data. No additional charge.'
            : isPaidBrief
              ? 'unavailable. Confidence is reduced for affected sections. Verify with official immigration sources before travel.'
              : 'unavailable. Recommendations are based on available sources. Verify directly with official immigration portals before travel.'
          }
        </p>
        {rerunError && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-error)', marginTop: '6px' }}>
            {rerunError}
          </p>
        )}
      </div>
      {isPaidBrief && canRerun && briefId && (
        <Button
          variant="ghost"
          onClick={handleRerun}
          disabled={rerunLoading}
          className="hover:opacity-100"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px', flexShrink: 0,
            padding: '9px 16px',
            fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700,
            background: 'transparent',
            border: '1px solid var(--color-amber)',
            color: 'var(--color-amber)',
            cursor: rerunLoading ? 'default' : 'pointer',
            opacity: rerunLoading ? 0.5 : 1,
          }}
        >
          <RefreshCw size={11} style={rerunLoading ? { animation: 'spin 1s linear infinite' } : {}} />
          {rerunLoading ? 'Queuing...' : 'Re-run Brief'}
        </Button>
      )}
    </div>
  ) : undefined;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  const pdfErrorNotice = pdfError ? (
    <div
      style={{
        borderLeft: '3px solid var(--color-error)',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-error-bg)',
        padding: '14px 20px',
      }}
    >
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-error)', marginBottom: '5px', fontWeight: 700 }}>
        PDF Error
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6', margin: 0 }}>
        {pdfError}
      </p>
    </div>
  ) : undefined;

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', width: '100%' }}>
      {briefId && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 0 16px' }}>
          <BriefNavActions
            url={`${appUrl}/brief/${briefId}`}
            briefId={briefId}
            depth={brief.metadata.depth}
            onPdfError={setPdfError}
          />
        </div>
      )}
      <BriefDocument
        brief={brief}
        meta={{ nationality, destination, briefId, generatedAt: brief.metadata.generatedAt }}
        mode="screen"
        degradedNotice={degradedNotice}
        pdfErrorNotice={pdfErrorNotice}
      />
    </div>
  );
}
