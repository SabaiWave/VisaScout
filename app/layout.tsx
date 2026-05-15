import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://visascout.io';

export const metadata: Metadata = {
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#6366F1',
          colorBackground: '#111118',
          colorInputBackground: '#1C1C27',
          colorInputText: '#F4F4F5',
          colorText: '#F4F4F5',
          colorTextSecondary: '#A1A1AA',
          colorTextOnPrimaryBackground: '#ffffff',
          borderRadius: '0.5rem',
        },
        elements: {
          // ── Sign-in / Sign-up modal ──
          headerTitle: { color: '#F4F4F5' },
          headerSubtitle: { color: '#A1A1AA' },
          formFieldLabel: { color: '#A1A1AA' },
          formFieldHintText: { color: '#71717A' },
          formFieldInput: { backgroundColor: '#1C1C27', borderColor: '#2D2D3D', color: '#F4F4F5' },
          dividerText: { color: '#71717A' },
          dividerLine: { backgroundColor: '#2D2D3D' },
          socialButtonsBlockButton: { backgroundColor: '#1C1C27', borderColor: '#2D2D3D', color: '#F4F4F5' },
          socialButtonsBlockButtonText: { color: '#F4F4F5' },
          footerActionText: { color: '#A1A1AA' },
          identityPreviewText: { color: '#F4F4F5' },
          identityPreviewEditButtonIcon: { color: '#A1A1AA' },
          otpCodeFieldInput: { backgroundColor: '#1C1C27', borderColor: '#2D2D3D', color: '#F4F4F5' },

          // ── UserButton popover ──
          userButtonPopoverCard: { backgroundColor: '#111118', borderColor: '#2D2D3D' },
          userButtonPopoverActionButton: { color: '#F4F4F5' },
          userButtonPopoverActionButtonText: { color: '#F4F4F5' },
          userButtonPopoverActionButtonIcon: { color: '#A1A1AA' },
          userPreviewMainIdentifier: { color: '#F4F4F5' },
          userPreviewSecondaryIdentifier: { color: '#A1A1AA' },
          userButtonPopoverFooter: { borderColor: '#2D2D3D' },

          // ── UserProfile modal (Manage Account) ──
          card: { backgroundColor: '#111118', borderColor: '#2D2D3D' },
          navbar: { backgroundColor: '#0A0A0A', borderColor: '#2D2D3D' },
          navbarHeader: { color: '#F4F4F5', opacity: 1 },
          navbarButton: { color: '#A1A1AA' },
          navbarButtonIcon: { color: '#A1A1AA' },
          pageScrollBox: { backgroundColor: '#111118' },
          profileSectionTitle: { color: '#F4F4F5', borderColor: '#2D2D3D' },
          profileSectionSubtitle: { color: '#A1A1AA' },
          profileSectionContent: { color: '#F4F4F5' },
          profileSectionPrimaryButton: { color: '#6366F1' },
          profileSectionItem: { borderColor: '#2D2D3D' },
          accordionTriggerButton: { color: '#F4F4F5' },
          badge: { color: '#F4F4F5', backgroundColor: '#1C1C27' },
          badgePrimary: { backgroundColor: '#1C1C27', color: '#A1A1AA' },
          tableHead: { color: '#A1A1AA' },
          paginationButton: { color: '#A1A1AA' },
          paginationButtonIcon: { color: '#A1A1AA' },
          activeDeviceIcon: { color: '#A1A1AA', filter: 'invert(1) brightness(0.6)' },
          activeDevice: { borderColor: '#2D2D3D', color: '#F4F4F5' },
          activeDeviceListItem: { borderColor: '#2D2D3D', color: '#F4F4F5' },
          activeDeviceBrowser: { color: '#A1A1AA' },
          activeDeviceIpAddress: { color: '#A1A1AA' },
          activeDeviceLastActive: { color: '#71717A' },
          // ── Broad text catch-all for manage account ──
          pageHeader: { color: '#F4F4F5' },
          pageHeaderTitle: { color: '#F4F4F5' },
          pageHeaderSubtitle: { color: '#A1A1AA' },
          profileSectionTitleText: { color: '#F4F4F5' },
          formattedDate: { color: '#A1A1AA' },
          identityPreviewEditButton: { color: '#6366F1' },
        },
      }}
    >
      <html
        lang="en"
        className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      >
        <body
          className="min-h-full flex flex-col"
          style={{ background: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
        >
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
