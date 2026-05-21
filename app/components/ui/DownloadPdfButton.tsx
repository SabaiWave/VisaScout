'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import * as Sentry from '@sentry/nextjs';
import { Button } from './Button';

interface DownloadPdfButtonProps {
  briefId: string;
  depth?: string;
  className?: string;
  forceError?: boolean;
}

export function DownloadPdfButton({ briefId, depth, className, forceError }: DownloadPdfButtonProps) {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(forceError ? 'PDF generation failed. Try again or contact support.' : null);

  useEffect(() => {
    if (!forceError) return;
    fetch('/api/debug/sim?event=brief.pdf_failed').catch(() => {});
  }, [forceError]);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
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
      const filename = match?.[1] ?? 'visascout-brief.pdf';
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
    } catch (err) {
      if (err instanceof Error && !err.message.startsWith('PDF generation failed — HTTP')) {
        Sentry.setUser(userId ? { id: userId } : null);
        Sentry.captureException(err, { tags: { briefId, depth: depth ?? 'unknown' }, extra: { userId: userId ?? null } });
        fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'brief.pdf_failed', props: { briefId, depth, errorMessage: err.message } }),
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
          <p className="text-xs font-bold uppercase mb-1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--color-error)' }}>
            PDF generation failed
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Try again or{' '}
            <a href="/contact" style={{ color: 'var(--color-primary)' }}>contact support</a>.
          </p>
        </div>
      )}
    </div>
  );
}
