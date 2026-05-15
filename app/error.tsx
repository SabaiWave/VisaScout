'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--color-bg-base)' }}
    >
      <p
        className="text-8xl font-bold mb-4"
        style={{ color: 'var(--color-error)', fontFamily: 'var(--font-mono)' }}
      >
        Error
      </p>
      <h1
        className="text-3xl font-bold mb-3"
        style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
      >
        Something went wrong
      </h1>
      <p
        className="text-base mb-8 max-w-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        An unexpected error occurred. The team has been notified. Try again or return to the home page.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 rounded text-xs font-bold uppercase tracking-wider transition-colors"
          style={{ background: 'var(--color-secondary)', color: '#fff', fontFamily: 'var(--font-mono)' }}
        >
          Try again
        </button>
        <a
          href="/"
          className="px-6 py-3 rounded text-xs font-bold uppercase tracking-wider border transition-colors"
          style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
        >
          Back to home
        </a>
      </div>
    </div>
  );
}
