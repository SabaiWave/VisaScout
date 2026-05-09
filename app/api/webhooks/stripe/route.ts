import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import { getStripe } from '@/src/lib/stripe';
import { getSupabase } from '@/src/lib/supabase';
import { runOrchestrator } from '@/src/orchestrator';
import { resolveConflicts } from '@/src/synthesis/conflictResolver';
import { synthesizeBrief } from '@/src/synthesis/synthesize';
import { updateBriefWithContent } from '@/src/lib/saveBrief';
import { runDryPipeline } from '@/src/lib/dryRun';
import { log } from '@/src/lib/logger';
import type { VisaInput } from '@/src/types/index';

export const runtime = 'nodejs';
// Vercel Pro: allow up to 300s — pipeline can take 150–240s at deep depth
export const maxDuration = 300;

const DRY_RUN = process.env.DRY_RUN === 'true';

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
    .select('nationality, destination, visa_type, freeform_input, depth, payment_status')
    .eq('id', briefId)
    .single();

  if (fetchError || !briefRow) {
    log.error('stripe webhook: brief not found', { briefId, error: fetchError?.message });
    return new Response('Brief not found', { status: 404 });
  }

  // Idempotency guard — Stripe retries if we don't respond within 30s (pipeline takes 150–240s)
  if (briefRow.payment_status === 'paid') {
    log.info('stripe webhook: already processed, skipping', { briefId });
    return new Response('ok', { status: 200 });
  }

  log.info('stripe webhook: running pipeline', { briefId, destination: briefRow.destination, depth: briefRow.depth });

  try {
    let brief;
    let visaRequest;

    if (DRY_RUN) {
      const result = await runDryPipeline(() => {});
      brief = result.brief;
      visaRequest = result.visaRequest;
    } else {
      const input: VisaInput = {
        nationality: briefRow.nationality,
        destination: briefRow.destination,
        visaType: briefRow.visa_type ?? undefined,
        freeform: briefRow.freeform_input ?? '',
      };
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const startTime = Date.now();

      const envelope = await runOrchestrator(input, client, briefRow.depth, (parsed) => { visaRequest = parsed; });
      if (!visaRequest) visaRequest = envelope.visaRequest;

      const conflictReport = await resolveConflicts(envelope, client);
      brief = await synthesizeBrief(envelope, conflictReport, client, briefRow.depth, startTime);
    }

    await updateBriefWithContent({
      briefId,
      visaRequest,
      brief,
      stripeSessionId: session.id,
      paymentStatus: 'paid',
    });

    log.info('stripe webhook: pipeline complete', { briefId, destination: briefRow.destination });
  } catch (err) {
    log.error('stripe webhook: pipeline failed', { briefId, error: err instanceof Error ? err.message : String(err) });
    // Mark as error so pending page can surface it
    await getSupabase()
      .from('briefs')
      .update({ payment_status: 'error', stripe_session_id: session.id })
      .eq('id', briefId);
  }

  return new Response('ok', { status: 200 });
}
