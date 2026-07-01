import { auth } from '@clerk/nextjs/server';
import { isAdminUser } from '@/src/lib/adminAccess';

export const runtime = 'nodejs';

export async function GET() {
  const { userId } = await auth();
  if (!userId || !isAdminUser(userId)) {
    return new Response('Not found', { status: 404 });
  }

  const token = process.env.BETTERSTACK_SOURCE_TOKEN;
  const url = process.env.BETTERSTACK_INGEST_URL;
  if (!token || !url) {
    return Response.json({ ok: false, error: 'BETTERSTACK_SOURCE_TOKEN or BETTERSTACK_INGEST_URL not set' }, { status: 500 });
  }

  const dt = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ dt, message: 'Hello from VisaScout dev tools!' }),
  });

  if (!res.ok) {
    return Response.json({ ok: false, status: res.status, statusText: res.statusText }, { status: 502 });
  }

  return Response.json({ ok: true, message: 'Log sent to BetterStack.', dt });
}
