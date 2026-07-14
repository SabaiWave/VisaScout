import { UserProfile } from '@clerk/nextjs';

export const metadata = { title: 'Account — VisaScout' };

const hudAppearance = {
  elements: {
    card: {
      boxShadow: 'none',
      borderRadius: '12px',
      border: '1px solid #1e1e2e',
    },
    navbar: { borderRadius: '12px 0 0 12px' },
    navbarHeader: { paddingBottom: '0.75rem', borderBottom: '1px solid #1e1e2e' },
    navbarButtonIcon: { display: 'none' },
    badge: { borderRadius: '4px' },
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
