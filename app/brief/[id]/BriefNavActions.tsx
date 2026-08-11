'use client';

import { useState, useEffect, useRef } from 'react';
import { Share2, Printer, FileDown, Check } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import { useAuth } from '@clerk/nextjs';

interface BriefNavActionsProps {
  url: string;
  briefId: string;
  depth: string;
}

type PrefetchResult = { blob: Blob; filename: string };

// Button style tokens mapped from BriefDocument's nav-btn
const BTN_BASE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '7px 13px',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-tertiary)',
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  borderRadius: 0,
};

const BTN_SOLID: React.CSSProperties = {
  ...BTN_BASE,
  background: 'var(--color-secondary)',
  borderColor: 'var(--color-secondary)',
  color: 'var(--color-neutral)',
  fontWeight: 700,
};

export function BriefNavActions({ url, briefId, depth }: BriefNavActionsProps) {
  const { userId } = useAuth();
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const prefetchRef = useRef<Promise<PrefetchResult | null> | null>(null);

  useEffect(() => {
    prefetchRef.current = fetch(`/api/brief/${briefId}/pdf?intent=prefetch`)
      .then(async r => {
        if (!r.ok) return null;
        const blob = await r.blob();
        const disposition = r.headers.get('Content-Disposition');
        const match = disposition?.match(/filename="([^"]+)"/);
        return { blob, filename: match?.[1] ?? 'visascout-brief.pdf' };
      })
      .catch(() => null);
  }, [briefId]);

  function handleShare() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  function handlePrint() {
    window.print();
  }

  async function handleDownload() {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const prefetched = prefetchRef.current ? await prefetchRef.current : null;
      let blob: Blob;
      let filename: string;

      if (prefetched) {
        blob = prefetched.blob;
        filename = prefetched.filename;
      } else {
        const res = await fetch(`/api/brief/${briefId}/pdf`);
        if (!res.ok) {
          const err = new Error(`PDF generation failed — HTTP ${res.status}`);
          Sentry.setUser(userId ? { id: userId } : null);
          Sentry.captureException(err, { tags: { briefId, depth } });
          throw err;
        }
        blob = await res.blob();
        const disposition = res.headers.get('Content-Disposition');
        const match = disposition?.match(/filename="([^"]+)"/);
        filename = match?.[1] ?? 'visascout-brief.pdf';
      }

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'brief.pdf_downloaded', props: { briefId, depth } }),
      }).catch(() => {});
    } catch {
      setPdfError('PDF failed. Try again.');
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <button style={{ ...BTN_BASE, color: copied ? 'var(--color-success)' : 'var(--color-text-tertiary)' }} onClick={handleShare}>
        {copied ? <Check size={11} /> : <Share2 size={11} />}
        {copied ? 'Copied' : 'Share'}
      </button>
      <button style={BTN_BASE} onClick={handlePrint}>
        <Printer size={11} />
        Print
      </button>
      <button style={{ ...BTN_SOLID, opacity: pdfLoading ? 0.6 : 1 }} onClick={handleDownload} disabled={pdfLoading}>
        <FileDown size={11} />
        {pdfLoading ? 'Preparing…' : 'Download PDF'}
      </button>
      {pdfError && (
        <span style={{ fontSize: 10, color: 'var(--color-error)', fontFamily: 'var(--font-mono)' }}>
          {pdfError}
        </span>
      )}
    </div>
  );
}
