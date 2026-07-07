'use client';

import { useState } from 'react';
import { Link2, Check } from 'lucide-react';

export function BriefCopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase px-2.5 py-1.5 rounded transition-colors"
      style={{
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
        color: copied ? 'var(--color-success)' : 'var(--color-text-tertiary)',
        background: copied ? 'rgba(34,197,94,0.08)' : 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        cursor: 'pointer',
      }}
    >
      {copied ? <Check size={12} /> : <Link2 size={12} />}
      {copied ? 'Copied' : 'Copy Link'}
    </button>
  );
}
