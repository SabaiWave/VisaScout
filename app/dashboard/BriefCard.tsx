'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/app/components/ui/ConfirmDialog';
import { DEPTH_LABEL } from '@/src/lib/depth';

interface BriefRow {
  id: string;
  created_at: string;
  nationality: string;
  destination: string;
  depth: string;
  overall_confidence: string | null;
  payment_status: string;
  degraded: boolean;
  rerun_count: number;
}

const DEPTH_COLOR: Record<string, string> = {
  quick:    'var(--color-depth-quick)',
  standard: 'var(--color-depth-standard)',
  deep:     'var(--color-depth-deep)',
};

export function BriefCard({ brief, onDelete }: { brief: BriefRow; onDelete?: () => void }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const isGenerating = ['queued', 'processing', 'pending'].includes(brief.payment_status);
  const href = isGenerating ? `/brief/${brief.id}?pending=1` : `/brief/${brief.id}`;

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

  if (deleted) return null;

  const depthColor = DEPTH_COLOR[brief.depth] ?? 'var(--color-depth-standard)';
  const dateStr = new Date(brief.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

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

      <div
        className="db-row vs-row"
        role="button"
        tabIndex={0}
        style={{ background: hovered ? 'var(--color-bg-elevated)' : 'transparent', cursor: 'pointer' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => { if (!showConfirm && !deleting) router.push(href); }}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !showConfirm && !deleting) router.push(href); }}
        aria-label={`View ${brief.destination} brief`}
      >
        {/* Destination */}
        <div className="db-cell db-cell-dest">
          <span className="db-dest">{brief.destination}</span>
          {isGenerating && (
            <span className="db-gen-dot" />
          )}
          {brief.degraded && !isGenerating && (
            <span className="db-tag" style={{ color: 'var(--color-amber)' }}>DEGRADED</span>
          )}
        </div>

        {/* Nationality */}
        <div className="db-cell db-cell-hide-sm">
          <span className="db-sub">{brief.nationality}</span>
        </div>

        {/* Depth badge */}
        <div className="db-cell db-cell-badge db-cell-hide-sm">
          <span className="vs-badge vs-badge-outline" style={{ color: depthColor, borderColor: depthColor }}>
            {(DEPTH_LABEL[brief.depth as keyof typeof DEPTH_LABEL] ?? brief.depth).toUpperCase()}
          </span>
        </div>

        {/* Date */}
        <div className="db-cell db-cell-center db-cell-date db-cell-hide-md">
          <span className="db-sub">{dateStr}</span>
        </div>

        {/* Status */}
        <div className="db-cell db-cell-badge">
          {isGenerating ? (
            <span className="vs-badge vs-badge-outline" style={{ color: 'var(--color-amber)', borderColor: 'var(--color-amber)' }}>RUNNING</span>
          ) : brief.payment_status === 'error' ? (
            <span className="vs-badge vs-badge-outline" style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>ERROR</span>
          ) : (
            <span className="vs-badge vs-badge-outline" style={{ color: 'var(--color-confidence-high)', borderColor: 'var(--color-confidence-high)' }}>DONE</span>
          )}
        </div>

        {/* Actions */}
        <div className="db-cell db-cell-actions" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { if (!showConfirm) router.push(href); }}
            className="db-view"
            aria-label={`View ${brief.destination} brief`}
          >
            VIEW
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="db-del"
            aria-label="Delete brief"
            title="Delete brief"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </>
  );
}
