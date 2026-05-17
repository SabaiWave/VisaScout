'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';

export default function BriefActions({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — clipboard unavailable
    }
  }

  return (
    <div className="flex gap-3 mt-8">
      <Button variant="secondary" onClick={() => window.print()}>
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
