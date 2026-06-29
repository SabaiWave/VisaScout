import type { Metadata } from 'next';

import { Geist, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { ClerkFontFix } from '@/app/components/ClerkFontFix';
import { ThemeProvider } from '@/app/components/ThemeProvider';
import { ClerkThemeProvider } from '@/app/components/ClerkThemeProvider';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://visascout.io';
  const APP_URL = rawAppUrl.startsWith('http') ? rawAppUrl : `https://${rawAppUrl}`;
  return {
    title: 'VisaScout — Visa intelligence for digital nomads',
    description:
      'Know exactly what to do about your visa — sourced, confidence-scored, in under 60 seconds. Official policy + recent enforcement changes + real traveler experience.',
    metadataBase: new URL(APP_URL),
    openGraph: {
      title: 'VisaScout — Stop guessing. Know exactly where you stand.',
      description:
        'Official policy + recent enforcement changes + real traveler experience, synthesized into one structured brief. First brief free.',
      url: APP_URL,
      siteName: 'VisaScout',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'VisaScout — Visa intelligence for digital nomads',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'VisaScout — Stop guessing. Know exactly where you stand.',
      description:
        'Sourced, confidence-scored visa intelligence for SEA. In under 60 seconds.',
      images: ['/og-image.png'],
    },
    icons: {
      icon: [
        { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
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
      className={`${geist.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
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
