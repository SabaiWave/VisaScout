'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { BriefCard } from './BriefCard';

const GRID_CSS = `
  .db-list { border: 1px solid var(--color-border); }
  .db-head {
    display: grid;
    grid-template-columns: minmax(120px,2fr) minmax(100px,1.5fr) 80px 110px 80px 100px;
    align-items: center;
    height: 36px;
    padding: 0 16px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-elevated);
  }
  .db-head-label {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-tertiary);
  }
  .db-row {
    display: grid;
    grid-template-columns: minmax(120px,2fr) minmax(100px,1.5fr) 80px 110px 80px 100px;
    align-items: center;
    height: 64px;
    padding: 0 16px;
    border-bottom: 1px solid var(--color-border);
    cursor: pointer;
    transition: background 0.1s;
  }
  .db-row:last-child { border-bottom: none; }
  .db-cell { display: flex; align-items: center; gap: 8px; overflow: hidden; }
  .db-dest {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .db-sub {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .db-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 2px 7px;
    border: 1px solid;
    border-radius: 4px;
    white-space: nowrap;
  }
  .db-gen-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #c8780a;
    flex-shrink: 0;
    animation: db-pulse 1.2s ease-in-out infinite;
  }
  .db-tag {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    opacity: 0.8;
  }
  .db-cell-actions { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
  .db-view {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-secondary);
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    white-space: nowrap;
  }
  .db-del {
    background: transparent;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: var(--color-text-tertiary);
    display: flex;
    align-items: center;
    transition: color 0.15s, opacity 0.15s;
  }
  .db-del:hover { color: rgba(239,68,68,0.8); }
  .db-empty {
    border: 1px dashed var(--color-border);
    padding: 48px 24px;
    text-align: center;
  }
  .db-empty-text {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-text-tertiary);
    letter-spacing: 0.04em;
    margin-bottom: 20px;
  }
  @keyframes db-pulse { 0%,100% { opacity:1; } 50% { opacity:0.25; } }
  @media (max-width: 860px) {
    .db-head,
    .db-row { grid-template-columns: minmax(120px,2fr) 80px 80px 100px; }
    .db-cell-hide-sm { display: none; }
    .db-head-label-hide-sm { display: none; }
  }
  @media (max-width: 600px) {
    .db-head,
    .db-row { grid-template-columns: minmax(120px,2fr) 80px 100px; }
    .db-cell-hide-md { display: none; }
    .db-head-label-hide-md { display: none; }
  }
`;

const PAGE_SIZE = 12;

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

interface BriefGridProps {
  briefs: BriefRow[];
  total: number;
  page: number;
}

export function BriefGrid({ briefs, total, page }: BriefGridProps) {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  function handleDelete(id: string) {
    setDeletedIds((prev) => new Set([...prev, id]));
  }

  const visible = briefs.filter(b => !deletedIds.has(b.id));
  const effectiveTotal = Math.max(0, total - deletedIds.size);
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / PAGE_SIZE));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GRID_CSS }} />

      {visible.length === 0 ? (
        <div className="db-empty">
          <p className="db-empty-text">No briefs yet. Generate your first.</p>
          <a
            href="/app"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-secondary)', border: '1px solid var(--color-secondary)', padding: '10px 22px', textDecoration: 'none', display: 'inline-block' }}
          >
            Generate Brief
          </a>
        </div>
      ) : (
        <div className="db-list" style={{ marginBottom: '2rem' }}>
          {/* Header row */}
          <div className="db-head" role="row">
            <span className="db-head-label">Destination</span>
            <span className="db-head-label db-head-label-hide-sm">Nationality</span>
            <span className="db-head-label db-head-label-hide-sm">Depth</span>
            <span className="db-head-label db-head-label-hide-md">Date</span>
            <span className="db-head-label">Confidence</span>
            <span className="db-head-label" style={{ textAlign: 'right' }}>Actions</span>
          </div>

          {visible.map((brief) => (
            <BriefCard key={brief.id} brief={brief} onDelete={() => handleDelete(brief.id)} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
          {page > 1 && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="dash-pagination-btn inline-flex items-center gap-1.5 py-2"
              style={{ borderColor: 'var(--color-border-strong)' }}
            >
              <Link href={`/dashboard?page=${page - 1}`}>
                <ArrowLeft size={13} />
                Prev
              </Link>
            </Button>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', padding: '0 0.5rem' }}>
            PAGE {page} OF {totalPages}
          </span>
          {page < totalPages && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="dash-pagination-btn inline-flex items-center gap-1.5 py-2"
              style={{ borderColor: 'var(--color-border-strong)' }}
            >
              <Link href={`/dashboard?page=${page + 1}`}>
                Next
                <ArrowRight size={13} />
              </Link>
            </Button>
          )}
        </div>
      )}
    </>
  );
}
