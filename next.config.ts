import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
  org: 'sabaiwave',
  project: 'visascout',
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
