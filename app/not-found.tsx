import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--color-bg-base)' }}
    >
      <p
        className="text-8xl font-bold mb-4"
        style={{ color: 'var(--color-secondary)', fontFamily: 'var(--font-mono)' }}
      >
        404
      </p>
      <h1
        className="text-3xl font-bold mb-3"
        style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
      >
        Page not found
      </h1>
      <p
        className="text-base mb-8 max-w-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        This page doesn&apos;t exist. If you followed a link, it may have moved or expired.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
