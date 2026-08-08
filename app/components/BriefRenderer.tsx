'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import BriefDocument from './BriefDocument';
import { AGENT_DISPLAY_LABELS } from './AgentsDeployedScreen';
import type { VisaBrief } from '@/src/types/index';

export default function BriefRenderer({
  brief,
  nationality = '',
  destination = '',
  briefId,
  isPaidBrief = false,
  canRerun = false,
}: {
  brief: VisaBrief;
  nationality?: string;
  destination?: string;
  briefId?: string;
  isPaidBrief?: boolean;
  canRerun?: boolean;
  // legacy props — no longer used, accepted for backward compat during transition
  hideMetadata?: boolean;
  hideParsedSituation?: boolean;
}) {
  const router = useRouter();
  const [rerunLoading, setRerunLoading] = useState(false);
  const [rerunError, setRerunError] = useState<string | null>(null);

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

  return (
    <div>
      {/* Degraded notice — shown when agents failed */}
      {failedAgents.length > 0 && (
        <div
          style={{
            margin: '0 0 0 0',
            padding: '14px 18px',
            borderBottom: '1px solid rgba(245,158,11,0.25)',
            background: 'rgba(245,158,11,0.06)',
          }}
        >
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-amber)', marginBottom: '6px', fontWeight: 700 }}>
            {isPaidBrief ? 'Limited Data' : 'Data Note'}
          </p>
          {isPaidBrief && canRerun && briefId ? (
            <>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.6' }}>
                {failedAgentNames.join(', ')}{' '}{failedAgents.length === 1 ? 'was' : 'were'}{' '}unavailable during generation. Re-run to fetch fresh data. No additional charge.
              </p>
              <button
                onClick={handleRerun}
                disabled={rerunLoading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 16px',
                  fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 700,
                  background: 'rgba(245,158,11,0.15)',
                  border: '1px solid rgba(245,158,11,0.4)',
                  color: 'var(--color-amber)',
                  cursor: rerunLoading ? 'default' : 'pointer',
                  opacity: rerunLoading ? 0.5 : 1,
                }}
              >
                <RefreshCw size={12} style={rerunLoading ? { animation: 'spin 1s linear infinite' } : {}} />
                {rerunLoading ? 'Queuing Re-run...' : 'Re-run Brief'}
              </button>
              {rerunError && (
                <p style={{ fontSize: '11px', color: 'var(--color-error)', marginTop: '6px' }}>
                  {rerunError}
                </p>
              )}
            </>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
              {failedAgentNames.join(', ')}{' '}{failedAgents.length === 1 ? 'was' : 'were'}{' '}
              {isPaidBrief
                ? 'unavailable. Confidence is reduced for affected sections. Verify with official immigration sources before travel.'
                : 'unavailable. Recommendations are based on available sources. Verify directly with official immigration portals before travel.'
              }
            </p>
          )}
        </div>
      )}

      <BriefDocument
        brief={brief}
        meta={{ nationality, destination, briefId, generatedAt: brief.metadata.generatedAt }}
        mode="screen"
      />
    </div>
  );
}
