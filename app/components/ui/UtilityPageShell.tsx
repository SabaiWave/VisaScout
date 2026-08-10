import { UtilityNav } from '../UtilityNav';
import { ChartCornerMarks } from './ChartCornerMarks';
import { MiniFooter } from './MiniFooter';

interface UtilityPageShellProps {
  maxWidth?: string;
  mainClassName?: string;
  excludeFooterLink?: string;
  children: React.ReactNode;
}

// Shared chrome for legal/utility pages (How It Works, Terms, Privacy,
// Contact) — bloom background, chart corner marks, UtilityNav, and
// MiniFooter. Page content/copy is untouched, only passed through as
// children.
export function UtilityPageShell({ maxWidth = '860px', mainClassName = '', excludeFooterLink, children }: UtilityPageShellProps) {
  return (
    <div style={{ background: 'var(--color-bg-base)', minHeight: '100vh' }} className="relative">
      <div aria-hidden="true" className="chart-texture" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[480px] z-0" style={{ background: 'var(--bloom-app-bg)' }} />
      <ChartCornerMarks
        topLeft="VS-DOC · UTILITY PAGE"
        bottomRight="VISASCOUT · VISA INTELLIGENCE"
      />
      <UtilityNav />
      <main className={`relative z-10 mx-auto px-6 py-16 ${mainClassName}`} style={{ maxWidth }}>
        {children}
      </main>
      <MiniFooter exclude={excludeFooterLink} />
    </div>
  );
}
