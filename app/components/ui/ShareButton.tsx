'use client';

import { useState } from 'react';
import { Button } from './Button';
import type { ButtonProps } from './Button';

interface ShareButtonProps {
  url: string;
  briefId: string;
  className?: string;
  size?: ButtonProps['size'];
}

export function ShareButton({ url, briefId, className, size }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
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

  return (
    <Button variant="secondary" size={size} onClick={handleClick} className={className}>
      {copied ? '✓ Copied' : 'Copy Link'}
    </Button>
  );
}
