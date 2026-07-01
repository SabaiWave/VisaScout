import * as Sentry from '@sentry/nextjs';
import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/src/lib/adminAccess';

export const runtime = 'nodejs';

export async function GET() {
  const { userId } = await auth();
  if (!userId || !isAdminUser(userId)) {
    return new Response('Not found', { status: 404 });
  }

  const err = new Error('VisaScout Sentry test — if you see this in Sentry, it is working.');
  Sentry.captureException(err);
  await Sentry.flush(2000);

  return Response.json({ ok: true, message: 'Test error sent to Sentry. Check your Sentry dashboard.' });
}
