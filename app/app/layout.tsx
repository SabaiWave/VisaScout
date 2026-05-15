import Link from 'next/link';
import { HeaderAuth } from '@/app/components/HeaderAuth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <header
        className="sticky top-0 z-50 border-b px-6 py-4"
        style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-muted)' }}
      >
        <div className="max-w-[1120px] mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-bold uppercase tracking-widest no-underline"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}
          >
            <span style={{ color: 'var(--color-secondary)' }}>//</span>{' '}VisaScout
          </Link>
          <HeaderAuth />
        </div>
      </header>
      {children}
    </div>
  );
}
