import type { Metadata, Viewport } from 'next';

import { Barlow_Condensed, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { ClerkFontFix } from '@/app/components/ClerkFontFix';
import { ClerkThemeProvider } from '@/app/components/ClerkThemeProvider';
import { clientConfig } from '@/config/client';
import './globals.css';

// Cartographic Dark — single theme, no light mode. See DESIGN.md.
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});

// Cartographic Dark has no separate body sans — JetBrains Mono is the only
// body font. --font-body is aliased to --font-mono in globals.css rather than
// loading the family twice; component code that reads var(--font-body) needs
// no changes.

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://visascout.io';
  const APP_URL = rawAppUrl.startsWith('http') ? rawAppUrl : `https://${rawAppUrl}`;
  const description =
    'Visa requirements for Thailand, Vietnam, Japan, and 31 more destinations — checked fresh from official sources, with real enforcement data. Free quick check, no credit card.';
  return {
    title: `VisaScout — ${clientConfig.tagline}`,
    description,
    keywords: [
      'visa requirements',
      'Thailand visa',
      'Vietnam visa',
      'Japan visa',
      'Indonesia visa',
      'digital nomad visa',
      'long stay visa',
      'visa check',
      'immigration rules',
      'border run rules',
      'visa extension',
      'tourist visa',
    ],
    metadataBase: new URL(APP_URL),
    openGraph: {
      title: `VisaScout — ${clientConfig.tagline}`,
      description,
      url: APP_URL,
      siteName: clientConfig.brandName,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `VisaScout — ${clientConfig.tagline}` }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `VisaScout — ${clientConfig.tagline}`,
      description,
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
    },
    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
      : {}),
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlowCondensed.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body
        className="min-h-full flex flex-col"
        style={{ background: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
      >
        <ClerkThemeProvider>
          {children}
          <ClerkFontFix />
        </ClerkThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
