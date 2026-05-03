'use client';

import { useState } from 'react';

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
      <button
        onClick={() => window.print()}
        className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-[#1e3a5f] text-[#1e3a5f] hover:bg-gray-50 transition-colors"
      >
        Download PDF
      </button>
      <button
        onClick={handleCopy}
        className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
      >
        {copied ? '✓ Copied' : 'Copy link'}
      </button>
      <a
        href="/"
        className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
      >
        New Brief
      </a>
    </div>
  );
}
