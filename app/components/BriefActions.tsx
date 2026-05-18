'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';

interface BriefActionsProps {
  url: string;
  briefId: string;
  depth: string;
}

export default function BriefActions({ url, briefId, depth }: BriefActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — clipboard unavailable
    }
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'brief.shared', props: { briefId } }),
    }).catch(() => {});
  }

  function handlePrint() {
    window.print();
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'brief.pdf_downloaded', props: { briefId, depth } }),
    }).catch(() => {});
  }

  return (
    <div className="flex gap-3 mt-8">
      <Button variant="secondary" onClick={handlePrint}>
        Download PDF
      </Button>
      <Button variant="secondary" onClick={handleCopy}>
        {copied ? '✓ Copied' : 'Copy link'}
      </Button>
      <Button variant="ghost" asChild>
        <Link href="/">New Brief</Link>
      </Button>
    </div>
  );
}
