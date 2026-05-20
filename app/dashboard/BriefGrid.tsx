'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { LayoutGroup } from 'framer-motion';
import { Button } from '@/app/components/ui/Button';
import { BriefCard } from './BriefCard';

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

  const effectiveTotal = Math.max(0, total - deletedIds.size);
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / PAGE_SIZE));

  return (
    <>
      <LayoutGroup>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          {briefs.map((brief) => (
            <BriefCard key={brief.id} brief={brief} onDelete={() => handleDelete(brief.id)} />
          ))}
        </div>
      </LayoutGroup>

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
