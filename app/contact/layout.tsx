import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — VisaScout',
  description: 'Questions, bug reports, or partnership inquiries. Reach the VisaScout team.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
