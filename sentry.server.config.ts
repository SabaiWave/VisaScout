import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.ENVIRONMENT ?? 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
  tracesSampleRate: 1.0,
  debug: false,
});
