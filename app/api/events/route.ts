import { auth } from '@clerk/nextjs/server';
import { trackEvent } from '@/src/lib/analytics';

export const runtime = 'nodejs';

const ALLOWED_EVENTS = new Set(['brief.pdf_downloaded', 'brief.shared']);

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { event, props } = body as {
    event: string;
    props?: Record<string, string | number | boolean | null | undefined>;
  };

  if (!ALLOWED_EVENTS.has(event)) {
    return new Response(JSON.stringify({ error: 'Unknown event' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await trackEvent(event, { userId, ...props });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
