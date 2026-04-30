import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';

// Throws a test error to verify Sentry is capturing events.
// Protected in production by SENTRY_TEST_ALLOWED env var.
export async function GET() {
  if (process.env.NODE_ENV === 'production' && !process.env.SENTRY_TEST_ALLOWED) {
    return new Response('Not found', { status: 404 });
  }

  const err = new Error('VisaScout Sentry test — if you see this in Sentry, it is working.');
  Sentry.captureException(err);
  await Sentry.flush(2000);

  return Response.json({ ok: true, message: 'Test error sent to Sentry. Check your Sentry dashboard.' });
}
