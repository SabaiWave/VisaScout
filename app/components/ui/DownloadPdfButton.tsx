'use client';


import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import * as Sentry from '@sentry/nextjs';
import { Button } from './Button';

interface DownloadPdfButtonProps {
  briefId: string;
  depth?: string;
  className?: string;
  forceError?: boolean;
}

type PrefetchResult = { blob: Blob; filename: string };

export function DownloadPdfButton({ briefId, depth, className, forceError }: DownloadPdfButtonProps) {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(forceError ? 'PDF generation failed. Try again or contact support.' : null);
  // Prefetch PDF in background so click is instant for users who read before downloading.
  // Resolves to null on failure — click falls back to a fresh fetch.
  const prefetchRef = useRef<Promise<PrefetchResult | null> | null>(null);

  useEffect(() => {
    if (forceError) {
      fetch('/api/debug/sim?event=brief.pdf_failed').catch(() => {});
      return;
    }
    prefetchRef.current = fetch(`/api/brief/${briefId}/pdf?intent=prefetch`)
      .then(async (r) => {
        if (!r.ok) return null;
        const blob = await r.blob();
        const disposition = r.headers.get('Content-Disposition');
        const match = disposition?.match(/filename="([^"]+)"/);
        return { blob, filename: match?.[1] ?? 'visascout-brief.pdf' };
      })
      .catch(() => null);
  }, [briefId, forceError]);

  function triggerDownload(blob: Blob, filename: string) {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      // Use prefetched result if available; otherwise fall back to a fresh fetch.
      const prefetched = prefetchRef.current ? await prefetchRef.current : null;

      if (prefetched) {
        triggerDownload(prefetched.blob, prefetched.filename);
      } else {
        const response = await fetch(`/api/brief/${briefId}/pdf`);
        if (!response.ok) {
          const statusCode = response.status;
          const err = new Error(`PDF generation failed — HTTP ${statusCode}`);
          Sentry.setUser(userId ? { id: userId } : null);
          Sentry.captureException(err, { tags: { briefId, depth: depth ?? 'unknown' }, extra: { statusCode, userId: userId ?? null } });
          fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'brief.pdf_failed', props: { briefId, depth, statusCode } }),
          }).catch(() => {});
          throw err;
        }
        const blob = await response.blob();
        const disposition = response.headers.get('Content-Disposition');
        const match = disposition?.match(/filename="([^"]+)"/);
        triggerDownload(blob, match?.[1] ?? 'visascout-brief.pdf');
      }

      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'brief.pdf_downloaded', props: { briefId, depth } }),
      }).catch(() => {});
    } catch (err) {
      if (err instanceof Error && !err.message.startsWith('PDF generation failed — HTTP')) {
        Sentry.setUser(userId ? { id: userId } : null);
        Sentry.captureException(err, { tags: { briefId, depth: depth ?? 'unknown' }, extra: { userId: userId ?? null } });
        fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'brief.pdf_failed', props: { briefId, depth, errorMessage: err instanceof Error ? err.message : String(err) } }),
        }).catch(() => {});
      }
      setError('PDF generation failed. Try again or contact support.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={handleClick} disabled={loading} className={className}>
        {loading ? 'Preparing PDF…' : 'Download PDF'}
      </Button>
      {error && (
        <div
          className="rounded-lg px-4 py-3 border"
          style={{ background: 'var(--color-error-bg)', borderColor: 'var(--color-error-border)' }}
        >
          <p className="text-xs font-bold uppercase mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--color-error)' }}>
            PDF generation failed
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Try again or{' '}
            <a href="/contact" style={{ color: 'var(--color-secondary)' }}>contact support</a>.
          </p>
        </div>
      )}
    </div>
  );
}
