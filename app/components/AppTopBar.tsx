import Link from 'next/link';
import { navLinkStyle } from './ui/navLinkStyles';

// Landing-styled utility bar rendered above every sidebar-shell page's
// content (Dashboard, Generate Brief, Admin, Dev, Brief). Primary nav
// (Dashboard/Generate/Admin/Dev) already lives in AppSidebar — this bar is
// secondary/utility links only, not a second copy of it. Desktop only;
// MobileNav's drawer covers the same links below the lg breakpoint.
export function AppTopBar() {
  return (
    <div
      className="hidden lg:flex items-center justify-end gap-6 px-6 sticky top-0 z-30"
      style={{
        height: '52px',
        background: 'rgba(6,12,18,0.94)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--color-border-muted)',
      }}
    >
      <Link href="/" style={navLinkStyle}>Home</Link>
      <Link href="/how-it-works" style={navLinkStyle}>How It Works</Link>
      <Link href="/contact" style={navLinkStyle}>Contact</Link>
    </div>
  );
}
