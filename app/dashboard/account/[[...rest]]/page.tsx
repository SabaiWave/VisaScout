import { UserProfile } from '@clerk/nextjs';

export const metadata = { title: 'Account — VisaScout' };

// Clerk's appearance API requires literal color strings — cannot reference
// CSS custom properties. #1e3040 mirrors --color-border in globals.css.
const hudAppearance = {
  elements: {
    card: {
      boxShadow: 'none',
      borderRadius: '0px',
      border: '1px solid #1e3040',
    },
    navbar: { borderRadius: '0px' },
    navbarHeader: { paddingBottom: '0.75rem', borderBottom: '1px solid #1e3040' },
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
