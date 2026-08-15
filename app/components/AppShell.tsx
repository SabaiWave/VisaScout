import { AppSidebar } from './AppSidebar';
import { MobileNav } from '@/app/dashboard/MobileNav';
import { AppTopBar } from './AppTopBar';
import { TweaksPanel } from './dev/TweaksPanel';

interface AppShellProps {
  isAdmin: boolean;
  showDev: boolean;
  isSignedIn?: boolean;
  children: React.ReactNode;
}

// Shared sidebar-shell wrapper for every authenticated app page (Dashboard,
// Generate Brief, Admin, Dev, Brief). Each route's layout.tsx keeps its own
// auth()/redirect() logic and only renders this for the parts that follow —
// see app/dashboard/layout.tsx etc. for the pattern.
export function AppShell({ isAdmin, showDev, isSignedIn = true, children }: AppShellProps) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--color-bg-base)' }}>
      <div
        aria-hidden
        className="hidden lg:flex fixed z-0 pointer-events-none items-center gap-1.5"
        style={{
          bottom: 8, right: 20,
          fontFamily: 'var(--font-mono)', fontSize: '0.5rem',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
          opacity: 0.35,
        }}
      >
        <div style={{ width: 5, height: 5, background: 'var(--color-success)', flexShrink: 0 }} />
        Operational
      </div>
      <div aria-hidden className="chart-texture" />
      <AppSidebar isAdmin={isAdmin} showDev={showDev} isSignedIn={isSignedIn} />
      {/* position/zIndex lift the content column above .chart-texture, which is
          fixed at z-index 0 and would otherwise paint over static content. */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bloom-app-bg)', position: 'relative', zIndex: 1 }}>
        <MobileNav isAdmin={isAdmin} showDev={showDev} isSignedIn={isSignedIn} />
        <AppTopBar />
        {children}
      </div>
      {isAdmin && <TweaksPanel />}
    </div>
  );
}
