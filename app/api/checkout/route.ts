import { auth } from '@clerk/nextjs/server';
import { getStripe, PRICES } from '@/src/lib/stripe';
import { createShellBrief } from '@/src/lib/saveBrief';
import { log } from '@/src/lib/logger';

export const runtime = 'nodejs';

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
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { nationality, destination, visaType, freeform, depth } = body as Record<string, string>;

  if (!nationality || !destination || !freeform) {
    return new Response(JSON.stringify({ error: 'nationality, destination, and freeform are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (depth !== 'standard' && depth !== 'deep') {
    return new Response(JSON.stringify({ error: 'Checkout is only for standard or deep depth. Quick is free.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  const host = req.headers.get('host') ?? 'localhost:3000';
  const baseUrl = `${proto}://${host}`;

  let briefId: string;
  try {
    briefId = await createShellBrief({
      nationality,
      destination,
      visaType: visaType || undefined,
      freeform,
      depth,
      userId,
    });
  } catch (err) {
    log.error('createShellBrief failed', { error: err instanceof Error ? err.message : String(err) });
    return new Response(JSON.stringify({ error: 'Failed to initialize brief. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `VisaScout ${depth.charAt(0).toUpperCase() + depth.slice(1)} Brief` },
          unit_amount: PRICES[depth].amount,
        },
        quantity: 1,
      }],
      metadata: { brief_id: briefId, user_id: userId },
      success_url: `${baseUrl}/brief/pending?brief_id=${briefId}`,
      cancel_url: `${baseUrl}/?cancelled=true`,
    });

    log.info('checkout session created', { briefId, depth, destination });
    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    log.error('stripe checkout creation failed', { error: err instanceof Error ? err.message : String(err), briefId });
    return new Response(JSON.stringify({ error: 'Failed to create checkout session. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
