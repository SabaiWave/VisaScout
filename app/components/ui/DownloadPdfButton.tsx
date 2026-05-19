'use client';

import { useState } from 'react';
import { Button } from './Button';

interface DownloadPdfButtonProps {
  briefId: string;
  depth?: string;
  className?: string;
}

export function DownloadPdfButton({ briefId, depth, className }: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/brief/${briefId}/pdf`);
      if (!response.ok) throw new Error('PDF generation failed');
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
    } catch {
      setError('PDF generation failed. Try again or contact support.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={loading} className={className}>
        {loading ? 'Preparing PDF…' : 'Download PDF'}
      </Button>
      {error && (
        <p
          className="text-xs mt-2"
          style={{ color: 'var(--color-error)', fontFamily: 'var(--font-mono)' }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
