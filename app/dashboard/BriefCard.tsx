'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ConfidenceBadge, DepthBadge } from '@/app/components/ui/Badge';
import { ConfirmDialog } from '@/app/components/ui/ConfirmDialog';

// Minimum time to show "Generating" pulse after brief creation.
// Prevents jarring instant-complete flash when user navigates to dashboard
// while a brief is still in-flight or just finished.
const GENERATING_MIN_MS = 8000;

interface BriefRow {
  id: string;
  created_at: string;
  nationality: string;
  destination: string;
  depth: string;
  overall_confidence: string | null;
  payment_status: string;
  degraded: boolean;
}

export function BriefCard({ brief, onDelete }: { brief: BriefRow; onDelete?: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // Show generating pulse for at least GENERATING_MIN_MS after creation,
  // even if the server already marked it complete. Prevents awkward instant-done flash.
  const ageMs = Date.now() - new Date(brief.created_at).getTime();
  const serverIsGenerating = ['queued', 'processing', 'pending'].includes(brief.payment_status);
  const isGenerating = serverIsGenerating || ageMs < GENERATING_MIN_MS;

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/brief/${brief.id}`, { method: 'DELETE' });
      setDeleted(true);
      onDelete?.();
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <ConfirmDialog
        open={showConfirm}
        title="DELETE BRIEF"
        message={`Delete the ${brief.destination} brief? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        loading={deleting}
      />

      <AnimatePresence>
        {!deleted && (
          <motion.div
            layout
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Link href={`/brief/${brief.id}`} style={{ textDecoration: 'none' }} onClick={(e) => { if (showConfirm || deleting) e.preventDefault(); }}>
              <div
          className="visa-track-card"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirm(true); }}
            aria-label="Delete brief"
            title="Delete brief"
            className="brief-delete-btn"
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: 'var(--color-text-tertiary)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(239,68,68,0.85)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
          >
            <Trash2 size={16} />
          </button>

          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: '0 0 2px',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            paddingRight: '24px',
          }}>
            {brief.destination}
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem',
            color: 'var(--color-text-tertiary)',
            margin: '0 0 12px',
          }}>
            {brief.nationality}
          </p>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
            <DepthBadge depth={brief.depth as 'quick' | 'standard' | 'deep'} />
            {isGenerating && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-amber)' }}>
                <span className="animate-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-amber)', display: 'inline-block', flexShrink: 0 }} />
                Generating
              </span>
            )}
            {brief.overall_confidence && (
              <ConfidenceBadge level={brief.overall_confidence as 'high' | 'medium' | 'low'} />
            )}
            {brief.degraded && (
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(245,158,11,0.12)',
                color: 'var(--color-amber)',
              }}>
                DEGRADED
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
              {new Date(brief.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
              {' · '}
              {new Date(brief.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false })} UTC
            </span>
            <ArrowRight size={15} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
          </div>
        </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
