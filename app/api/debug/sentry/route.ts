import * as Sentry from '@sentry/nextjs';

export const runtime = 'nodejs';

// Throws a test error to verify Sentry is capturing events.
// Protected by DEBUG_ALLOWED — consistent with all other debug endpoints.
export async function GET() {
  if (!process.env.DEBUG_ALLOWED) {
    return new Response('Not found', { status: 404 });
  }

  const err = new Error('VisaScout Sentry test — if you see this in Sentry, it is working.');
  Sentry.captureException(err);
  await Sentry.flush(2000);

  return Response.json({ ok: true, message: 'Test error sent to Sentry. Check your Sentry dashboard.' });
}
