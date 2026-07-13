import { UserProfile } from '@clerk/nextjs';

export const metadata = { title: 'Account — VisaScout' };

// CSS vars don't resolve inside Clerk's element style injection — hardcode names.
const MONO = "'JetBrains Mono', 'Courier New', monospace";
const DISPLAY = "'Space Grotesk', system-ui, sans-serif";
const BODY = "'Geist', system-ui, sans-serif";

const mono = {
  fontFamily: MONO,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
};

const hudAppearance = {
  elements: {
    // Card shell — no shadow, HUD border
    card: {
      boxShadow: 'none',
      borderRadius: '12px',
      border: '1px solid #1e1e2e',
    },
    // Left navbar panel
    navbar: { borderRadius: '12px 0 0 12px' },
    navbarHeader: { paddingBottom: '0.75rem', borderBottom: '1px solid #1e1e2e' },
    // "Account" title in left panel
    navbarHeaderTitle: { fontFamily: 'DISPLAY', fontSize: '1.25rem', fontWeight: 700 },
    // "Manage your account info." subtitle
    navbarHeaderDescription: { fontFamily: 'BODY', fontSize: '0.78rem' },
    // Nav items: PROFILE / SECURITY
    navbarButton: { ...mono, fontSize: '0.72rem', letterSpacing: '0.06em' },
    navbarButtonIcon: { display: 'none' },
    // Right panel — page title ("Profile details", "Security")
    pageHeaderTitle: { ...mono, fontSize: '0.72rem' },
    pageHeaderSubtitle: { fontFamily: 'BODY', fontSize: '0.78rem' },
    // Section row headings ("PROFILE", "EMAIL ADDRESSES", "CONNECTED ACCOUNTS")
    profileSectionTitleText: { ...mono, fontSize: '0.68rem' },
    // "Update profile" and similar action links
    profileSectionPrimaryButton: {
      fontFamily: 'var(--font-mono)',
      fontSize: '0.7rem',
      fontWeight: 600,
      letterSpacing: '0.04em',
    },
    // Form field labels inside edit modals
    formFieldLabel: { ...mono, fontSize: '0.68rem' },
    // Badges ("Primary", "This device")
    badge: {
      fontFamily: 'var(--font-mono)',
      fontSize: '0.6rem',
      fontWeight: 700,
      letterSpacing: '0.06em',
      borderRadius: '4px',
    },
    // Active device info text
    activeDeviceBrowser: { fontFamily: 'var(--font-mono)', fontSize: '0.72rem' },
    activeDeviceIpAddress: { fontFamily: 'var(--font-mono)', fontSize: '0.68rem' },
    activeDeviceLastActive: { fontFamily: 'var(--font-mono)', fontSize: '0.65rem' },
    formattedDate: { fontFamily: 'var(--font-mono)', fontSize: '0.68rem' },
  },
};

export default function AccountPage() {
  return (
    <main
      style={{
        padding: '2rem 1.5rem',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100%',
      }}
    >
      <UserProfile appearance={hudAppearance} />
    </main>
  );
}
