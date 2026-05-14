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
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    // Phase 7 — domain + email
    'RESEND_API_KEY',
    'NEXT_PUBLIC_APP_URL',
  ];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
  org: 'sabaiwave',
  project: 'visascout',
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
