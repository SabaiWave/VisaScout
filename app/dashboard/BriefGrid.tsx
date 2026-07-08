'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, MotionConfig } from 'framer-motion';
import { Button } from '@/app/components/ui/Button';
import { BriefCard } from './BriefCard';

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const gridContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EXPO } },
};

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

  const effectiveTotal = Math.max(0, total - deletedIds.size);
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / PAGE_SIZE));

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        variants={gridContainer}
        initial="hidden"
        animate="show"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {briefs.map((brief) => (
          <BriefCard key={brief.id} brief={brief} onDelete={() => handleDelete(brief.id)} />
        ))}
      </motion.div>

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
    </MotionConfig>
  );
}
