import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

// Fail the Vercel build early if required env vars are missing.
// Guarded by VERCEL=1 so local builds and CI are unaffected.
if (process.env.VERCEL === '1') {
  const required = [
    'ANTHROPIC_API_KEY',
    'TAVILY_API_KEY',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'BETTERSTACK_SOURCE_TOKEN',
    'BETTERSTACK_INGEST_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    // Phase 7 — domain + email
    'RESEND_API_KEY',
    'NEXT_PUBLIC_APP_URL',
    'SUPPORT_EMAIL',
    // Phase 10 — admin dashboard
    'ADMIN_USER_ID',
  ];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  async headers() {
    const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // script-src includes 'unsafe-inline'/'unsafe-eval' — required by Next.js hydration, Clerk, and Stripe.
    // Tighten to nonce-based CSP in a future pass once Clerk/Stripe support it.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https: wss:",
      "frame-src https://js.stripe.com https://*.stripe.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: appOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: 'sabaiwave',
  project: 'visascout',
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
