import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { trackEvent } from '@/src/lib/analytics';

const EventSchema = z.object({
  event: z.string().min(1).max(100),
  props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

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

  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { event, props } = parsed.data;

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
