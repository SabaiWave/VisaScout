import type { Metadata, Viewport } from 'next';

import { Geist, DM_Serif_Display, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { ClerkFontFix } from '@/app/components/ClerkFontFix';
import { ThemeProvider } from '@/app/components/ThemeProvider';
import { ClerkThemeProvider } from '@/app/components/ClerkThemeProvider';
import { clientConfig } from '@/config/client';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://visascout.io';
  const APP_URL = rawAppUrl.startsWith('http') ? rawAppUrl : `https://${rawAppUrl}`;
  return {
    title: `VisaScout — ${clientConfig.tagline}`,
    description:
      'Know exactly what to do about your visa — sourced, confidence-scored, in under 60 seconds. Official policy + recent enforcement changes + real traveler experience.',
    metadataBase: new URL(APP_URL),
    openGraph: {
      title: `VisaScout — ${clientConfig.tagline}`,
      description: clientConfig.landingPage.hero.subhead,
      url: APP_URL,
      siteName: clientConfig.brandName,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `VisaScout — ${clientConfig.tagline}` }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `VisaScout — ${clientConfig.tagline}`,
      description: clientConfig.landingPage.hero.subhead,
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${dmSerifDisplay.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ background: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
      >
        <ThemeProvider attribute="data-theme" defaultTheme="dark">
          <ClerkThemeProvider>
            {children}
            <ClerkFontFix />
          </ClerkThemeProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
