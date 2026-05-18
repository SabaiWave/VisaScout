import { AppHeader } from '@/app/components/AppHeader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }}>
      <AppHeader />
      {children}
    </div>
  );
}
