import type { Metadata } from 'next';
import { DM_Sans, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VisaScout — Visa intelligence for digital nomads',
  description:
    'Multi-agent visa intelligence for digital nomads and long-stay travelers. Official sources. Contradictions flagged. Confidence scored.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: 'var(--font-body), system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
