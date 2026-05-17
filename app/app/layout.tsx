import { HeaderAuth } from '@/app/components/HeaderAuth';
import { Wordmark } from '@/app/components/ui/Wordmark';
import { NavLink } from '@/app/components/ui/NavLink';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <header
        className="sticky top-0 z-50 border-b px-6 py-4"
        style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-muted)' }}
      >
        <div className="max-w-[1120px] mx-auto flex items-center justify-between">
          <Wordmark />
          <div className="flex items-center gap-2">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/dashboard">My Briefs</NavLink>
            <HeaderAuth />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
