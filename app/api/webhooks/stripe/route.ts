import Stripe from 'stripe';
import { getStripe } from '@/src/lib/stripe';
import { getSupabase } from '@/src/lib/supabase';
import { log } from '@/src/lib/logger';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response('ok', { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const briefId = session.metadata?.brief_id;

  if (!briefId) {
    log.error('stripe webhook: missing brief_id in metadata', { sessionId: session.id });
    return new Response('Missing brief_id in metadata', { status: 400 });
  }

  const { data: briefRow, error: fetchError } = await getSupabase()
    .from('briefs')
    .select('payment_status')
    .eq('id', briefId)
    .single();

  if (fetchError || !briefRow) {
    log.error('stripe webhook: brief not found', { briefId, error: fetchError?.message });
    return new Response('Brief not found', { status: 404 });
  }

  // Idempotency guard — if already paid or already queued, skip
  if (briefRow.payment_status === 'paid') {
    log.info('stripe webhook: already processed, skipping', { briefId });
    return new Response('ok', { status: 200 });
  }

  // Queue the pipeline — return 200 immediately so Stripe doesn't retry
  // The cron processor at /api/cron/process-jobs picks this up within 1 minute
  const { error: jobError } = await getSupabase()
    .from('brief_jobs')
    .insert({ brief_id: briefId });

  if (jobError) {
    if (jobError.code === '23505') {
      // Unique constraint violation — job already queued (Stripe retry)
      log.info('stripe webhook: job already queued, skipping', { briefId });
      return new Response('ok', { status: 200 });
    }
    log.error('stripe webhook: failed to queue job', { briefId, error: jobError.message });
    return new Response('Failed to queue job', { status: 500 });
  }

  // Mark brief as queued so the pending page shows the right state
  await getSupabase()
    .from('briefs')
    .update({ payment_status: 'queued', stripe_session_id: session.id })
    .eq('id', briefId);

  log.info('stripe webhook: job queued', { briefId });
  return new Response('ok', { status: 200 });
}
